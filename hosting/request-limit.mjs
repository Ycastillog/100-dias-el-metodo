// Cloudflare supplies CF-Connecting-IP at the edge. HMAC makes a stored bucket
// opaque; no email, full URL, receipt code or raw IP is logged in this table.
export async function allowRequest(request, env, action, limit, seconds = 60) {
  if (!env.ACCESS_SIGNING_SECRET) return true; // sandbox-only diagnostic builds
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ACCESS_SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const identity = request.headers.get('cf-connecting-ip') || 'unidentified';
  const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(action + ':' + identity));
  const bucket = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  const window = Math.floor(Date.now() / (seconds * 1000)) * seconds;
  const result = await env.DB.prepare(`INSERT INTO request_limits (bucket, window_start, hits) VALUES (?, ?, 1)
    ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start,
    hits = CASE WHEN request_limits.window_start = excluded.window_start THEN request_limits.hits + 1 ELSE 1 END
    RETURNING hits`).bind(bucket, window).first();
  await env.DB.prepare('DELETE FROM request_limits WHERE bucket IN (SELECT bucket FROM request_limits WHERE window_start < ? LIMIT 8)').bind(Math.floor(Date.now() / 1000) - 86400).run();
  return result.hits <= limit;
}
