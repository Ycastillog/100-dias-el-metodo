import { planFor } from './catalog.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const CODE = /^([a-f0-9-]{36})\.([a-f0-9]{64})$/;
const encoder = new TextEncoder();
const toHex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const fromHex = hex => Uint8Array.from(hex.match(/../g), byte => parseInt(byte, 16));
export const readyPlan = key => ['alpha', 'metodo'].includes(key);
export const programReady = program => program?.lessons?.length === 100 && typeof program.getLifeProgram === 'function';
export const secretReady = env => typeof env.ACCESS_SIGNING_SECRET === 'string' && /^[a-f0-9]{64}$/.test(env.ACCESS_SIGNING_SECRET);
export const accessCookieName = request => new URL(request.url).protocol === 'https:' ? '__Host-metodo-access' : 'metodo-access-dev';

async function signingKey(env) {
  if (!secretReady(env)) throw new Error('access_not_configured');
  return crypto.subtle.importKey('raw', fromHex(env.ACCESS_SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export function accessExpiry(order) {
  const plan = planFor(order.plan_key);
  if (!plan || !order.paid_at) return 0;
  return Date.parse(order.paid_at) + plan.accessDays * 86_400_000;
}
export function isAccessible(order, env, now = Date.now()) {
  return !!order && readyPlan(order.plan_key) && order.environment === env.PAYPAL_ENV && order.status === 'paid' && order.delivery_status !== 'revoked' && accessExpiry(order) > now;
}
export async function issueAccess(order, env) {
  if (!isAccessible(order, env)) return null;
  const signature = await crypto.subtle.sign('HMAC', await signingKey(env), encoder.encode(env.PAYPAL_ENV + ':' + order.id));
  return { code: order.id + '.' + toHex(signature), url: '/mi-metodo', expiresAt: new Date(accessExpiry(order)).toISOString() };
}
export async function verifyAccessCode(code, env) {
  if (!secretReady(env) || typeof code !== 'string') return null;
  const match = CODE.exec(code.trim());
  if (!match || !UUID.test(match[1])) return null;
  const valid = await crypto.subtle.verify('HMAC', await signingKey(env), fromHex(match[2]), encoder.encode(env.PAYPAL_ENV + ':' + match[1]));
  return valid ? match[1] : null;
}
export function readAccessCookie(request) {
  const name = accessCookieName(request) + '=';
  return (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(name))?.slice(name.length) || '';
}
export function accessCookie(request, code, expiresAt) {
  const seconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return accessCookieName(request) + '=' + code + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + Math.min(seconds, 8_640_000) + (new URL(request.url).protocol === 'https:' ? '; Secure' : '');
}
