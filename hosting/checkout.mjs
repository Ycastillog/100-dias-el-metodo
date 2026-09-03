import { PLANS, planFor, checkoutConfiguration, paymentEnvironment } from './catalog.mjs';
import { paypalClient, PayPalError, verifyOrder, verifyCapture } from './paypal.mjs';
import { paymentStore } from './payment-store.mjs';
import { checkoutPage } from './checkout-page.mjs';
import { programReady, secretReady, readyPlan, issueAccess, accessCookie, accessExpiry, isAccessible } from './purchase-access.mjs';
import { allowRequest } from './request-limit.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const SESSION = /^[a-f0-9]{64}$/;
const WEBHOOK_TYPES = new Set(['PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.PENDING', 'PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED', 'PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED']);
const now = () => new Date().toISOString();
const cookieName = request => new URL(request.url).protocol === 'https:' ? '__Host-metodo-checkout' : 'metodo-checkout-dev';
export const clearCheckoutCookie = request => cookieName(request) + '=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + (new URL(request.url).protocol === 'https:' ? '; Secure' : '');
function sessionToken(request) {
  const cookies = (request.headers.get('cookie') || '').split(';').map(value => value.trim());
  const value = cookies.find(value => value.startsWith(cookieName(request) + '='))?.split('=').slice(1).join('=');
  return SESSION.test(value || '') ? value : null;
}
async function sessionHash(request) {
  const token = sessionToken(request);
  if (!token) return null;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2, '0')).join('');
}
function checkoutCookie(request) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  return cookieName(request) + '=' + token + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000' + (new URL(request.url).protocol === 'https:' ? '; Secure' : '');
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
}
const failure = (error, status = 400) => json({ error }, status);
async function readJson(request, limit = 4096) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('content_type');
  if (Number(request.headers.get('content-length')) > limit) throw new Error('body_too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('empty_body');
  const chunks = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new Error('body_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_body');
  return { raw, data };
}
function receipt(order) {
  return { id: order.id, plan: order.plan_key, amountCents: order.amount_cents, currency: order.currency,
    billing: 'one_time', status: order.status, deliveryStatus: order.delivery_status, sandbox: order.environment === 'sandbox' };
}
async function receiptResponse(request, order, env, store, deliveryReady) {
  let access = null;
  if (deliveryReady && isAccessible(order, env)) {
    order = await store.markAvailable(order.id, now());
    access = await issueAccess(order, env);
  }
  const response = json({ ...receipt(order), ...(access ? { access } : {}) });
  if (access) response.headers.set('Set-Cookie', accessCookie(request, access.code, accessExpiry(order)));
  return response;
}
export async function canonicalPayment(client, order, merchantId) {
  const remote = await client.getOrder(order.paypal_order_id);
  const unit = verifyOrder(remote, order, merchantId);
  const captures = unit.payments?.captures;
  if (!captures?.length) return null;
  if (captures.length !== 1) throw new PayPalError('payment_mismatch');
  // Current capture status detects refunds even after a delayed COMPLETED event.
  const capture = await client.getCapture(captures[0].id);
  if (capture.id !== captures[0].id) throw new PayPalError('payment_mismatch');
  return { capture, status: verifyCapture(capture, order, merchantId) };
}
async function processWebhook(request, env, store, client) {
  let raw, event;
  try { ({ raw, data: event } = await readJson(request, 128 * 1024)); }
  catch { return failure('invalid_request'); }
  if (typeof event.id !== 'string' || event.id.length > 160 || !event.id || typeof event.event_type !== 'string' || event.event_type.length > 100) return failure('invalid_request');
  if (!await client.verifyWebhook(request.headers, raw)) return failure('invalid_signature', 401);
  if (await store.eventSeen(event.id)) return json({ received: true });
  if (!WEBHOOK_TYPES.has(event.event_type)) { await store.markEvent(event, now()); return json({ received: true }); }
  const resource = event.resource || {};
  const paypalId = resource.supplementary_data?.related_ids?.order_id;
  let order = paypalId ? await store.byPayPal(paypalId) : null;
  let captureId = resource.supplementary_data?.related_ids?.capture_id;
  if (!captureId && event.event_type !== 'PAYMENT.CAPTURE.REFUNDED') captureId = resource.id;
  if (!captureId && Array.isArray(resource.links)) {
    for (const link of resource.links) {
      if (link.rel !== 'up') continue;
      try { captureId = /^\/v2\/payments\/captures\/([A-Z0-9]{1,36})$/.exec(new URL(link.href).pathname)?.[1]; } catch {}
    }
  }
  if (!order && captureId) order = await store.byCapture(captureId);
  // A webhook may race local persistence. Return a retryable error rather than
  // permanently acknowledging an unrecorded payment. Never fetch event URLs.
  if (!order) return failure('order_not_ready', 503);
  if (order.environment !== env.PAYPAL_ENV) return failure('payment_mismatch', 409);
  const verified = await canonicalPayment(client, order, env.PAYPAL_MERCHANT_ID);
  if (!verified) return failure('payment_not_ready', 503);
  await store.reconcile(order, verified.capture, verified.status, now(), event);
  return json({ received: true });
}

// Dependency injection is test-only; requests cannot supply a client or store.
export async function handleCheckout(request, env = {}, dependencies = {}) {
  const path = new URL(request.url).pathname;
  if (!(path === '/comprar' || path === '/api/checkout/config' || path === '/api/paypal/webhook' || path === '/api/paypal/orders' || path.startsWith('/api/paypal/orders/') || path.startsWith('/api/checkout/orders/'))) return null;
  env = paymentEnvironment(env);
  const deliveryReady = programReady(dependencies.program) && secretReady(env);
  const config = checkoutConfiguration(env, deliveryReady);
  if (path === '/comprar') {
    if (!['GET', 'HEAD'].includes(request.method)) return failure('method_not_allowed', 405);
    const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" });
    if (config.configured && !sessionToken(request) && request.method === 'GET') headers.set('Set-Cookie', checkoutCookie(request));
    return new Response(request.method === 'HEAD' ? null : checkoutPage(config), { headers });
  }
  if (path === '/api/checkout/config') {
    if (request.method !== 'GET') return failure('method_not_allowed', 405);
    return json({ enabled: config.enabled, sandbox: config.mode === 'sandbox', clientId: config.enabled ? config.clientId : null, plans: Object.values(PLANS).map(plan => ({ ...plan, available: readyPlan(plan.key) })) });
  }
  const isStatus = /^\/api\/checkout\/orders\/([a-f0-9-]+)$/.exec(path);
  if (request.method !== (isStatus ? 'GET' : 'POST')) return failure('method_not_allowed', 405);
  // Closing new sales must not disable receipts, refunds or pending captures.
  if (!config.configured) return failure('sales_closed', 503);
  if (path === '/api/paypal/orders' && !config.enabled) return failure('sales_closed', 503);
  if (new URL(request.url).origin !== config.origin) return failure('invalid_origin', 403);
  if (path !== '/api/paypal/webhook' && request.method === 'POST' && (request.headers.get('origin') !== config.origin || request.headers.get('sec-fetch-site') === 'cross-site')) return failure('invalid_origin', 403);
  let phase = 'initialization';
  try {
    const store = dependencies.store || paymentStore(env.DB);
    const client = dependencies.client || paypalClient(env);
    if (path === '/api/paypal/webhook') return await processWebhook(request, env, store, client);
    const hash = await sessionHash(request);
    if (!hash) return failure('session_missing', 401);
    if (isStatus) {
      if (!UUID.test(isStatus[1])) return failure('order_not_found', 404);
      const order = await store.byId(isStatus[1]);
      if (!order || order.session_hash !== hash || order.environment !== config.mode) return failure('order_not_found', 404);
      if (order.paypal_order_id) {
        const verified = await canonicalPayment(client, order, env.PAYPAL_MERCHANT_ID);
        if (verified) return await receiptResponse(request, await store.reconcile(order, verified.capture, verified.status, now()), env, store, deliveryReady);
      }
      return await receiptResponse(request, order, env, store, deliveryReady);
    }
    let data;
    try { ({ data } = await readJson(request)); } catch { return failure('invalid_request'); }
    if (path === '/api/paypal/orders') {
      const plan = planFor(data.plan);
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      if (!plan || !UUID.test(data.requestId || '') || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email)) return failure('invalid_request');
      if (config.mode === 'live' && data.terms !== true) return failure('terms_required');
      if (!readyPlan(plan.key)) return failure('plan_not_available', 409);
      let order = await store.byId(data.requestId);
      if (!order) {
        if (!await allowRequest(request, env, 'new-order', 24, 3600)) return failure('rate_limited', 429);
        if (await store.recentCount(hash, new Date(Date.now() - 3_600_000).toISOString()) >= 8) return failure('rate_limited', 429);
        order = await store.create({ id: data.requestId, session_hash: hash, plan_key: plan.key, amount_cents: plan.amountCents, currency: plan.currency, environment: config.mode, contact_email: email, capture_request_id: crypto.randomUUID(), created_at: now() });
      }
      if (order.session_hash !== hash || order.plan_key !== plan.key || order.contact_email !== email || order.environment !== config.mode) return failure('order_conflict', 409);
      if (Date.now() - Date.parse(order.created_at) > 5 * 3_600_000) return failure('order_expired', 409);
      if (!order.paypal_order_id) {
        phase = 'provider_create';
        const remote = await client.create(order, plan);
        phase = 'persist_provider_order';
        if (!/^[A-Z0-9]{1,36}$/.test(remote.id || '')) throw new PayPalError();
        await store.setPayPal(order.id, remote.id, now());
        order = await store.byId(order.id);
      }
      return json({ id: order.id, paypalOrderId: order.paypal_order_id, billing: 'one_time' });
    }
    const captureRoute = /^\/api\/paypal\/orders\/([a-f0-9-]+)\/capture$/.exec(path);
    if (!captureRoute || !UUID.test(captureRoute[1])) return failure('order_not_found', 404);
    if (config.mode === 'live' && !deliveryReady) return failure('delivery_not_ready', 503);
    let order = await store.byId(captureRoute[1]);
    if (!order || order.session_hash !== hash || order.environment !== config.mode || !order.paypal_order_id) return failure('order_not_found', 404);
    if (!readyPlan(order.plan_key)) return failure('plan_not_available', 409);
    if (data.paypalOrderId !== order.paypal_order_id) return failure('payment_mismatch', 409);
    // Validate amount, metadata and merchant before trying to capture.
    const before = await client.getOrder(order.paypal_order_id);
    verifyOrder(before, order, env.PAYPAL_MERCHANT_ID);
    if (!before.purchase_units[0].payments?.captures?.length) {
      if (before.status !== 'APPROVED') return failure('payment_not_approved', 409);
      if (Date.now() - Date.parse(order.created_at) > 5 * 3_600_000) return failure('order_expired', 409);
      try { await client.capture(order); }
      catch (error) { if (error.code === 'instrument_declined') throw error; }
      // A timeout may follow a successful payment. Reconcile, do not replace it.
    }
    const verified = await canonicalPayment(client, order, env.PAYPAL_MERCHANT_ID);
    if (!verified) return failure('payment_not_confirmed', 503);
    order = await store.reconcile(order, verified.capture, verified.status, now());
    return await receiptResponse(request, order, env, store, deliveryReady);
  } catch (error) {
    const code = error instanceof PayPalError ? error.code : 'checkout_unavailable';
    // Deliberately exclude raw messages, request headers, emails and secrets.
    const message = String(error?.message || '');
    const category = /illegal invocation|incorrect.*this/i.test(message) ? 'receiver'
      : /ByteString|Latin1|Invalid character|btoa/i.test(message) ? 'encoding'
      : /AbortSignal|timeout/i.test(message) ? 'timeout_api'
      : /fetch|network|connection|TLS/i.test(message) ? 'transport'
      : /D1|SQLITE/i.test(message) ? 'database' : 'other';
    const reason = /RequestRedirect|redirect.*enum|redirect.*invalid/i.test(message) ? 'unsupported_redirect_mode'
      : /illegal invocation|incorrect.*this/i.test(message) ? 'missing_receiver' : undefined;
    console.error('checkout_failure', { phase, code, category, reason, name: ['TypeError', 'Error', 'InvalidCharacterError', 'ReferenceError'].includes(error?.name) ? error.name : 'ProviderError' });
    return failure(code, code === 'payment_mismatch' ? 409 : 503);
  }
}
