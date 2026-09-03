// Commercial decision confirmed by the owner: one purchase, no renewals.
export const PLANS = Object.freeze(Object.fromEntries([
  ['alpha', 'Acceso Alpha', 900, 14],
  ['metodo', 'El Método', 2900, 100],
  ['sistema', 'El Método + Sistema', 7900, 100],
  ['premium', 'El Método Premium', 29700, 100],
].map(([key, name, amountCents, accessDays]) => [key, Object.freeze({
  key, name, amountCents, accessDays, currency: 'USD', billing: 'one_time',
  delivery: 'digital', recurring: false,
})])));

export const planFor = key => typeof key === 'string' && Object.hasOwn(PLANS, key) ? PLANS[key] : null;
export const decimalAmount = cents => (cents / 100).toFixed(2);
export function centsFromPayPal(value) {
  if (typeof value !== 'string' || !/^\d{1,9}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

// Keep Sandbox credentials intact. Live uses its separately provisioned app;
// never fall back to a different environment's merchant or signing credentials.
export function paymentEnvironment(env) {
  if (env.PAYPAL_ENV !== 'live') return env;
  return { ...env, ...Object.fromEntries(['CLIENT_ID', 'CLIENT_SECRET', 'MERCHANT_ID', 'WEBHOOK_ID'].map(key => ['PAYPAL_' + key, env['PAYPAL_LIVE_' + key]])) };
}

export function checkoutConfiguration(env, deliveryReady = false) {
  const mode = env.PAYPAL_ENV;
  let origin;
  try {
    const url = new URL(env.CHECKOUT_ORIGIN);
    if (url.origin !== env.CHECKOUT_ORIGIN) throw new Error('origin');
    if (url.protocol !== 'https:' && !(mode === 'sandbox' && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('https');
    origin = url.origin;
  } catch { return { enabled: false, configured: false, reason: 'configuration_missing' }; }
  const configured = ['sandbox', 'live'].includes(mode) && !!env.PAYPAL_CLIENT_ID && !!env.PAYPAL_CLIENT_SECRET && !!env.PAYPAL_MERCHANT_ID && !!env.PAYPAL_WEBHOOK_ID && !!env.DB?.prepare && !!env.DB?.batch;
  const reason = mode === 'live' && !deliveryReady ? 'delivery_not_ready' : !configured ? 'configuration_missing' : env.CHECKOUT_ENABLED !== 'true' ? 'sales_closed' : null;
  return { configured, enabled: !reason, reason, mode, origin, deliveryReady, clientId: configured ? env.PAYPAL_CLIENT_ID : null };
}
