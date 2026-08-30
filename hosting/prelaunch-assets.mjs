import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// This is a separate publishable artifact. The complete participant app stays
// unchanged in the checkout and is NEVER included in this allowlist.
export const PRELAUNCH_FILES = [
  'hosting/prelaunch.html', 'hosting/prelaunch.css', 'assets/styles.css',
  'assets/icon-100-dias.svg', 'assets/icon-100-dias-192.png',
  'assets/icon-100-dias-512.png', 'assets/og-100-dias.png', 'assets/product-day1.png',
];

export const RETIRE_LEGACY_SW = `self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys()) if(key.startsWith('100-dias-shell-')) await caches.delete(key);
  await self.registration.unregister();
})()));`;

const textAsset = (type, data) => ({type, encoding:'utf8', data});
const htmlAsset = data => textAsset('text/html; charset=utf-8', data);
const simplePage = (title, content) => `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} — 100 Días</title><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/prelaunch.css"></head><body class="prelaunch-page"><main class="information-page"><p class="eyebrow">100 Días — El Método · Prelanzamiento</p><h1>${title}</h1>${content}<p><a class="button secondary" href="/">Volver al inicio</a></p></main></body></html>`;

export async function loadPrelaunchAssets(root) {
  const assets = Object.create(null);
  for (const path of PRELAUNCH_FILES) {
    const bytes = await readFile(resolve(root, path));
    const route = path === 'hosting/prelaunch.html' ? '/index.html'
      : path === 'hosting/prelaunch.css' ? '/assets/prelaunch.css' : '/' + path;
    const extension = path.split('.').at(-1);
    const type = {html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png'}[extension];
    const binary = extension === 'png';
    assets[route] = {type, encoding:binary ? 'base64' : 'utf8', data:bytes.toString(binary ? 'base64' : 'utf8')};
  }
  assets['/'] = assets['/index.html'];
  assets['/404.html'] = htmlAsset(simplePage('Esta página no está disponible', '<p>Esta versión incluye únicamente la presentación del Método y una muestra abierta. No tiene un área de participantes activa.</p>'));
  assets['/privacidad.html'] = htmlAsset(simplePage('Información sobre datos y enlaces', '<p>Esta versión de prelanzamiento no solicita datos mediante formularios, no registra participantes y no procesa pagos. La muestra no guarda tus respuestas: usa tu propia libreta o una nota local.</p><p>No hemos incorporado analítica publicitaria ni píxeles de seguimiento en este artefacto. El proveedor de alojamiento puede procesar información técnica necesaria para servir y proteger la página.</p><p>Los enlaces llevan a nuestras cuentas de Instagram, Facebook y YouTube. Si los visitas o interactúas allí, se aplican las condiciones y políticas de esas plataformas.</p><p>Antes de habilitar cuentas, ventas o nuevas formas de recoger datos, habrá que actualizar esta información y revisar los requisitos aplicables. Este aviso describe solamente las funciones presentes en el prelanzamiento.</p>'));
  assets['/robots.txt'] = textAsset('text/plain; charset=utf-8', 'User-agent: *\nDisallow: /\n');
  assets['/sw.js'] = textAsset('text/javascript; charset=utf-8', RETIRE_LEGACY_SW);
  return assets;
}
