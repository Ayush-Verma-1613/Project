/**
 * API tests using the built-in node:test runner (no extra dependencies).
 * Run with: npm test --prefix server
 */
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { store } from './store/index.js';

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

// Re-seed before every test so cases stay independent.
beforeEach(() => store.init());

async function call(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body };
}

test('GET /health reports the active persistence driver', async () => {
  const { status, body } = await call('/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.persistence, 'memory');
});

test('GET /appointments returns the seed data sorted by date', async () => {
  const { status, body } = await call('/appointments');
  assert.equal(status, 200);
  assert.equal(body.count, 3);
  assert.deepEqual(
    body.data.map((a) => a.customerName),
    ['Alex Morgan', 'Jamie Lee', 'Taylor Smith'],
  );
});

test('POST /appointments creates an appointment', async () => {
  const { status, body } = await call('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'Priya Nair',
      service: 'Consultation',
      dateTime: '2026-11-04T09:15',
      status: 'Pending',
    }),
  });

  assert.equal(status, 201);
  assert.equal(body.data.customerName, 'Priya Nair');
  assert.ok(body.data.id);
  assert.ok(body.data.createdAt);
});

test('POST /appointments rejects an empty body with one error per field', async () => {
  const { status, body } = await call('/appointments', { method: 'POST', body: '{}' });

  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), [
    'customerName',
    'dateTime',
    'service',
    'status',
  ]);
});

test('POST /appointments rejects an unknown status', async () => {
  const { status, body } = await call('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'Sam Doe',
      service: 'Review',
      dateTime: '2026-11-04T09:15',
      status: 'Done',
    }),
  });

  assert.equal(status, 400);
  assert.match(body.errors.status, /Pending, Confirmed, Cancelled/);
});

test('POST /appointments rejects an unparseable date', async () => {
  const { body, status } = await call('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'Sam Doe',
      service: 'Review',
      dateTime: 'not-a-date',
      status: 'Pending',
    }),
  });

  assert.equal(status, 400);
  assert.match(body.errors.dateTime, /valid date/);
});

test('PATCH /:id/status changes the status and advances updatedAt', async () => {
  const list = await call('/appointments');
  const target = list.body.data[0];

  const { status, body } = await call(`/appointments/${target.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Confirmed' }),
  });

  assert.equal(status, 200);
  assert.equal(body.data.status, 'Confirmed');
  assert.ok(new Date(body.data.updatedAt) >= new Date(target.updatedAt));
});

test('PATCH /:id/status rejects an invalid status', async () => {
  const list = await call('/appointments');
  const { status } = await call(`/appointments/${list.body.data[0].id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Archived' }),
  });

  assert.equal(status, 400);
});

test('PATCH /:id/status returns 404 for an unknown id', async () => {
  const { status } = await call('/appointments/does-not-exist/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Confirmed' }),
  });

  assert.equal(status, 404);
});

test('GET /appointments?status filters by status', async () => {
  const { body } = await call('/appointments?status=Confirmed');
  assert.deepEqual(
    body.data.map((a) => a.customerName),
    ['Jamie Lee'],
  );
});

test('GET /appointments?status rejects an unknown filter', async () => {
  const { status } = await call('/appointments?status=Nope');
  assert.equal(status, 400);
});

test('GET /appointments?search matches customer names case-insensitively', async () => {
  const { body } = await call('/appointments?search=JAM');
  assert.deepEqual(
    body.data.map((a) => a.customerName),
    ['Jamie Lee'],
  );
});

test('GET /appointments combines search and status', async () => {
  const { body } = await call('/appointments?search=a&status=Pending');
  assert.deepEqual(
    body.data.map((a) => a.customerName),
    ['Alex Morgan'],
  );
});

test('DELETE /:id removes an appointment once', async () => {
  const list = await call('/appointments');
  const id = list.body.data[0].id;

  assert.equal((await call(`/appointments/${id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await call(`/appointments/${id}`, { method: 'DELETE' })).status, 404);
});

test('unknown routes return a 404 with a message', async () => {
  const { status, body } = await call('/nothing');
  assert.equal(status, 404);
  assert.match(body.message, /Route not found/);
});
