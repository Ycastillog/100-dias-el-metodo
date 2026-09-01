import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAnalyticsEvent, handleWaitlistSignup } from './waitlist.mjs';

function fakeDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return { bind(...values) { return { async run() { calls.push({ sql, values }); return { success: true }; } }; } };
    },
  };
}

const formRequest = body => new Request('https://100diaselmetodo.com/api/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(body),
});

test('valid consented lead is stored and redirected', async () => {
  const DB = fakeDb();
  const response = await handleWaitlistSignup(formRequest({ email: ' Persona@Example.com ', name: 'Persona', interest: 'ambos', consent: 'yes' }), { DB }, new Headers());
  assert.equal(response.status, 303);
  assert.equal(new URL(response.headers.get('location')).pathname, '/gracias.html');
  assert.equal(DB.calls.length, 1);
  assert.equal(DB.calls[0].values[0], 'persona@example.com');
});

test('invalid email or missing consent is rejected without storage', async () => {
  for (const body of [{ email: 'no-es-correo', consent: 'yes' }, { email: 'persona@example.com' }]) {
    const DB = fakeDb();
    const response = await handleWaitlistSignup(formRequest(body), { DB }, new Headers());
    assert.equal(response.status, 400);
    assert.equal(DB.calls.length, 0);
  }
});

test('honeypot submissions do not reach storage', async () => {
  const DB = fakeDb();
  const response = await handleWaitlistSignup(formRequest({ email: 'bot@example.com', consent: 'yes', website: 'https://spam.example' }), { DB }, new Headers());
  assert.equal(response.status, 303);
  assert.equal(DB.calls.length, 0);
});

test('analytics accepts only the reviewed anonymous event names', async () => {
  const DB = fakeDb();
  const valid = await handleAnalyticsEvent(new Request('https://100diaselmetodo.com/api/events', { method: 'POST', body: JSON.stringify({ name: 'page_view', path: '/', source: 'instagram' }) }), { DB }, new Headers());
  assert.equal(valid.status, 204);
  assert.equal(DB.calls.length, 1);
  const invalid = await handleAnalyticsEvent(new Request('https://100diaselmetodo.com/api/events', { method: 'POST', body: JSON.stringify({ name: 'unknown' }) }), { DB }, new Headers());
  assert.equal(invalid.status, 400);
});

