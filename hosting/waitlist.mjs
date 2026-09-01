const MAX_BODY_BYTES = 16_384;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const EVENT_NAMES = new Set(['page_view', 'waitlist_cta', 'social_outbound']);

const clean = (value, max = 160) => String(value ?? '').trim().slice(0, max);
const htmlResponse = (title, message, status, headers) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:16px/1.6 system-ui;background:#090908;color:#f7f4ec;max-width:680px;margin:0 auto;padding:48px 24px"><h1>${title}</h1><p>${message}</p><p><a href="/" style="color:#f0cf7a">Volver al inicio</a></p></body></html>`, { status, headers: responseHeaders });
};

async function readBody(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) throw new Error('body_too_large');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error('body_too_large');
  return text;
}

function parseLead(text) {
  const data = new URLSearchParams(text);
  const email = clean(data.get('email'), 254).toLowerCase();
  return {
    email,
    normalizedEmail: email,
    name: clean(data.get('name'), 80),
    interest: ['metodo', 'libros', 'ambos'].includes(data.get('interest')) ? data.get('interest') : 'metodo',
    source: clean(data.get('utm_source'), 80),
    medium: clean(data.get('utm_medium'), 80),
    campaign: clean(data.get('utm_campaign'), 120),
    consent: data.get('consent') === 'yes',
    honeypot: clean(data.get('website'), 120),
  };
}

export async function handleWaitlistSignup(request, env, headers) {
  if (request.method !== 'POST') {
    const responseHeaders = new Headers(headers);
    responseHeaders.set('Allow', 'POST');
    return new Response('Método no permitido.', { status: 405, headers: responseHeaders });
  }
  if (!request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    return htmlResponse('No pudimos registrar tu correo', 'Envía el formulario desde la página principal.', 415, headers);
  }
  let lead;
  try { lead = parseLead(await readBody(request)); }
  catch { return htmlResponse('No pudimos registrar tu correo', 'La solicitud no es válida. Inténtalo nuevamente.', 400, headers); }
  if (lead.honeypot) return Response.redirect(new URL('/gracias.html', request.url), 303);
  if (!EMAIL_PATTERN.test(lead.email) || !lead.consent) {
    return htmlResponse('Revisa el formulario', 'Escribe un correo válido y confirma que deseas recibir el aviso de lanzamiento.', 400, headers);
  }
  if (!env.DB?.prepare) return htmlResponse('Lista temporalmente no disponible', 'No guardamos tus datos. Inténtalo nuevamente más tarde.', 503, headers);

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO waitlist_leads
      (email, normalized_email, name, interest, source, medium, campaign, created_at, updated_at, consent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(normalized_email) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        interest = excluded.interest,
        source = excluded.source,
        medium = excluded.medium,
        campaign = excluded.campaign,
        updated_at = excluded.updated_at,
        consent_at = excluded.consent_at`)
      .bind(lead.email, lead.normalizedEmail, lead.name || null, lead.interest, lead.source || null, lead.medium || null, lead.campaign || null, now, now, now)
      .run();
  } catch {
    return htmlResponse('Lista temporalmente no disponible', 'No guardamos tus datos. Inténtalo nuevamente más tarde.', 503, headers);
  }
  return Response.redirect(new URL('/gracias.html', request.url), 303);
}

export async function handleAnalyticsEvent(request, env, headers) {
  if (request.method !== 'POST') {
    const responseHeaders = new Headers(headers);
    responseHeaders.set('Allow', 'POST');
    return new Response(null, { status: 405, headers: responseHeaders });
  }
  if (!env.DB?.prepare) return new Response(null, { status: 204, headers });
  let payload;
  try { payload = JSON.parse(await readBody(request)); }
  catch { return new Response(null, { status: 400, headers }); }
  const name = clean(payload.name, 40);
  if (!EVENT_NAMES.has(name)) return new Response(null, { status: 400, headers });
  try {
    await env.DB.prepare(`INSERT INTO analytics_events
      (event_name, detail, path, source, medium, campaign, referrer_host, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(name, clean(payload.detail, 80) || null, clean(payload.path, 200) || '/', clean(payload.source, 80) || null, clean(payload.medium, 80) || null, clean(payload.campaign, 120) || null, clean(payload.referrerHost, 120) || null, new Date().toISOString())
      .run();
  } catch {}
  return new Response(null, { status: 204, headers });
}
