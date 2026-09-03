import { handleAnalyticsEvent, handleWaitlistSignup } from './waitlist.mjs';
import { handleCheckout } from './checkout.mjs';
import { handleParticipant } from './participant.mjs';
import { checkoutConfiguration, paymentEnvironment } from './catalog.mjs';
import { programReady, secretReady } from './purchase-access.mjs';

export async function respond(request, assets, env = {}, program = null) {
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url).pathname); }
  catch { return new Response('Dirección no válida.', { status: 400, headers }); }

  const checkout = await handleCheckout(request, env, { program });
  if (checkout) return checkout;

  const participant = await handleParticipant(request, env, program);
  if (participant) return participant;

  if (pathname === '/api/waitlist') return handleWaitlistSignup(request, env, headers);
  if (pathname === '/api/events') return handleAnalyticsEvent(request, env, headers);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('Allow', 'GET, HEAD');
    return new Response('Esta versión no acepta ese tipo de solicitud.', { status: 405, headers });
  }
  const found = Object.hasOwn(assets, pathname) ? assets[pathname] : null;
  if (['/', '/index.html'].includes(pathname) && program) headers.delete('X-Robots-Tag');
  if (pathname === '/mi-metodo') headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  const asset = found ?? assets['/404.html'];
  if (!asset) return new Response(null, { status: 404, headers });
  headers.set('Content-Type', asset.type);
  let body = request.method === 'HEAD' ? null : asset.encoding === 'base64'
    ? Uint8Array.from(atob(asset.data), c => c.charCodeAt(0))
    : asset.data;
  if (program && ['/', '/index.html'].includes(pathname) && typeof body === 'string' && !checkoutConfiguration(paymentEnvironment(env), programReady(program) && secretReady(env)).enabled) {
    body = body.replace('<aside class="launch-notice">', '<aside class="launch-notice"><strong>Pago en verificación final: las compras nuevas están temporalmente cerradas.</strong><br>');
  }
  return new Response(body, { status: found ? 200 : 404, headers });
}
