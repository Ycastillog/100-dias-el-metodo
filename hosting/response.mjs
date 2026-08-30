export function respond(request, assets) {
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('Allow', 'GET, HEAD');
    return new Response('Esta versión no acepta registros ni pagos.', { status: 405, headers });
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url).pathname); }
  catch { return new Response('Dirección no válida.', { status: 400, headers }); }
  const found = Object.hasOwn(assets, pathname) ? assets[pathname] : null;
  const asset = found ?? assets['/404.html'];
  if (!asset) return new Response(null, { status: 404, headers });
  headers.set('Content-Type', asset.type);
  const body = request.method === 'HEAD' ? null : asset.encoding === 'base64'
    ? Uint8Array.from(atob(asset.data), c => c.charCodeAt(0))
    : asset.data;
  return new Response(body, { status: found ? 200 : 404, headers });
}
