import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('./prelaunch.js', import.meta.url), 'utf8');

function setup(reply, { valid = true } = {}) {
  const button = { textContent: 'Quiero recibir el aviso', disabled: false };
  const status = { hidden: true, textContent: '', focused: false, focus() { this.focused = true; } };
  const attributes = new Map();
  const handlers = {};
  const values = { email: 'persona@example.com', consent: 'yes', name: 'Persona', interest: 'metodo' };
  const form = {
    action: 'https://100diaselmetodo.com/api/waitlist',
    values,
    querySelector: selector => selector === '.waitlist-status' ? status : button,
    addEventListener: (event, handler) => { handlers[event] = handler; },
    reportValidity: () => valid,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
  };
  const calls = [];
  const visits = [];
  const fields = ['source', 'medium', 'campaign'].map(key => ({ dataset: { utmField: key }, value: '' }));
  vm.runInNewContext(script, {
    URL, URLSearchParams,
    FormData: class { constructor(target) { return Object.entries(target.values); } },
    location: {
      search: '?utm_source=instagram&utm_medium=reel&utm_campaign=serie02',
      pathname: '/', href: 'https://100diaselmetodo.com/', origin: 'https://100diaselmetodo.com',
      assign: url => visits.push(url),
    },
    document: {
      referrer: 'https://www.instagram.com/',
      querySelector: () => form,
      querySelectorAll: selector => selector === '[data-utm-field]' ? fields : [],
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url === '/api/events') return { status: 204 };
      return reply(url, options);
    },
  });
  let prevented = false;
  const submit = () => handlers.submit({ preventDefault() { prevented = true; } });
  return { button, status, form, attributes, calls, visits, fields, submit, prevented: () => prevented };
}

test('form follows only a confirmed same-origin success redirect', async () => {
  const ui = setup(async () => ({ ok: true, redirected: true, url: 'https://100diaselmetodo.com/gracias.html', status: 200 }));
  await ui.submit();
  assert.equal(ui.prevented(), true);
  assert.deepEqual(ui.visits, ['https://100diaselmetodo.com/gracias.html']);
  assert.equal(ui.button.disabled, true);
  assert.match(ui.status.textContent, /registrado/);
  const request = ui.calls.find(call => call.url.endsWith('/api/waitlist'));
  assert.equal(request.options.body.get('email'), 'persona@example.com');
  assert.equal(request.options.body.get('consent'), 'yes');
  assert.equal(request.options.credentials, 'same-origin');
});

test('invalid fields do not submit; consent is not set by script', async () => {
  const ui = setup(async () => { throw new Error('unexpected request'); }, { valid: false });
  await ui.submit();
  assert.equal(ui.calls.filter(call => call.url.endsWith('/api/waitlist')).length, 0);
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.status.hidden, true);
  assert.doesNotMatch(script, /\.checked\s*=\s*true/);
});

test('server rejection, unexpected HTML, external redirect and connection errors preserve input and allow retry', async () => {
  for (const reply of [
    async () => ({ status: 400, ok: false, url: 'https://100diaselmetodo.com/api/waitlist' }),
    async () => ({ status: 503, ok: false, url: 'https://100diaselmetodo.com/api/waitlist' }),
    async () => ({ status: 200, ok: true, redirected: false, url: 'https://100diaselmetodo.com/api/waitlist' }),
    async () => ({ status: 200, ok: true, redirected: true, url: 'https://external.example/gracias.html' }),
    async () => { throw new Error('network unavailable'); },
  ]) {
    const ui = setup(reply);
    await ui.submit();
    assert.equal(ui.visits.length, 0);
    assert.equal(ui.button.disabled, false);
    assert.equal(ui.button.textContent, 'Quiero recibir el aviso');
    assert.equal(ui.attributes.has('aria-busy'), false);
    assert.equal(ui.status.focused, true);
    assert.equal(ui.form.values.email, 'persona@example.com');
    assert.doesNotMatch(ui.status.textContent, /Correo registrado/);
    await ui.submit();
    assert.equal(ui.calls.filter(call => call.url.endsWith('/api/waitlist')).length, 2);
  }
});

test('repeated clicks while pending cannot submit twice', async () => {
  let resolve;
  const ui = setup(() => new Promise(done => { resolve = done; }));
  const first = ui.submit();
  await ui.submit();
  assert.equal(ui.calls.filter(call => call.url.endsWith('/api/waitlist')).length, 1);
  assert.equal(ui.attributes.get('aria-busy'), 'true');
  resolve({ status: 503, ok: false, url: 'https://100diaselmetodo.com/api/waitlist' });
  await first;
  assert.equal(ui.button.disabled, false);
});

test('campaign fields are populated and analytics never receives form values', async () => {
  const ui = setup(async () => ({ status: 503, ok: false, url: 'https://100diaselmetodo.com/api/waitlist' }));
  await ui.submit();
  assert.deepEqual(ui.fields.map(field => field.value), ['instagram', 'reel', 'serie02']);
  const events = ui.calls.filter(call => call.url === '/api/events');
  assert.equal(events.length, 1);
  assert.doesNotMatch(events[0].options.body, /persona@example\.com|Persona/);
  assert.equal(JSON.parse(events[0].options.body).name, 'page_view');
});

test('pages without a form still initialize analytics', () => {
  assert.doesNotThrow(() => vm.runInNewContext(script, {
    URL, URLSearchParams,
    location: { search: '', pathname: '/' },
    document: { referrer: '', querySelector: () => null, querySelectorAll: () => [] },
    fetch: async () => ({ status: 204 }),
  }));
});
