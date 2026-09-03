import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const script = await readFile(new URL('./checkout.js', import.meta.url), 'utf8');
const ID = '472d83db-8b7a-4e8a-a9dc-e7fe369b45ca';
function ui() {
  const values = new Map(); const requests = []; const callbacks = {};
  const make = () => ({ disabled: false, hidden: true, textContent: '', value: '', listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, replaceChildren() {}, reportValidity() { return true; } });
  const nodes = Object.fromEntries(['#checkout-form', '#checkout-state', '#checkout-continue', '#paypal-buttons', '#checkout-recovery', '#checkout-access', '#purchase-code', '#check-last-order', '#save-purchase-code'].map(id => [id, make()]));
  const inputs = [make(), make(), make()]; nodes['#checkout-form'].querySelectorAll = () => inputs;
  nodes['#checkout-form'].querySelector = () => inputs[0];
  const f = { nodes, values, requests, callbacks, receipt: { id: ID, status: 'paid', sandbox: false, access: { code: 'PRIVATE-CODE', url: '/mi-metodo', expiresAt: new Date(Date.now() + 86400000).toISOString() } }, config: { enabled: true, clientId: 'PUBLIC-ID', sandbox: false } };
  const env = { document: { querySelector: selector => nodes[selector], createElement: make, head: { append() {} } }, window: { paypal: { Buttons(options) { Object.assign(callbacks, options); return { render: async () => {}, close: async () => {} }; } } }, location: { search: '?plan=alpha', origin: 'https://100diaselmetodo.com' }, localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }, crypto, FormData: class { get(key) { return { plan: 'alpha', email: 'test@example.com', terms: 'on' }[key]; } }, URL, URLSearchParams, Blob, setTimeout, fetch: async (url, options) => {
    requests.push({ url, body: options.body ? JSON.parse(options.body) : null });
    if (url.endsWith('/config')) return Response.json(f.config);
    if (url === '/api/paypal/orders') return Response.json({ id: ID, paypalOrderId: 'ORDER123' });
    if (f.failCapture && url.endsWith('/capture')) return Response.json({ error: 'paypal_unavailable' }, { status: 503 });
    if (f.waitCapture && url.endsWith('/capture')) await f.waitCapture;
    return Response.json(f.receipt);
  } };
  vm.runInNewContext(script, env);
  f.submit = () => nodes['#checkout-form'].listeners.submit({ preventDefault() {} });
  f.check = () => nodes['#check-last-order'].listeners.click({ currentTarget: nodes['#check-last-order'] });
  return f;
}
test('checkout UI stores only a reference, not credentials, and duplicate approvals capture once', async () => {
  const f = ui(); await f.submit(); await f.callbacks.createOrder();
  let done; f.waitCapture = new Promise(resolve => { done = resolve; });
  const first = f.callbacks.onApprove({ orderID: 'ORDER123' }, {});
  await f.callbacks.onApprove({ orderID: 'ORDER123' }, {}); done(); await first;
  assert.equal(f.requests.filter(request => request.url.endsWith('/capture')).length, 1);
  assert.equal(f.nodes['#checkout-access'].hidden, false);
  assert.equal(f.nodes['#purchase-code'].value, 'PRIVATE-CODE');
  assert.ok([...f.values.values()].every(value => !value.includes('PRIVATE-CODE')));
  assert.equal(f.requests.find(request => request.url === '/api/paypal/orders').body.terms, true);
});
test('lost capture response leaves a queryable order; status recovers access without another capture', async () => {
  const f = ui(); await f.submit(); await f.callbacks.createOrder(); f.failCapture = true;
  await f.callbacks.onApprove({ orderID: 'ORDER123' }, {});
  assert.equal(f.nodes['#checkout-access'].hidden, true); assert.equal(f.nodes['#checkout-recovery'].hidden, false);
  await f.check(); assert.equal(f.nodes['#checkout-access'].hidden, false);
  assert.equal(f.requests.filter(request => request.url.endsWith('/capture')).length, 1);
});
test('pending, refunded, cancelled, unavailable and invalid forms do not show an access code', async () => {
  for (const status of ['pending', 'refunded', 'reversed', 'review', 'denied']) {
    const f = ui(); f.receipt = { id: ID, status, sandbox: false }; await f.submit(); await f.callbacks.createOrder(); await f.callbacks.onApprove({ orderID: 'ORDER123' }, {});
    assert.equal(f.nodes['#checkout-access'].hidden, true); assert.equal(f.nodes['#purchase-code'].value, '');
  }
  const f = ui(); await f.submit(); f.callbacks.onCancel(); assert.equal(f.requests.filter(request => request.url.endsWith('/capture')).length, 0);
  const g = ui(); g.config.enabled = false; await g.submit(); assert.equal(g.callbacks.createOrder, undefined);
  const h = ui(); h.nodes['#checkout-form'].reportValidity = () => false; await h.submit(); assert.equal(h.requests.length, 0);
});
