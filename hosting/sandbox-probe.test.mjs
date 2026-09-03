import test from 'node:test';
import assert from 'node:assert/strict';
import { sandboxProbe } from './sandbox-probe.mjs';
import { respond } from './response.mjs';

const origin = 'https://100diaselmetodo.com';
const makeEnv = () => ({ PAYPAL_ENV: 'live', CHECKOUT_ENABLED: 'false', CHECKOUT_ORIGIN: origin,
  CHECKOUT_TEST_TOKEN: 'b'.repeat(64), CHECKOUT_TEST_EXPIRES_AT: new Date(Date.now() + 3_600_000).toISOString(),
  PAYPAL_CLIENT_ID: 'sandbox-public', PAYPAL_CLIENT_SECRET: 'sandbox-secret', PAYPAL_MERCHANT_ID: 'SB', PAYPAL_WEBHOOK_ID: 'SBHOOK',
  PAYPAL_LIVE_CLIENT_ID: 'live-public', PAYPAL_LIVE_CLIENT_SECRET: 'live-secret', PAYPAL_LIVE_MERCHANT_ID: 'LIVE', PAYPAL_LIVE_WEBHOOK_ID: 'LIVEHOOK',
  ACCESS_SIGNING_SECRET: 'a'.repeat(64), DB: { prepare() { throw new Error('No DB calls expected'); }, batch() {} } });
const request = (path = '/api/checkout/config', token = 'b'.repeat(64), base = origin) => new Request(base + path, { headers: token === null ? {} : { 'x-metodo-sandbox-test': token } });

test('operator Sandbox gate does not change normal Live traffic or expose protected keys', async () => {
  const env = makeEnv();
  assert.equal(await sandboxProbe(request(undefined, null), env), null);
  const publicConfig = await (await respond(request(undefined, null), {}, env)).json();
  assert.equal(publicConfig.enabled, false); assert.equal(publicConfig.sandbox, false); assert.equal(publicConfig.clientId, null);
  const probe = await sandboxProbe(request(), env);
  assert.equal(probe.env.PAYPAL_ENV, 'sandbox'); assert.equal(probe.env.CHECKOUT_ENABLED, 'true');
  assert.equal(probe.env.PAYPAL_LIVE_CLIENT_SECRET, undefined); assert.equal(probe.env.CHECKOUT_TEST_TOKEN, undefined);
  assert.equal(env.PAYPAL_ENV, 'live'); assert.equal(env.CHECKOUT_ENABLED, 'false');
  const config = await (await respond(request(), {}, env)).json();
  assert.equal(config.enabled, true); assert.equal(config.sandbox, true); assert.equal(config.clientId, 'sandbox-public');
  assert.doesNotMatch(JSON.stringify(config), /sandbox-secret|live-secret|b{64}|a{64}/);
});

test('operator gate fails closed for missing, wrong, expired and overlong-lived keys or unrelated routes', async () => {
  for (const overrides of [{ CHECKOUT_TEST_TOKEN: '' }, { CHECKOUT_TEST_TOKEN: 'c'.repeat(64) },
    { CHECKOUT_TEST_EXPIRES_AT: 'invalid' }, { CHECKOUT_TEST_EXPIRES_AT: new Date(Date.now() - 1000).toISOString() },
    { CHECKOUT_TEST_EXPIRES_AT: new Date(Date.now() + 4 * 3_600_000).toISOString() }]) {
    assert.equal((await sandboxProbe(request(), { ...makeEnv(), ...overrides })).status, 403);
  }
  for (const req of [request('/', undefined), request('/api/events'), request('/api/checkout/config', 'short'),
    request(undefined, undefined, 'https://attacker.example'), request(undefined, undefined, 'http://100diaselmetodo.com')]) {
    assert.equal((await sandboxProbe(req, makeEnv())).status, 403);
  }
});

test('Sandbox webhook uses only Sandbox credentials, preserves raw bytes and still requires a signature', async () => {
  const env = makeEnv(); const raw = '{ "id": "EVENT123", "event_type": "PAYMENT.CAPTURE.COMPLETED" }';
  const make = () => new Request(origin + '/api/paypal/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT123' }, body: raw });
  const routed = await sandboxProbe(make(), env);
  assert.equal(await routed.request.text(), raw);
  assert.equal(new URL(routed.request.url).pathname, '/api/paypal/webhook');
  assert.equal(routed.env.PAYPAL_ENV, 'sandbox'); assert.equal(routed.env.CHECKOUT_ENABLED, 'false');
  assert.equal(routed.env.PAYPAL_LIVE_CLIENT_SECRET, undefined);
  const denied = await respond(make(), {}, env);
  assert.equal(denied.status, 401); assert.equal((await denied.json()).error, 'invalid_signature');
});
