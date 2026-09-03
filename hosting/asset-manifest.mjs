import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Explicit allowlist: never expose the repository, configuration, or local files.
export const PUBLIC_FILES = [
  'index.html', 'acceso.html', 'biblioteca.html', 'embajadores.html',
  'gracias.html', 'gracias-embajador.html', 'privacidad.html', 'terminos.html',
  'terminos-embajadores.html', '404.html', 'manifest.webmanifest',
  'assets/styles.css', 'assets/embajadores.css', 'assets/app.js',
  'assets/life-program.js', 'assets/library.js', 'assets/affiliate-links.js',
  'assets/site-config.js', 'assets/ops.js', 'assets/embajadores.js',
  'assets/embajadores-gracias.js', 'assets/icon-100-dias.svg',
  'assets/icon-100-dias-192.png', 'assets/icon-100-dias-512.png',
  'assets/og-100-dias.png', 'assets/aurelia-guia.webp',
  'assets/embajadores-dia1-hero.png', 'assets/product-day1.png',
  'assets/product-dashboard.png', 'assets/product-checkout.png',
  'hosting/checkout.css', 'hosting/checkout.js',
];

const CONTENT_TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8', svg: 'image/svg+xml',
  png: 'image/png', webp: 'image/webp', webmanifest: 'application/manifest+json',
};

export const REVIEW_NOTICE = 'Vista privada de revisión. Los cobros están desactivados; esta versión no registra clientes ni valida accesos de pago.';

export function prepareText(path, text) {
  if (!path.endsWith('.html')) return text;
  return text.replace(/<body([^>]*)>/i, `<body$1><aside role="note" style="padding:12px 20px;background:#f0cf7a;color:#17140d;font:600 14px/1.5 system-ui;text-align:center;position:relative;z-index:100">${REVIEW_NOTICE}</aside>`)
    .replace(/<head>/i, '<head><meta name="robots" content="noindex,nofollow">');
}

export async function loadAssets(root) {
  const entries = await Promise.all(PUBLIC_FILES.map(async path => {
    const bytes = await readFile(resolve(root, path));
    const type = CONTENT_TYPES[path.split('.').at(-1)];
    const text = /^(text\/|application\/)/.test(type) || type === 'image/svg+xml';
    const route = path.startsWith('hosting/checkout.') ? '/assets/' + path.split('/').at(-1) : '/' + path;
    return [route, {
      type,
      encoding: text ? 'utf8' : 'base64',
      data: text ? prepareText(path, bytes.toString('utf8')) : bytes.toString('base64'),
    }];
  }));
  const result = Object.fromEntries(entries);
  result['/'] = result['/index.html'];
  result['/assets/payments.js'] = {
    type: CONTENT_TYPES.js, encoding: 'utf8',
    data: 'window.PAYMENT_LINKS = {}; // Payments intentionally disabled in private review.\n',
  };
  result['/robots.txt'] = {
    type: 'text/plain; charset=utf-8', encoding: 'utf8',
    data: 'User-agent: *\nDisallow: /\n',
  };
  // Prevent the legacy offline shell from retaining checkout or access state.
  result['/sw.js'] = {
    type: CONTENT_TYPES.js, encoding: 'utf8',
    data: 'self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",event=>event.waitUntil(self.registration.unregister()));',
  };
  return result;
}
