import { decimalAmount, centsFromPayPal } from './catalog.mjs';

const API = { sandbox: 'https://api-m.sandbox.paypal.com', live: 'https://api-m.paypal.com' };
export class PayPalError extends Error {
  constructor(code = 'paypal_unavailable') { super(code); this.code = code; }
}

export function paypalClient(env, fetcher = fetch) {
  const base = API[env.PAYPAL_ENV];
  if (!base || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) throw new PayPalError('paypal_not_configured');
  let token;
  async function call(path, { method = 'GET', body, requestId, rawBody } = {}) {
    if (!token) {
      const response = await fetcher(base + '/v1/oauth2/token', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { Authorization: 'Basic ' + btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
      });
      if (!response.ok) throw new PayPalError();
      token = (await response.json()).access_token;
      if (!token) throw new PayPalError();
    }
    const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    if (requestId) headers['PayPal-Request-Id'] = requestId;
    const response = await fetcher(base + path, {
      method, headers, redirect: 'error', signal: AbortSignal.timeout(15_000),
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const code = error.details?.some(item => item.issue === 'INSTRUMENT_DECLINED') ? 'instrument_declined' : 'paypal_unavailable';
      throw new PayPalError(code);
    }
    return response.json();
  }
  const validId = id => {
    if (typeof id !== 'string' || !/^[A-Z0-9]{1,36}$/.test(id)) throw new PayPalError('invalid_paypal_id');
    return id;
  };
  return {
    create(order, plan) {
      return call('/v2/checkout/orders', {
        method: 'POST', requestId: order.id,
        body: {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: plan.key, custom_id: order.id, invoice_id: order.id,
            description: plan.name + ' — pago único, contenido digital',
            payee: { merchant_id: env.PAYPAL_MERCHANT_ID },
            amount: { currency_code: 'USD', value: decimalAmount(plan.amountCents) },
          }],
          payment_source: { paypal: { experience_context: {
            brand_name: '100 Días — El Método', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW',
          } } },
        },
      });
    },
    getOrder(id) { return call('/v2/checkout/orders/' + validId(id)); },
    capture(order) { return call('/v2/checkout/orders/' + validId(order.paypal_order_id) + '/capture', { method: 'POST', requestId: order.capture_request_id, body: {} }); },
    getCapture(id) { return call('/v2/payments/captures/' + validId(id)); },
    async verifyWebhook(headers, raw) {
      const keys = { transmission_id: 'paypal-transmission-id', transmission_time: 'paypal-transmission-time', transmission_sig: 'paypal-transmission-sig', cert_url: 'paypal-cert-url', auth_algo: 'paypal-auth-algo' };
      const data = Object.fromEntries(Object.entries(keys).map(([key, header]) => [key, headers.get(header)]));
      if (Object.values(data).some(value => !value || value.length > 4096) || !env.PAYPAL_WEBHOOK_ID) return false;
      let cert;
      try { cert = new URL(data.cert_url); } catch { return false; }
      const hosts = env.PAYPAL_ENV === 'sandbox' ? ['api.sandbox.paypal.com', 'api-m.sandbox.paypal.com'] : ['api.paypal.com', 'api-m.paypal.com'];
      if (cert.protocol !== 'https:' || !hosts.includes(cert.hostname) || cert.port || cert.username || cert.password || !cert.pathname.startsWith('/v1/notifications/certs/')) return false;
      data.webhook_id = env.PAYPAL_WEBHOOK_ID;
      // Preserve the exact received event JSON for PayPal's verification API.
      const body = JSON.stringify(data).slice(0, -1) + ',"webhook_event":' + raw + '}';
      const result = await call('/v1/notifications/verify-webhook-signature', { method: 'POST', rawBody: body });
      return result.verification_status === 'SUCCESS';
    },
  };
}

export function verifyOrder(remote, order, merchantId) {
  const units = remote.purchase_units;
  const unit = Array.isArray(units) && units.length === 1 ? units[0] : null;
  if (remote.id !== order.paypal_order_id || remote.intent !== 'CAPTURE' || !unit ||
      unit.custom_id !== order.id || unit.reference_id !== order.plan_key ||
      unit.payee?.merchant_id !== merchantId || unit.amount?.currency_code !== order.currency ||
      centsFromPayPal(unit.amount?.value) !== order.amount_cents) throw new PayPalError('payment_mismatch');
  return unit;
}

export function verifyCapture(capture, order, merchantId) {
  if (!capture || !/^[A-Z0-9]{1,36}$/.test(capture.id) ||
      capture.amount?.currency_code !== order.currency || centsFromPayPal(capture.amount?.value) !== order.amount_cents ||
      (order.paypal_capture_id && capture.id !== order.paypal_capture_id) ||
      (capture.payee?.merchant_id && capture.payee.merchant_id !== merchantId) ||
      (capture.supplementary_data?.related_ids?.order_id && capture.supplementary_data.related_ids.order_id !== order.paypal_order_id)) throw new PayPalError('payment_mismatch');
  const states = { COMPLETED: 'paid', PENDING: 'pending', DECLINED: 'denied', DENIED: 'denied', REFUNDED: 'refunded', PARTIALLY_REFUNDED: 'review', REVERSED: 'reversed', FAILED: 'denied' };
  if (!states[capture.status]) throw new PayPalError('payment_mismatch');
  return states[capture.status];
}
