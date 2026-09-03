import test from 'node:test';
import assert from 'node:assert/strict';
import { paypalClient } from './paypal.mjs';

test('default PayPal transport preserves the Workers global fetch receiver', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  let calls = 0;
  globalThis.fetch = async function(url, options) {
    assert.equal(this, globalThis, 'Worker fetch must not be detached'); calls++;
    assert.equal(options.redirect, 'manual', 'Workers supports manual or follow; never forward credentials on redirects');
    return Response.json(url.endsWith('/token') ? { access_token: 'test-token' } : { id: 'ORDER123' });
  };
  const order = await paypalClient({ PAYPAL_ENV: 'sandbox', PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test' }).getOrder('ORDER123');
  assert.equal(order.id, 'ORDER123'); assert.equal(calls, 2);
});

test('provider redirects are rejected without forwarding credentials or following Location', async () => {
  let calls = 0;
  const client = paypalClient({ PAYPAL_ENV: 'sandbox', PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test' }, async (url, options) => {
    calls++; assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://attacker.example/' } });
  });
  await assert.rejects(client.getOrder('ORDER123'), /paypal_unavailable/); assert.equal(calls, 1);
});
