import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import { handleCheckout } from './checkout.mjs';
import { paymentStore } from './payment-store.mjs';
import { PLANS, checkoutConfiguration, centsFromPayPal, planFor } from './catalog.mjs';
import { paypalClient, verifyOrder, verifyCapture, PayPalError } from './paypal.mjs';
import { loadPrelaunchAssets } from './prelaunch-assets.mjs';
import { respond } from './response.mjs';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://100diaselmetodo.com';
const REQUEST_ID = '472d83db-8b7a-4e8a-a9dc-e7fe369b45ca';
const migrations = await Promise.all((await readdir(new URL('../drizzle/', import.meta.url))).filter(name => name.endsWith('.sql')).sort().map(name => readFile(new URL('../drizzle/' + name, import.meta.url), 'utf8')));
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const sql of migrations) sqlite.exec(sql);
  sqlite.exec('PRAGMA optimize');
  const prepare = sql => ({ bind: (...args) => ({
    first: () => sqlite.prepare(sql).get(...args) || null,
    run: () => ({ success: true, meta: sqlite.prepare(sql).run(...args) }),
  }) });
  return { sqlite, prepare, batch: statements => {
    sqlite.exec('BEGIN');
    try { const results = statements.map(statement => statement.run()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
}
async function fixture(t) {
  const db = database(); t.after(() => db.sqlite.close());
  const env = { DB: db, CHECKOUT_ENABLED: 'true', CHECKOUT_ORIGIN: ORIGIN, PAYPAL_ENV: 'sandbox', PAYPAL_CLIENT_ID: 'test-client', PAYPAL_CLIENT_SECRET: 'test-secret', PAYPAL_MERCHANT_ID: 'MERCHANT123', PAYPAL_WEBHOOK_ID: 'WH123' };
  const f = { env, db, store: paymentStore(db), captures: 0, creates: 0, captured: false, status: 'COMPLETED', verifiedSignature: true, mutate: value => value };
  const capture = () => ({ id: 'CAPTURE123', status: f.status, amount: { value: f.amount || '9.00', currency_code: 'USD' } });
  f.client = {
    create: async order => { f.creates++; f.createdOrder = order; return { id: 'PAYPAL123' }; },
    getOrder: async () => f.mutate({ id: 'PAYPAL123', intent: 'CAPTURE', status: f.captured ? 'COMPLETED' : 'APPROVED', purchase_units: [{
      custom_id: REQUEST_ID, reference_id: 'alpha', payee: { merchant_id: 'MERCHANT123' }, amount: { value: '9.00', currency_code: 'USD' },
      ...(f.captured ? { payments: { captures: [capture()] } } : {}),
    }] }),
    capture: async () => { f.captures++; f.captured = true; if (f.timeout) throw new Error('network_timeout'); return {}; },
    getCapture: async () => capture(),
    verifyWebhook: async () => f.verifiedSignature,
  };
  const page = await handleCheckout(new Request(ORIGIN + '/comprar'), env);
  f.cookie = page.headers.get('set-cookie').split(';')[0];
  f.call = (path, data, extra = {}) => handleCheckout(new Request(ORIGIN + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: f.cookie, ...extra },
    body: data === undefined ? undefined : JSON.stringify(data),
  }), env, { store: f.store, client: f.client });
  f.create = () => f.call('/api/paypal/orders', { plan: 'alpha', email: 'buyer@example.com', requestId: REQUEST_ID, amountCents: 1, currency: 'EUR' });
  f.capture = () => f.call('/api/paypal/orders/' + REQUEST_ID + '/capture', { paypalOrderId: 'PAYPAL123' });
  f.event = type => ({ id: 'WH-EVENT123', event_type: type, resource: { id: 'CAPTURE123', supplementary_data: { related_ids: { order_id: 'PAYPAL123' } } } });
  return f;
}

test('four one-time digital prices; no implicit recurring product', () => {
  assert.deepEqual(Object.values(PLANS).map(plan => plan.amountCents), [900, 2900, 7900, 29700]);
  for (const plan of Object.values(PLANS)) { assert.equal(plan.billing, 'one_time'); assert.equal(plan.recurring, false); assert.equal(plan.delivery, 'digital'); }
  for (const key of ['__proto__', 'constructor', ['alpha'], null]) assert.equal(planFor(key), null);
  assert.equal(centsFromPayPal('9.0'), 900);
  for (const value of ['9e0', '9.001', '-9.00', 9, 'NaN']) assert.equal(centsFromPayPal(value), null);
});
test('disabled by default and live remains blocked even with complete credentials', async t => {
  const f = await fixture(t);
  assert.equal(checkoutConfiguration({}).enabled, false);
  assert.equal(checkoutConfiguration({ ...f.env, PAYPAL_ENV: 'live' }).reason, 'delivery_not_ready');
  for (const key of ['PAYPAL_CLIENT_SECRET', 'PAYPAL_MERCHANT_ID', 'PAYPAL_WEBHOOK_ID', 'DB']) assert.equal(checkoutConfiguration({ ...f.env, [key]: undefined }).enabled, false);
  const response = await handleCheckout(new Request(ORIGIN + '/api/paypal/orders', { method: 'POST' }), {});
  assert.equal(response.status, 503);
});
test('closed checkout shows truthful copy; sandbox session cookie is HTTP-only and secure', async t => {
  const f = await fixture(t);
  const closed = await handleCheckout(new Request(ORIGIN + '/comprar'), {});
  assert.equal(closed.headers.has('set-cookie'), false);
  const html = await closed.text();
  assert.match(html, /VENTAS TODAVÍA CERRADAS/); assert.match(html, /sin sesiones en vivo/i);
  const open = await handleCheckout(new Request(ORIGIN + '/comprar'), f.env);
  for (const flag of ['__Host-metodo-checkout=', 'HttpOnly', 'SameSite=Strict', 'Secure', 'Path=/']) assert.ok(open.headers.get('set-cookie').includes(flag));
  assert.equal(open.headers.get('cache-control'), 'private, no-store');
  assert.equal(await (await handleCheckout(new Request(ORIGIN + '/comprar', { method: 'HEAD' }), f.env)).text(), '');
});
test('config exposes only public client ID, not secrets or webhook/merchant credentials', async t => {
  const f = await fixture(t);
  const response = await f.call('/api/checkout/config');
  const body = await response.text();
  assert.match(body, /test-client/);
  for (const secret of ['test-secret', 'MERCHANT123', 'WH123']) assert.ok(!body.includes(secret));
});
test('creates with server price, persists before PayPal and retries same order idempotently', async t => {
  const f = await fixture(t);
  assert.equal((await f.create()).status, 200);
  assert.equal(f.createdOrder.amount_cents, 900); assert.equal(f.createdOrder.currency, 'USD');
  assert.equal((await f.create()).status, 200); assert.equal(f.creates, 1);
  const row = await f.store.byId(REQUEST_ID); assert.equal(row.paypal_order_id, 'PAYPAL123');
  assert.equal(row.delivery_status, 'not_ready'); assert.notEqual(row.session_hash, f.cookie.split('=')[1]);
});
test('cross-origin, absent session, invalid plan/email/body are rejected without creating orders', async t => {
  const f = await fixture(t);
  const data = { plan: 'alpha', email: 'buyer@example.com', requestId: REQUEST_ID };
  assert.equal((await f.call('/api/paypal/orders', data, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await f.call('/api/paypal/orders', data, { Cookie: '' })).status, 401);
  for (const invalid of [{ ...data, plan: '__proto__' }, { ...data, email: 'bad' }, { ...data, requestId: 'bad' }, [], { ...data, email: 'a'.repeat(5000) }]) assert.equal((await f.call('/api/paypal/orders', invalid)).status, 400);
  assert.equal(f.creates, 0);
});
test('another session cannot capture or read an order and cannot reuse its request ID', async t => {
  const f = await fixture(t); await f.create();
  f.cookie = '__Host-metodo-checkout=' + 'b'.repeat(64);
  assert.equal((await f.capture()).status, 404);
  assert.equal((await f.call('/api/checkout/orders/' + REQUEST_ID)).status, 404);
  assert.equal((await f.create()).status, 409);
  assert.equal(f.captures, 0);
});
test('completed payment is verified, stored once and never grants unfinished access', async t => {
  const f = await fixture(t); await f.create();
  const result = await (await f.capture()).json();
  assert.equal(result.status, 'paid'); assert.equal(result.sandbox, true); assert.equal(result.deliveryStatus, 'not_ready');
  assert.equal((await f.capture()).status, 200); assert.equal(f.captures, 1);
  const row = await f.store.byId(REQUEST_ID); assert.equal(row.paypal_capture_id, 'CAPTURE123'); assert.ok(row.paid_at);
});
test('capture timeout reconciles an already completed payment instead of charging again', async t => {
  const f = await fixture(t); await f.create(); f.timeout = true;
  assert.equal((await (await f.capture()).json()).status, 'paid');
  await f.capture(); assert.equal(f.captures, 1);
});
test('pending capture is not reported as paid or delivered', async t => {
  const f = await fixture(t); await f.create(); f.status = 'PENDING';
  const result = await (await f.capture()).json(); assert.equal(result.status, 'pending'); assert.equal(result.deliveryStatus, 'not_ready');
  assert.equal((await f.store.byId(REQUEST_ID)).paid_at, null);
});
for (const mutation of ['amount', 'currency', 'merchant', 'custom', 'intent', 'reference']) test('rejects mismatched ' + mutation + ' BEFORE capture', async t => {
  const f = await fixture(t); await f.create();
  f.mutate = remote => {
    const unit = remote.purchase_units[0];
    if (mutation === 'amount') unit.amount.value = '0.01';
    if (mutation === 'currency') unit.amount.currency_code = 'EUR';
    if (mutation === 'merchant') unit.payee.merchant_id = 'OTHER';
    if (mutation === 'custom') unit.custom_id = 'OTHER';
    if (mutation === 'reference') unit.reference_id = 'premium';
    if (mutation === 'intent') remote.intent = 'AUTHORIZE';
    return remote;
  };
  assert.equal((await f.capture()).status, 409); assert.equal(f.captures, 0); assert.equal((await f.store.byId(REQUEST_ID)).status, 'created');
});
test('altered captured amount and another provider ID never verify', async t => {
  const f = await fixture(t); await f.create(); f.amount = '297.00';
  assert.equal((await f.capture()).status, 409);
  assert.equal((await f.call('/api/paypal/orders/' + REQUEST_ID + '/capture', { paypalOrderId: 'OTHER' })).status, 409);
});
test('webhook requires verified signature; repeated event is durable and idempotent', async t => {
  const f = await fixture(t); await f.create(); f.captured = true;
  f.verifiedSignature = false;
  assert.equal((await f.call('/api/paypal/webhook', f.event('PAYMENT.CAPTURE.COMPLETED'))).status, 401);
  assert.equal(await f.store.eventSeen('WH-EVENT123'), null);
  f.verifiedSignature = true;
  assert.equal((await f.call('/api/paypal/webhook', f.event('PAYMENT.CAPTURE.COMPLETED'))).status, 200);
  assert.equal((await f.call('/api/paypal/webhook', f.event('PAYMENT.CAPTURE.COMPLETED'))).status, 200);
  assert.equal(f.db.sqlite.prepare('SELECT COUNT(*) AS count FROM payment_events').get().count, 1);
  assert.equal((await f.store.byId(REQUEST_ID)).status, 'paid');
});
test('unknown or not-yet-persisted webhook is retried, not silently acknowledged', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('/api/paypal/webhook', f.event('PAYMENT.CAPTURE.COMPLETED'))).status, 503);
  assert.equal(await f.store.eventSeen('WH-EVENT123'), null);
});
test('refund revokes delivery; late COMPLETED cannot revive it', async t => {
  const f = await fixture(t); await f.create(); await f.capture(); f.status = 'REFUNDED';
  await f.call('/api/paypal/webhook', f.event('PAYMENT.CAPTURE.REFUNDED'));
  let row = await f.store.byId(REQUEST_ID); assert.equal(row.status, 'refunded'); assert.equal(row.delivery_status, 'revoked');
  f.status = 'COMPLETED';
  await f.call('/api/paypal/webhook', { ...f.event('PAYMENT.CAPTURE.COMPLETED'), id: 'WH-LATE' });
  row = await f.store.byId(REQUEST_ID); assert.equal(row.status, 'refunded'); assert.equal(row.delivery_status, 'revoked');
});
test('partial refunds are held for review, and stale pending does not downgrade paid', async t => {
  const f = await fixture(t); await f.create(); await f.capture();
  f.status = 'PENDING'; await f.call('/api/checkout/orders/' + REQUEST_ID);
  assert.equal((await f.store.byId(REQUEST_ID)).status, 'paid');
  f.status = 'PARTIALLY_REFUNDED'; await f.call('/api/checkout/orders/' + REQUEST_ID);
  assert.equal((await f.store.byId(REQUEST_ID)).status, 'review');
});
test('SQL transaction rolls back order update if event insert fails; unique capture enforced', async t => {
  const f = await fixture(t); await f.create();
  const row = await f.store.byId(REQUEST_ID);
  await assert.rejects(f.store.reconcile(row, { id: 'CAPTURE123' }, 'paid', new Date().toISOString(), { id: 'WH-FAIL' }));
  assert.equal((await f.store.byId(REQUEST_ID)).status, 'created');
  const plan = f.db.sqlite.prepare('EXPLAIN QUERY PLAN SELECT * FROM purchase_orders WHERE paypal_order_id = ?').all('PAYPAL123');
  assert.match(JSON.stringify(plan), /idx_purchase_orders_paypal_order/);
});
test('PayPal adapter fixes endpoint, amount, merchant, CAPTURE and request id; no subscriptions', async () => {
  const requests = [];
  const env = { PAYPAL_ENV: 'sandbox', PAYPAL_CLIENT_ID: 'public-test', PAYPAL_CLIENT_SECRET: 'private-test', PAYPAL_MERCHANT_ID: 'MERCHANT123' };
  const client = paypalClient(env, async (url, options) => {
    requests.push({ url, options });
    return Response.json(url.endsWith('/token') ? { access_token: 'fake-token' } : { id: 'PAYPAL123' });
  });
  await client.create({ id: REQUEST_ID }, PLANS.premium);
  const outgoing = JSON.parse(requests[1].options.body);
  assert.equal(outgoing.intent, 'CAPTURE'); assert.equal(outgoing.purchase_units[0].amount.value, '297.00');
  assert.equal(outgoing.purchase_units[0].payee.merchant_id, 'MERCHANT123');
  assert.equal(requests[1].options.headers['PayPal-Request-Id'], REQUEST_ID);
  assert.equal(requests[1].url, 'https://api-m.sandbox.paypal.com/v2/checkout/orders');
  assert.doesNotMatch(JSON.stringify(outgoing), /subscription|billing_plan|vault/);
  await assert.rejects(async () => client.getOrder('../secrets'), PayPalError);
});
test('webhook postback preserves raw event JSON and rejects non-PayPal certificates', async () => {
  let verificationBody = '';
  const client = paypalClient({ PAYPAL_ENV: 'sandbox', PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test', PAYPAL_WEBHOOK_ID: 'WH123' }, async (url, options) => {
    if (url.endsWith('/token')) return Response.json({ access_token: 'fake' });
    verificationBody = options.body; return Response.json({ verification_status: 'SUCCESS' });
  });
  const headers = new Headers({ 'paypal-transmission-id': 'id', 'paypal-transmission-time': '2026-09-03T00:00:00Z', 'paypal-transmission-sig': 'fake', 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/test' });
  const raw = '{ "id": "WH-X", "number":1.00 }';
  assert.equal(await client.verifyWebhook(headers, raw), true); assert.ok(verificationBody.includes('"webhook_event":' + raw));
  headers.set('paypal-cert-url', 'https://attacker.example/cert');
  assert.equal(await client.verifyWebhook(headers, raw), false);
});
test('new checkout assets are allowlisted but participant sources and payment APIs remain closed', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const assets = await loadPrelaunchAssets(root);
  for (const path of ['/assets/checkout.css', '/assets/checkout.js', '/comprar']) assert.equal((await respond(new Request(ORIGIN + path), assets)).status, 200);
  for (const path of ['/acceso.html?alpha=1', '/hosting/paypal.mjs', '/db/schema.ts', '/.env.local']) assert.equal((await respond(new Request(ORIGIN + path), assets)).status, 404);
  const body = await readFile(new URL('./checkout.js', import.meta.url), 'utf8'); new vm.Script(body);
  assert.doesNotMatch(body, /createSubscription|vault=true/);
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/class="price">USD \d+ <small>· pago único/g) || []).length, 4);
  assert.doesNotMatch(html, /Clínicas grupales|Sesión privada inicial|Revisiones privadas|Check-in semanal/);
});
