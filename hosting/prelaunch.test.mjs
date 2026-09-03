import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { loadPrelaunchAssets, RETIRE_LEGACY_SW } from './prelaunch-assets.mjs';
import { respond } from './response.mjs';

const assets = await loadPrelaunchAssets(fileURLToPath(new URL('../', import.meta.url)));
const request = (path, init) => new Request('https://100diaselmetodo.com' + path, init);

test('prelaunch has explicit status, waitlist and verified social links', async()=>{
  const html = await (await respond(request('/'),assets)).text();
  for(const value of ['Prelanzamiento','No inventes cifras','action="/api/waitlist"','https://www.youtube.com/@100diaselmetodooficial','https://www.instagram.com/100diaselmetodo/','https://www.facebook.com/100diaselmetodo']) assert.ok(html.includes(value),value);
  assert.doesNotMatch(html, /buy\.stripe\.com|paypal\.com|href="[^"#]*(?:acceso|biblioteca|embajadores)\.html/i);
  assert.doesNotMatch(html, /link[^>]+rel="manifest"/i);
});

test('participant program and every obsolete entry point fail closed',async()=>{
  for(const path of ['/acceso.html','/acceso.html?alpha=1','/biblioteca.html','/embajadores.html','/gracias-embajador.html','/assets/payments.js','/assets/app.js','/assets/life-program.js','/assets/library.js','/assets/ops.js','/assets/site-config.js','/manifest.webmanifest','/.openai/hosting.json','/.git/config','/.env','/hosting/prelaunch.html','/public/downloads/README.txt']) assert.equal((await respond(request(path),assets)).status,404,path);
});

test('alpha query never changes the public artifact', async()=>{
  assert.equal(await (await respond(request('/?alpha=1'),assets)).text(),await (await respond(request('/'),assets)).text());
});

test('all local links, image and stylesheet URLs exist in the artifact',()=>{
  const html=assets['/'].data;
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(url.startsWith('https:')) continue;
    if(url.startsWith('#')) { assert.ok(html.includes(`id="${url.slice(1)}"`),url);continue; }
    assert.ok(Object.hasOwn(assets,url.startsWith('/')?url:'/'+url),url);
  }
});

test('artifact routes are exactly the reviewed public files',()=>{
  assert.deepEqual(Object.keys(assets).sort(),['/','/index.html','/assets/prelaunch.css','/assets/prelaunch.js','/assets/checkout.css','/assets/checkout.js','/assets/styles.css','/assets/icon-100-dias.svg','/assets/icon-100-dias-192.png','/assets/icon-100-dias-512.png','/assets/og-100-dias.png','/assets/product-day1.png','/404.html','/gracias.html','/privacidad.html','/robots.txt','/sw.js'].sort());
});

test('retirement worker removes only this app legacy caches and unregisters',async()=>{
  const handlers={};const removed=[];let retired=false;let settled;
  vm.runInNewContext(RETIRE_LEGACY_SW,{self:{addEventListener:(event,handler)=>handlers[event]=handler,skipWaiting:()=>{},registration:{unregister:async()=>{retired=true;}}},caches:{keys:async()=>['100-dias-shell-v1','other-app','100-dias-shell-v4'],delete:async key=>removed.push(key)}});
  handlers.activate({waitUntil:promise=>settled=promise}); await settled;
  assert.deepEqual(removed,['100-dias-shell-v1','100-dias-shell-v4']);assert.equal(retired,true);
});

test('prelaunch never acknowledges submitted registrations or payments',async()=>{
  for(const method of ['POST','PUT','PATCH','DELETE']) assert.equal((await respond(request('/',{method}),assets)).status,405);
  assert.equal(await (await respond(request('/',{method:'HEAD'}),assets)).text(),'');
  assert.equal((await respond(request('/%E0%A4%A'),assets)).status,400);
});
