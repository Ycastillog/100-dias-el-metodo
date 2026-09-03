import { planFor, paymentEnvironment } from './catalog.mjs';
import { paymentStore } from './payment-store.mjs';
import { participantStore, validateRecord } from './participant-store.mjs';
import { accessCookie, accessExpiry, readAccessCookie, verifyAccessCode, isAccessible, programReady, secretReady, issueAccess } from './purchase-access.mjs';
import { allowRequest } from './request-limit.mjs';
import { canonicalPayment, clearCheckoutCookie } from './checkout.mjs';
import { paypalClient } from './paypal.mjs';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers });
const fail = (error, status = 400) => json({ error }, status);
async function bodyJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 16_384) { await reader.cancel(); throw new Error('body'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('body');
  return value;
}

// A purchase receipt is a bearer entitlement to one paid product, not a user
// account. Every request rechecks that order in D1, including refund and expiry.
export async function handleParticipant(request, rawEnv, program, dependencies = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/participant/')) return null;
  const env = paymentEnvironment(rawEnv);
  if (!programReady(program) || !secretReady(env) || !env.DB?.prepare) return fail('access_unavailable', 503);
  if (url.origin !== env.CHECKOUT_ORIGIN) return fail('invalid_origin', 403);
  if (request.method === 'POST' && (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site')) return fail('invalid_origin', 403);
  const path = url.pathname.slice('/api/participant/'.length);
  const expected = ['redeem', 'logout', 'record'].includes(path) ? 'POST' : 'GET';
  if (request.method !== expected) return fail('method_not_allowed', 405);
  if (!['redeem', 'logout', 'record', 'session', 'day', 'access'].includes(path)) return fail('not_found', 404);
  try {
    if (path === 'redeem' && !await allowRequest(request, env, 'redeem', 20)) return fail('rate_limited', 429);
    if (path === 'logout') {
      const response = json({ signedOut: true });
      response.headers.append('Set-Cookie', accessCookie(request, '', 0));
      response.headers.append('Set-Cookie', clearCheckoutCookie(request));
      return response;
    }
    const body = request.method === 'POST' ? await bodyJson(request) : null;
    const code = path === 'redeem' ? body.code : readAccessCookie(request);
    const id = await verifyAccessCode(code, env);
    const payments = paymentStore(env.DB);
    let order = id ? await payments.byId(id) : null;
    // Webhooks are primary; also reconcile older paid records on use so a
    // missing or delayed notification cannot leave a refunded access open.
    if (isAccessible(order, env) && Date.now() - Date.parse(order.updated_at) > 600_000) {
      const verified = await canonicalPayment(dependencies.client || paypalClient(env), order, env.PAYPAL_MERCHANT_ID);
      if (!verified) return fail('access_unavailable', 503);
      order = await payments.reconcile(order, verified.capture, verified.status, new Date().toISOString());
    }
    if (!isAccessible(order, env)) return fail('access_denied', 401);
    const plan = planFor(order.plan_key);
    if (path === 'redeem') {
      const response = json({ url: '/mi-metodo' }); response.headers.set('Set-Cookie', accessCookie(request, code.trim(), accessExpiry(order))); return response;
    }
    const records = participantStore(env.DB);
    if (path === 'session') return json({
      plan: { key: plan.key, name: plan.name, days: plan.accessDays }, expiresAt: new Date(accessExpiry(order)).toISOString(), sandbox: order.environment === 'sandbox',
      records: await records.all(order.id),
      days: program.lessons.slice(0, plan.accessDays).map(day => ({ day: day.day, title: day.theme || 'Tu práctica diaria' })),
    });
    if (path === 'access') return json({ access: await issueAccess(order, env) });
    if (path === 'day') {
      const day = Number(url.searchParams.get('day'));
      if (!Number.isInteger(day) || day < 1 || day > plan.accessDays) return fail('day_not_available', 403);
      const profile = (await records.get(order.id, 'profile'))?.body || {};
      return json({ lesson: program.lessons[day - 1], practice: program.getLifeProgram(day, profile) });
    }
    if (path === 'record') {
      if (typeof body.key !== 'string' || !Number.isSafeInteger(body.revision) || body.revision < 0) return fail('invalid_record');
      const cleaned = validateRecord(body.key, body.body, plan.accessDays);
      if (!cleaned) return fail('invalid_record');
      const saved = await records.save(order.id, body.key, cleaned, body.revision);
      return saved ? json({ record: saved }) : fail('record_conflict', 409);
    }
  } catch (error) {
    return fail(error instanceof SyntaxError || error.message === 'body' ? 'invalid_request' : 'access_unavailable', error instanceof SyntaxError || error.message === 'body' ? 400 : 503);
  }
}
