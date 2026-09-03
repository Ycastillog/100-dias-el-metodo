// Explicit opt-in diagnostics. Never called by the public app or npm test.
// Credentials enter through the process environment and are never printed.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PLANS } from './catalog.mjs';
import { paypalClient, verifyOrder } from './paypal.mjs';

const BASE = 'https://api-m.sandbox.paypal.com';
const WEBHOOK_URL = 'https://100diaselmetodo.com/api/paypal/webhook';
const EVENTS = ['COMPLETED', 'DECLINED', 'DENIED', 'PENDING', 'REFUNDED', 'REVERSED']
  .map(name => 'PAYMENT.CAPTURE.' + name);
const env = process.env;
const mode = process.argv[2];
const report = data => console.log(JSON.stringify(data));
let lastFailure;

async function checkedFetch(url, options = {}) {
  assert.equal(new URL(url).origin, BASE, 'Sandbox-only diagnostic');
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    const error = await response.clone().json().catch(() => ({}));
    const safe = value => typeof value === 'string' && /^[A-Z0-9_./-]{1,160}$/i.test(value) ? value : undefined;
    lastFailure = { path: new URL(url).pathname, httpStatus: response.status,
      name: safe(error.name), details: error.details?.map(item => ({ issue: safe(item.issue), field: safe(item.field) })) };
  }
  return response;
}

try {
  assert.equal(env.PAYPAL_ENV, 'sandbox');
  assert.ok(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET && env.PAYPAL_MERCHANT_ID);
  assert.ok(['--register-webhook', '--create-orders'].includes(mode), 'Explicit operation required');
  if (mode === '--register-webhook') {
    const auth = await checkedFetch(BASE + '/v1/oauth2/token', {
      method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials',
    });
    assert.equal(auth.status, 200);
    const { access_token: token } = await auth.json();
    assert.ok(token);
    const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
    const listing = await checkedFetch(BASE + '/v1/notifications/webhooks', { headers });
    assert.equal(listing.status, 200);
    const matches = (await listing.json()).webhooks.filter(hook => hook.url === WEBHOOK_URL);
    assert.ok(matches.length <= 1, 'Duplicate webhook requires review');
    let hook = matches[0];
    let created = false;
    if (!hook) {
      const response = await checkedFetch(BASE + '/v1/notifications/webhooks', {
        method: 'POST', headers, body: JSON.stringify({ url: WEBHOOK_URL, event_types: EVENTS.map(name => ({ name })) }),
      });
      assert.equal(response.status, 201);
      hook = await response.json();
      created = true;
    }
    assert.equal(hook.url, WEBHOOK_URL);
    assert.deepEqual(hook.event_types.map(event => event.name).sort(), [...EVENTS].sort());
    report({ operation: 'webhook_registered', sandbox: true, created, webhookId: hook.id, url: hook.url, events: EVENTS });
  } else {
    assert.match(env.PAYPAL_TEST_RUN_ID || '', /^[a-zA-Z0-9-]{8,80}$/);
    const client = paypalClient(env, checkedFetch);
    for (const plan of Object.values(PLANS)) {
      // Stable per run/plan. A retry cannot silently create a replacement order.
      const hex = createHash('sha256').update(env.PAYPAL_TEST_RUN_ID + ':' + plan.key).digest('hex');
      const id = [hex.slice(0, 8), hex.slice(8, 12), '4' + hex.slice(13, 16), '8' + hex.slice(17, 20), hex.slice(20, 32)].join('-');
      const order = { id, plan_key: plan.key, amount_cents: plan.amountCents, currency: 'USD' };
      report({ operation: 'sandbox_order_start', plan: plan.key, requestId: id });
      const remote = await client.create(order, plan);
      order.paypal_order_id = remote.id;
      const read = await client.getOrder(remote.id);
      verifyOrder(read, order, env.PAYPAL_MERCHANT_ID);
      const retry = await client.create(order, plan);
      assert.equal(retry.id, remote.id);
      assert.ok(['CREATED', 'PAYER_ACTION_REQUIRED'].includes(read.status), 'Must remain unapproved and uncaptured');
      assert.ok(!read.purchase_units.some(unit => unit.payments?.captures?.length));
      report({ operation: 'sandbox_order_verified', plan: plan.key, amount: (plan.amountCents / 100).toFixed(2),
        currency: 'USD', paypalOrderId: remote.id, status: read.status, sameOrderOnRetry: true, captured: false });
    }
    report({ operation: 'sandbox_orders_complete', count: 4, realMoneyMoved: false, captureOrDeliveryTested: false });
  }
} catch (error) {
  report({ operation: 'sandbox_check_failed', error: error.code || error.name || 'Error', provider: lastFailure });
  process.exitCode = 1;
}
