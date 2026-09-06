import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadSalesAssets } from './sales-assets.mjs';
import { checkoutPage } from './checkout-page.mjs';
import { respond } from './response.mjs';

const root = process.cwd();
const assets = await loadSalesAssets(root);
const sales = assets['/'].data;
const member = assets['/mi-metodo'].data;

test('public example video supports native byte-range seeking without unlocking paid audio',async()=>{
  const result=await respond(new Request('https://100diaselmetodo.com/assets/first-step-example.mp4',{headers:{range:'bytes=0-127'}}),assets);
  assert.equal(result.status,206);assert.equal(result.headers.get('content-type'),'video/mp4');assert.equal((await result.arrayBuffer()).byteLength,128);assert.match(result.headers.get('content-range'),/^bytes 0-127\//);
});

test('legacy artwork is preserved and the page features a disclosed optional video instead of a notebook', () => {
  const image = assets['/assets/practice-editorial-v2.webp'];
  assert.equal(image.type, 'image/webp');
  const bytes = Buffer.from(image.data, 'base64');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.ok(bytes.length < 150000);
  assert.doesNotMatch(sales, /<img[^>]*practice-editorial/);
  assert.match(sales, /<video controls playsinline preload="none"/);
  assert.match(sales, /voz sintética y subtítulos integrados/);
  assert.match(sales, /no es un testimonio/);
  const video = assets['/assets/first-step-example.mp4'];
  assert.equal(video.type,'video/mp4');
  assert.ok(Buffer.from(video.data,'base64').length<2500000);
  assert.match(sales, /plataforma web privada/);
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
  assert.match(sales, /incluye la práctica y el registro/);
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
