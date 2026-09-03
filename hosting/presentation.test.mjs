import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadSalesAssets } from './sales-assets.mjs';
import { checkoutPage } from './checkout-page.mjs';

const root = process.cwd();
const assets = await loadSalesAssets(root);
const sales = assets['/'].data;
const member = assets['/mi-metodo'].data;

test('editorial image is optimized, served with correct MIME, and identified as illustrative', () => {
  const image = assets['/assets/practice-editorial-v2.webp'];
  assert.equal(image.type, 'image/webp');
  const bytes = Buffer.from(image.data, 'base64');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.ok(bytes.length < 150000);
  assert.match(sales, /width="1086" height="1448"/);
  assert.match(sales, /Imagen ilustrativa generada con IA/);
  assert.match(sales, /El recorrido es digital/);
});

test('sales and member shells have valid local links, assets and unique anchors', () => {
  for (const [path, html] of [['/', sales], ['/mi-metodo', member]]) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, path + ': duplicate id');
    for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)), path + ': ' + url);
      else if (url.startsWith('/') && !url.startsWith('/comprar')) assert.ok(assets[url.split('?')[0]], path + ': ' + url);
    }
  }
  assert.doesNotMatch(sales, /href="\/assets\/(?:styles|prelaunch)\.css"/);
});

test('mobile navigation, compact participant menu and honest practice wording are present', () => {
  assert.match(sales, /<nav aria-label="Principal">/);
  assert.match(assets['/assets/sales.css'].data, /\.app-header nav\{order:3;width:100%/);
  assert.match(member, /class="today-link" href="#day-section"/);
  assert.match(member, /<details class="member-menu"><summary>/);
  assert.match(member, /La acción que intenté o tenía prevista/);
  assert.match(member, /Tiempo total de mi práctica/);
  assert.match(sales, /incluido el registro/);
});

test('checkout presentation offers only the two ready plans and keeps explicit delivery', async () => {
  const html = checkoutPage({ enabled: true, mode: 'live', deliveryReady: true });
  assert.match(html, /YC Systems LLC/);
  assert.match(html, /value="alpha"/); assert.match(html, /value="metodo"/);
  assert.doesNotMatch(html, /Sistema|Premium/);
  assert.match(html, /No enviamos un correo automático/);
  for (const file of ['sales.css', 'participant.css', 'checkout.css']) {
    const css = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(css, /color-scheme:light/);
    assert.match(css, /focus-visible/);
  }
});
