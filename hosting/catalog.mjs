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

// Deliberately cannot be overridden with an environment switch. A paid release
// needs real protected delivery/recovery, final materials and acceptance tests.
export const LIVE_FULFILLMENT_READY = false;

export function checkoutConfiguration(env) {
  const mode = env.PAYPAL_ENV;
  let origin;
  try {
    const url = new URL(env.CHECKOUT_ORIGIN);
    if (url.origin !== env.CHECKOUT_ORIGIN) throw new Error('origin');
    if (url.protocol !== 'https:' && !(mode === 'sandbox' && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('https');
    origin = url.origin;
  } catch { return { enabled: false, reason: 'configuration_missing' }; }
  if (mode === 'live' && !LIVE_FULFILLMENT_READY) return { enabled: false, reason: 'delivery_not_ready' };
  if (env.CHECKOUT_ENABLED !== 'true' || !['sandbox', 'live'].includes(mode)) return { enabled: false, reason: 'sales_closed' };
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !env.PAYPAL_MERCHANT_ID || !env.PAYPAL_WEBHOOK_ID || !env.DB?.prepare) return { enabled: false, reason: 'configuration_missing' };
  return { enabled: true, mode, origin, clientId: env.PAYPAL_CLIENT_ID };
}
