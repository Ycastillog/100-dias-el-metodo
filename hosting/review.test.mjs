import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadAssets, REVIEW_NOTICE } from './asset-manifest.mjs';
import { respond } from './response.mjs';

const assets = await loadAssets(fileURLToPath(new URL('../', import.meta.url)));
const request = (path, init) => new Request('https://review.example' + path, init);

test('review preserves the landing and explains its limitations', async () => {
  const response = await respond(request('/'), assets);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('Deja de empezar de nuevo.'));
  assert.ok(html.includes(REVIEW_NOTICE));
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});
test('checkout URLs are absent from the hosted payment configuration', async () => {
  const text = await (await respond(request('/assets/payments.js'), assets)).text();
  assert.ok(text.includes('window.PAYMENT_LINKS = {}'));
  assert.doesNotMatch(text, /buy\.stripe\.com|paypal\.com/);
});
test('repository, secrets, source and unknown files are not served', async () => {
  for (const path of ['/.git/config', '/.env', '/.openai/hosting.json', '/package.json', '/hosting/worker.mjs', '/public/downloads/README.txt', '/assets/missing.js', '/__proto__']) {
    assert.equal((await respond(request(path), assets)).status, 404, path);
  }
});
test('POST outside the waitlist cannot produce an acknowledgement', async () => {
  assert.equal((await respond(request('/', { method: 'POST', body: 'email=test@example.com' }), assets)).status, 405);
});
test('HEAD returns no body and image bytes preserve their MIME type', async () => {
  assert.equal(await (await respond(request('/', { method: 'HEAD' }), assets)).text(), '');
  const response = await respond(request('/assets/icon-100-dias-512.png'), assets);
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer()).slice(0, 4)], [137, 80, 78, 71]);
});
test('malformed URLs fail closed and legacy checkout caching is not installed', async () => {
  assert.equal((await respond(request('/%E0%A4%A'), assets)).status, 400);
  const sw = await (await respond(request('/sw.js'), assets)).text();
  assert.ok(sw.includes('unregister'));
  assert.doesNotMatch(sw, /cache\.addAll/);
});
