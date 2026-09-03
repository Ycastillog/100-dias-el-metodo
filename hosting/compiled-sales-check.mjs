// No network, no real database writes, no payment requests. Run after build:sales.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { default as worker } from '../dist/server/index.js';
const origin = 'https://100diaselmetodo.com';
const env = { CHECKOUT_ORIGIN: origin, CHECKOUT_ENABLED: 'false', PAYPAL_ENV: 'live',
  PAYPAL_LIVE_CLIENT_ID: 'compiled-public', PAYPAL_LIVE_CLIENT_SECRET: 'compiled-private',
  PAYPAL_LIVE_MERCHANT_ID: 'COMPILED', PAYPAL_LIVE_WEBHOOK_ID: 'COMPILEDHOOK',
  ACCESS_SIGNING_SECRET: 'a'.repeat(64), DB: { prepare() { throw new Error('Unexpected DB request'); }, batch() { throw new Error('Unexpected DB request'); } } };
globalThis.fetch = () => { throw new Error('Network forbidden in compiled smoke check'); };
for (const path of ['/', '/comprar', '/mi-metodo', '/condiciones.html', '/privacidad.html']) {
  const response = await worker.fetch(new Request(origin + path), env);
  assert.equal(response.status, 200, path); assert.match(response.headers.get('content-type'), /^text\/html/);
  const text = await response.text();
  assert.doesNotMatch(text, /compiled-private|COMPILEDHOOK|a{64}/);
  if (path === '/') assert.match(text, /compras nuevas están temporalmente cerradas/);
}
const config = await (await worker.fetch(new Request(origin + '/api/checkout/config'), env)).json();
assert.equal(config.enabled, false); assert.equal(config.sandbox, false);
env.CHECKOUT_ENABLED = 'true';
const live = await (await worker.fetch(new Request(origin + '/api/checkout/config'), env)).json();
assert.equal(live.enabled, true); assert.equal(live.clientId, 'compiled-public');
const page = await (await worker.fetch(new Request(origin + '/comprar'), env)).text();
assert.match(page, /Compra a YC Systems LLC/); assert.doesNotMatch(page, /PRUEBA SANDBOX/);
const anonymous = await worker.fetch(new Request(origin + '/api/participant/day?day=1&alpha=1'), env);
assert.equal(anonymous.status, 401);
for (const path of ['/assets/app.js', '/assets/ops.js', '/assets/life-program.js', '/.env', '/.git/config']) assert.equal((await worker.fetch(new Request(origin + path), env)).status, 404);
assert.ok((await readFile(new URL('../dist/client/assets/participant.js', import.meta.url), 'utf8')).length > 1000);
console.log('Compiled sales artifact: routes, Live configuration, secret exclusion and anonymous access gates passed. No network or charge.');
