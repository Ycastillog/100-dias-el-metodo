import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { programModule } from './program-source.mjs';
import { handleParticipant } from './participant.mjs';
import { participantStore, validateRecord } from './participant-store.mjs';
import { paymentStore, paymentCompletedAt } from './payment-store.mjs';
import { handleCheckout } from './checkout.mjs';
import { paymentEnvironment, checkoutConfiguration } from './catalog.mjs';
import { issueAccess, verifyAccessCode, accessExpiry, isAccessible } from './purchase-access.mjs';
import { loadSalesAssets } from './sales-assets.mjs';
import { respond } from './response.mjs';
import { allowRequest } from './request-limit.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const context = {};
vm.runInNewContext((await programModule(root)).replace('export default ', 'this.program = '), context);
const program = context.program;
const ORIGIN = 'https://100diaselmetodo.com';
const ID = '472d83db-8b7a-4e8a-a9dc-e7fe369b45ca';
const SECOND = '572d83db-8b7a-4e8a-a9dc-e7fe369b45cb';
const now = () => new Date().toISOString();
const migrations = await Promise.all((await readdir(new URL('../drizzle/', import.meta.url))).filter(name => name.endsWith('.sql')).sort().map(name => readFile(new URL('../drizzle/' + name, import.meta.url), 'utf8')));
function database(t) {
  const sql = new DatabaseSync(':memory:'); t.after(() => sql.close()); sql.exec('PRAGMA foreign_keys=ON');
  for (const migration of migrations) sql.exec(migration);
  const prepare = query => ({ bind: (...values) => ({
    first: async () => sql.prepare(query).get(...values) || null,
    all: async () => ({ results: sql.prepare(query).all(...values) }),
    run: () => ({ success: true, meta: sql.prepare(query).run(...values) }),
  }) });
  return { sql, prepare, batch: async list => {
    sql.exec('BEGIN'); try { const result = list.map(item => item.run()); sql.exec('COMMIT'); return result; } catch (error) { sql.exec('ROLLBACK'); throw error; }
  } };
}
async function fixture(t, options = {}) {
  const DB = database(t);
  const env = { DB, PAYPAL_ENV: options.mode || 'sandbox', CHECKOUT_ORIGIN: ORIGIN, CHECKOUT_ENABLED: 'true', PAYPAL_CLIENT_ID: 'sandbox-client', PAYPAL_CLIENT_SECRET: 'sandbox-secret', PAYPAL_MERCHANT_ID: 'SANDBOXMERCHANT', PAYPAL_WEBHOOK_ID: 'SANDBOXHOOK', PAYPAL_LIVE_CLIENT_ID: 'live-client', PAYPAL_LIVE_CLIENT_SECRET: 'live-secret', PAYPAL_LIVE_MERCHANT_ID: 'LIVEMERCHANT', PAYPAL_LIVE_WEBHOOK_ID: 'LIVEHOOK', ACCESS_SIGNING_SECRET: 'a'.repeat(64) };
  const f = { env, DB, store: paymentStore(DB), records: participantStore(DB), captured: true, calls: 0, captureStatus: 'COMPLETED' };
  f.order = await f.store.create({ id: ID, session_hash: 'no-cookie-yet', plan_key: options.plan || 'alpha', amount_cents: options.plan === 'metodo' ? 2900 : 900, currency: 'USD', environment: env.PAYPAL_ENV, contact_email: 'test@example.com', capture_request_id: crypto.randomUUID(), created_at: now() });
  await f.store.setPayPal(ID, 'ORDER123', now());
  f.order = await f.store.reconcile(f.order, { id: 'CAPTURE123', create_time: now(), update_time: now() }, options.status || 'paid', now());
  f.code = (await issueAccess(f.order, env))?.code;
  f.request = (path, body, cookie = f.code, overrides = {}) => new Request(ORIGIN + '/api/participant/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { origin: ORIGIN, cookie: '__Host-metodo-access=' + (cookie || ''), 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.10', ...overrides }, body: body === undefined ? undefined : JSON.stringify(body) });
  f.call = (path, body, cookie, headers) => handleParticipant(f.request(path, body, cookie, headers), env, program);
  f.capture = () => ({ id: 'CAPTURE123', status: f.captureStatus, create_time: f.order.paid_at || f.order.created_at, update_time: f.order.paid_at || f.order.created_at, amount: { currency_code: 'USD', value: f.order.amount_cents === 2900 ? '29.00' : '9.00' } });
  f.client = {
    create: async () => { f.calls++; return { id: 'ORDER123' }; },
    getOrder: async () => ({ id: 'ORDER123', intent: 'CAPTURE', status: f.captured ? 'COMPLETED' : 'APPROVED', purchase_units: [{ custom_id: ID, reference_id: f.order.plan_key, payee: { merchant_id: env.PAYPAL_ENV === 'live' ? 'LIVEMERCHANT' : 'SANDBOXMERCHANT' }, amount: { currency_code: 'USD', value: f.capture().amount.value }, ...(f.captured ? { payments: { captures: [f.capture()] } } : {}) }] }),
    getCapture: async () => f.capture(), capture: async () => { f.calls++; f.captured = true; }, verifyWebhook: async () => true,
  };
  return f;
}
const profile = { goal: 'Terminar un borrador', firstStep: 'Escribir dos ideas', lifeArea: 'profesional', minutes: 2, energy: 'steady' };
const journal = { state: 'partial', action: 'Escribí una idea', notes: 'Un intento real', obstacle: '', nextStep: 'La segunda idea', minutes: 2, energy: 'steady' };

test('the exact Git program supplies 100 complete lessons and dose-aware actions', () => {
  assert.equal(program.lessons.length, 100);
  for (const [index, lesson] of program.lessons.entries()) {
    assert.equal(lesson.day, index + 1);
    for (const field of ['theme', 'principle', 'task', 'question', 'companion']) assert.ok(lesson[field]);
    for (const minutes of [2, 10, 20]) {
      const practice = program.getLifeProgram(index + 1, { ...profile, minutes });
      for (const field of ['learning', 'movement', 'finance', 'connection']) assert.ok(practice[field].action);
    }
  }
});
test('signed recovery is environment-specific, expires, and requires paid status', async t => {
  const f = await fixture(t);
  assert.equal(await verifyAccessCode(f.code, f.env), ID);
  for (const code of [ID, 'CAPTURE123', f.code.replace(ID, SECOND), f.code.slice(0, -1) + (f.code.endsWith('0') ? '1' : '0')]) assert.equal(await verifyAccessCode(code, f.env), null);
  assert.equal(await verifyAccessCode(f.code, { ...f.env, PAYPAL_ENV: 'live' }), null);
  assert.equal(await verifyAccessCode(f.code, { ...f.env, ACCESS_SIGNING_SECRET: 'b'.repeat(64) }), null);
  for (const state of ['initiated', 'created', 'pending', 'denied', 'review', 'refunded', 'reversed']) assert.equal(await issueAccess({ ...f.order, status: state }, f.env), null);
  assert.equal(isAccessible(f.order, f.env, accessExpiry(f.order)), false);
  assert.equal(await issueAccess({ ...f.order, paid_at: new Date(Date.now() - 15 * 86400000).toISOString() }, f.env), null);
  assert.equal(await issueAccess({ ...f.order, plan_key: 'premium' }, f.env), null);
});
test('redeem code creates private cookie; unauthorized, foreign origin, GET side effects fail closed', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('session', undefined, '')).status, 401);
  assert.equal((await f.call('redeem', { code: ID })).status, 401);
  const res = await f.call('redeem', { code: f.code }); assert.equal(res.status, 200);
  for (const flag of ['HttpOnly', 'SameSite=Lax', 'Secure', '__Host-metodo-access=', 'Path=/']) assert.ok(res.headers.get('set-cookie').includes(flag));
  assert.equal((await f.call('redeem', { code: f.code }, '', { origin: 'https://attacker.test' })).status, 403);
  assert.equal((await f.call('logout')).status, 405);
  const logout = await f.call('logout', {}); assert.equal(logout.headers.getSetCookie().length, 2);
  assert.ok(logout.headers.getSetCookie().every(cookie => /Max-Age=0/.test(cookie)));
  assert.ok(logout.headers.getSetCookie().some(cookie => cookie.startsWith('__Host-metodo-checkout=')));
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
});
test('Alpha can read only days 1–14; Método has days 1–100', async t => {
  const f = await fixture(t);
  const session = await (await f.call('session')).json(); assert.equal(session.days.length, 14); assert.equal(session.days[0].title, 'Recuperar el control');
  for (const day of [1, 14]) assert.equal((await f.call('day?day=' + day)).status, 200);
  for (const day of [0, 15, 100, -1, 'NaN', '1.2']) assert.equal((await f.call('day?day=' + day)).status, 403);
  const g = await fixture(t, { plan: 'metodo' }); assert.equal((await (await g.call('session')).json()).days.length, 100);
  assert.equal((await g.call('day?day=100')).status, 200); assert.equal((await g.call('day?day=101')).status, 403);
});
test('records survive a new device and cannot be read via another purchase', async t => {
  const f = await fixture(t);
  for (const [key, body] of [['profile', profile], ['day:1', journal], ['review:7', { worked: 'Empecé', difficult: 'Distracción', nextStep: 'Reducir el paso' }]]) assert.equal((await f.call('record', { key, body, revision: 0 })).status, 200);
  const fresh = await f.call('redeem', { code: f.code }, ''); assert.equal(fresh.status, 200);
  const loaded = await (await f.call('session')).json(); assert.equal(loaded.records.length, 3);
  assert.equal((await (await f.call('day?day=1')).json()).practice.dose.minutes, 2);
  let other = await f.store.create({ ...f.order, id: SECOND, created_at: now() }); other = await f.store.reconcile(other, { id: 'OTHER123' }, 'paid', now());
  const otherCode = (await issueAccess(other, f.env)).code;
  assert.equal((await (await f.call('session', undefined, otherCode)).json()).records.length, 0);
  assert.equal((await (await f.call('session')).json()).records.length, 3);
});
test('same record optimistic concurrency prevents overwrite, including two initial saves', async t => {
  const f = await fixture(t);
  const body = { key: 'day:1', body: journal, revision: 0 };
  const responses = await Promise.all([f.call('record', body), f.call('record', body)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal((await f.call('record', { ...body, revision: 1, body: { ...journal, notes: 'Versión dos' } })).status, 200);
  assert.equal((await f.call('record', { ...body, revision: 1, body: { ...journal, notes: 'Cambio antiguo' } })).status, 409);
  const result = await f.records.get(ID, 'day:1'); assert.equal(result.body.notes, 'Versión dos'); assert.equal(result.revision, 2);
});
test('validation rejects over-plan, malformed, overlong, unexpected and invalid review records', async t => {
  const f = await fixture(t);
  for (const [key, body] of [['day:15', journal], ['day:01', journal], ['review:3', { worked: '', difficult: '', nextStep: 'x' }], ['day:1', { ...journal, notes: 'x'.repeat(4001) }], ['day:1', { ...journal, state: 'paid' }], ['profile', { ...profile, minutes: 999 }], ['profile', { ...profile, orderId: SECOND }], ['__proto__', journal]]) assert.equal(validateRecord(key, body, 14), null);
  for (const value of [[], { key: 'profile', body: profile, revision: -1 }, { key: 'profile', body: profile, revision: '0' }, { key: 'profile', body: { ...profile, goal: 'x'.repeat(17000) }, revision: 0 }]) assert.equal((await f.call('record', value)).status, 400);
});
test('a concurrent later write cannot replace the exact revision returned to an earlier writer', async t => {
  const f = await fixture(t); await f.records.save(ID, 'day:1', journal, 0);
  const wrapped = { prepare: sql => ({ bind: (...values) => ({ first: async () => {
    const row = await f.DB.prepare(sql).bind(...values).first();
    if (sql.startsWith('UPDATE participant_records')) f.DB.sql.prepare('UPDATE participant_records SET body=?, revision=revision+1 WHERE order_id=? AND record_key=?').run(JSON.stringify({ ...journal, notes: 'Otro dispositivo' }), ID, 'day:1');
    return row;
  } }) }) };
  const result = await participantStore(wrapped).save(ID, 'day:1', { ...journal, notes: 'Mi versión' }, 1);
  assert.equal(result.revision, 2); assert.equal(result.body.notes, 'Mi versión');
  assert.equal((await f.records.get(ID, 'day:1')).revision, 3);
  assert.equal(await f.records.save(ID, 'day:1', journal, result.revision), null);
});
test('late payment reconciliation preserves provider completion time rather than restarting access', async t => {
  const f = await fixture(t, { mode: 'live' });
  const old = new Date(Date.now() - 40 * 86400000).toISOString();
  f.DB.sql.prepare('UPDATE purchase_orders SET paid_at=NULL, status=?, created_at=? WHERE id=?').run('created', old, ID);
  const pending = await f.store.byId(ID);
  const capture = { id: 'CAPTURE123', create_time: old, update_time: old };
  const settled = await f.store.reconcile(pending, capture, 'paid', now());
  assert.equal(settled.paid_at, old); assert.equal(await issueAccess(settled, f.env), null);
  const retry = await f.store.reconcile(settled, { ...capture, update_time: now() }, 'paid', now());
  assert.equal(retry.paid_at, old);
  for (const capture of [{}, { update_time: 'bad' }, { update_time: new Date(Date.now() + 86400000).toISOString() }]) assert.throws(() => paymentCompletedAt(pending, capture, now()));
});
test('refund and expiry revoke an existing cookie before any lesson or record write', async t => {
  const f = await fixture(t);
  await f.store.reconcile(f.order, { id: 'CAPTURE123' }, 'refunded', now());
  for (const [path, body] of [['session'], ['day?day=1'], ['access'], ['record', { key: 'day:1', body: journal, revision: 0 }], ['redeem', { code: f.code }]]) assert.equal((await f.call(path, body)).status, 401);
  const g = await fixture(t); g.DB.sql.prepare('UPDATE purchase_orders SET paid_at=? WHERE id=?').run(new Date(Date.now() - 15 * 86400000).toISOString(), ID);
  assert.equal((await g.call('session')).status, 401);
});
test('only complete delivery and dedicated Live credentials can enable real checkout', async t => {
  const f = await fixture(t, { mode: 'live' });
  const resolved = paymentEnvironment(f.env); assert.equal(resolved.PAYPAL_CLIENT_ID, 'live-client'); assert.equal(resolved.PAYPAL_MERCHANT_ID, 'LIVEMERCHANT');
  assert.equal(checkoutConfiguration(resolved, false).enabled, false); assert.equal(checkoutConfiguration(resolved, true).enabled, true);
  assert.equal(checkoutConfiguration(paymentEnvironment({ ...f.env, PAYPAL_LIVE_CLIENT_SECRET: undefined }), true).enabled, false);
  const config = await (await handleCheckout(new Request(ORIGIN + '/api/checkout/config'), f.env, { program })).json();
  assert.equal(config.enabled, true); assert.equal(config.sandbox, false); assert.deepEqual(config.plans.filter(plan => plan.available).map(plan => plan.key), ['alpha', 'metodo']);
  assert.doesNotMatch(JSON.stringify(config), /live-secret|sandbox-secret|LIVEMERCHANT|LIVEHOOK/);
});
test('Live requires acceptance and refuses unfinished packages before calling PayPal', async t => {
  const f = await fixture(t, { mode: 'live' });
  const page = await handleCheckout(new Request(ORIGIN + '/comprar'), f.env, { program });
  const cookie = page.headers.get('set-cookie').split(';')[0];
  const send = body => handleCheckout(new Request(ORIGIN + '/api/paypal/orders', { method: 'POST', headers: { origin: ORIGIN, cookie, 'content-type': 'application/json' }, body: JSON.stringify(body) }), f.env, { program, client: f.client });
  const body = { plan: 'alpha', email: 'test@example.com', requestId: SECOND };
  assert.equal((await send(body)).status, 400);
  for (const plan of ['sistema', 'premium']) assert.equal((await send({ ...body, plan, terms: true })).status, 409);
  assert.equal(f.calls, 0);
});
test('receipt creates access only after confirmed paid; closed sales still process refunds and receipts', async t => {
  const f = await fixture(t, { mode: 'live' });
  const page = await handleCheckout(new Request(ORIGIN + '/comprar'), f.env, { program });
  const cookie = page.headers.get('set-cookie').split(';')[0];
  const token = cookie.split('=')[1]; const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  f.DB.sql.prepare('UPDATE purchase_orders SET session_hash=? WHERE id=?').run(hash, ID);
  const receiptRequest = new Request(ORIGIN + '/api/checkout/orders/' + ID, { headers: { cookie } });
  f.env.CHECKOUT_ENABLED = 'false';
  const response = await handleCheckout(receiptRequest, f.env, { program, client: f.client });
  const receipt = await response.json(); assert.equal(receipt.status, 'paid'); assert.ok(receipt.access.code); assert.equal(receipt.deliveryStatus, 'available'); assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.equal((await handleCheckout(new Request(ORIGIN + '/api/paypal/orders', { method: 'POST' }), f.env, { program, client: f.client })).status, 503);
  f.captureStatus = 'REFUNDED';
  const event = { id: 'WH-REFUND', event_type: 'PAYMENT.CAPTURE.REFUNDED', resource: { supplementary_data: { related_ids: { order_id: 'ORDER123' } } } };
  const hook = await handleCheckout(new Request(ORIGIN + '/api/paypal/webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event) }), f.env, { program, client: f.client });
  assert.equal(hook.status, 200); assert.equal((await f.call('session')).status, 401);
  const refunded = await (await handleCheckout(receiptRequest, f.env, { program, client: f.client })).json(); assert.equal(refunded.status, 'refunded'); assert.equal(refunded.access, undefined);
});
test('pending payment cannot manufacture a signed access receipt', async t => {
  const f = await fixture(t, { status: 'pending' });
  assert.equal(f.code, undefined); assert.equal((await f.call('session', undefined, ID + '.' + 'a'.repeat(64))).status, 401);
});
test('a missing refund webhook is reconciled before further participant use', async t => {
  const f = await fixture(t); f.captureStatus = 'REFUNDED';
  f.DB.sql.prepare('UPDATE purchase_orders SET updated_at=? WHERE id=?').run(new Date(Date.now() - 610000).toISOString(), ID);
  const response = await handleParticipant(f.request('day?day=1'), f.env, program, { client: f.client });
  assert.equal(response.status, 401); assert.equal((await f.store.byId(ID)).status, 'refunded');
});
test('a stale payment does not bypass a failed PayPal reconciliation', async t => {
  const f = await fixture(t);
  f.DB.sql.prepare('UPDATE purchase_orders SET updated_at=? WHERE id=?').run(new Date(Date.now() - 610000).toISOString(), ID);
  const response = await handleParticipant(f.request('session'), f.env, program, { client: { getOrder: async () => { throw new Error('offline'); } } });
  assert.equal(response.status, 503);
});
test('IP-derived limiter is bounded, no raw IP stored, separate actions and expiry respected', async t => {
  const f = await fixture(t); const req = f.request('redeem', {});
  assert.equal(await allowRequest(req, f.env, 'test', 2), true); assert.equal(await allowRequest(req, f.env, 'test', 2), true); assert.equal(await allowRequest(req, f.env, 'test', 2), false);
  assert.equal(await allowRequest(req, f.env, 'other', 2), true);
  const rows = f.DB.sql.prepare('SELECT * FROM request_limits').all(); assert.doesNotMatch(JSON.stringify(rows), /192\.0\.2/); assert.match(rows[0].bucket, /^[a-f0-9]{64}$/);
  f.DB.sql.prepare('UPDATE request_limits SET window_start=0').run(); assert.equal(await allowRequest(req, f.env, 'test', 2), true);
});
test('sales build publicly exposes only the member shell, never Git lessons or payment configuration', async () => {
  const assets = await loadSalesAssets(root);
  for (const path of ['/assets/app.js', '/assets/life-program.js', '/assets/ops.js', '/acceso.html?alpha=1', '/assets/payments.js', '/hosting/program-source.mjs', '/.git/config', '/.env', '/downloads/program.json']) assert.equal((await respond(new Request(ORIGIN + path), assets, {}, program)).status, 404, path);
  assert.equal((await respond(new Request(ORIGIN + '/mi-metodo?alpha=1'), assets, {}, program)).status, 200);
  assert.equal((await respond(new Request(ORIGIN + '/api/participant/day?day=1&alpha=1'), assets, {}, program)).status, 503);
  for (const asset of Object.values(assets)) assert.ok(!asset.data.includes(program.lessons[99].task));
  const html = assets['/'].data; assert.match(html, /\/comprar\?plan=alpha/); assert.match(html, /\/comprar\?plan=metodo/); assert.doesNotMatch(html, /\/comprar\?plan=(sistema|premium)/);
  assert.match(html, /No enviamos un correo automático/); assert.match(assets['/condiciones.html'].data, /YC Systems LLC/);
  new vm.Script(await readFile(new URL('./checkout.js', import.meta.url), 'utf8'));
  for (const name of ['participant.js', 'participant-tools.js']) {
    const check = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: await readFile(new URL('./' + name, import.meta.url), 'utf8'), encoding: 'utf8' });
    assert.equal(check.status, 0, check.stderr);
  }
  for (const path of ['/index.html', '/mi-metodo', '/condiciones.html', '/privacidad.html']) {
    const page = assets[path].data;
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, path);
    for (const [, link] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (link.startsWith('https:')) continue;
      if (link.startsWith('#')) { assert.ok(ids.includes(link.slice(1)), link); continue; }
      const destination = new URL(link, ORIGIN).pathname;
      assert.ok(Object.hasOwn(assets, destination) || destination === '/comprar', link);
    }
  }
});
