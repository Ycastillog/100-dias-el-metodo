// Operator-only release check. Never enable Sandbox checkout for public visitors.
// The temporary key is supplied in a header, expires within three hours, and is
// removed after validation. It cannot authorize a Live payment or entitlement.
const TOKEN = /^[a-f0-9]{64}$/;
const PROBE_PATH = /^(?:\/comprar|\/api\/checkout\/config|\/api\/paypal\/orders(?:\/[a-f0-9-]+\/capture)?|\/api\/checkout\/orders\/[a-f0-9-]+|\/api\/participant\/(?:redeem|logout|record|session|day|access))$/;
const denied = () => new Response(JSON.stringify({ error: 'test_access_denied' }), {
  status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
});
function sandboxEnvironment(env, enabled) {
  return Object.fromEntries(Object.entries({
    DB: env.DB, PAYPAL_ENV: 'sandbox', CHECKOUT_ENABLED: enabled ? 'true' : 'false',
    CHECKOUT_ORIGIN: env.CHECKOUT_ORIGIN, ACCESS_SIGNING_SECRET: env.ACCESS_SIGNING_SECRET,
    PAYPAL_CLIENT_ID: env.PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET: env.PAYPAL_CLIENT_SECRET,
    PAYPAL_MERCHANT_ID: env.PAYPAL_MERCHANT_ID, PAYPAL_WEBHOOK_ID: env.PAYPAL_WEBHOOK_ID,
  }));
}
export async function sandboxProbe(request, env) {
  const url = new URL(request.url);
  let sandboxCertificate = false;
  try {
    const cert = new URL(request.headers.get('paypal-cert-url'));
    sandboxCertificate = cert.protocol === 'https:' && !cert.port && !cert.username && !cert.password &&
      ['api.sandbox.paypal.com', 'api-m.sandbox.paypal.com'].includes(cert.hostname) &&
      cert.pathname.startsWith('/v1/notifications/certs/');
  } catch { /* No certificate hint. Signature verification is still mandatory. */ }
  if (url.pathname === '/api/paypal/webhook' && sandboxCertificate) {
    // PayPal still must pass normal signature, environment and order checks.
    return { request: new Request(url, request), env: sandboxEnvironment(env, false) };
  }
  // Standard Authorization is redacted by the hosting request logger; custom
  // secret headers are not. Never place the probe key in URLs or custom headers.
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer sandbox-')) return null;
  const supplied = authorization.slice('Bearer sandbox-'.length);
  const expiry = Date.parse(env.CHECKOUT_TEST_EXPIRES_AT || '');
  if (!PROBE_PATH.test(url.pathname) || url.protocol !== 'https:' || url.origin !== env.CHECKOUT_ORIGIN ||
      !TOKEN.test(supplied) || !TOKEN.test(env.CHECKOUT_TEST_TOKEN || '') ||
      !Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now() + 3 * 3_600_000) return denied();
  const digest = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const [actual, expected] = await Promise.all([digest(supplied), digest(env.CHECKOUT_TEST_TOKEN)]);
  let mismatch = 0;
  const bytes = new Uint8Array(expected);
  new Uint8Array(actual).forEach((value, index) => { mismatch |= value ^ bytes[index]; });
  if (mismatch) return denied();
  return { request, env: sandboxEnvironment(env, true) };
}
