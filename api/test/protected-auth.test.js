// Contract tests for the requireAuth middleware guarding GET /api/protected.
// Run against the running API: `npm test` (API_URL defaults to http://localhost:3001).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const UNAUTHORIZED = { error: 'Authentication required' };

function getProtected(headers = {}, method = 'GET') {
  return fetch(`${API_URL}/api/protected`, { method, headers });
}

function assertSuccessBody(body) {
  assert.equal(body.message, 'Protected data');
  assert.equal(body.user, 'authenticated');
  assert.equal(typeof body.timestamp, 'number');
}

async function assertUnauthorized(headers) {
  const res = await getProtected(headers);
  assert.equal(res.status, 401, `expected 401 for ${JSON.stringify(headers)}`);
  assert.deepEqual(await res.json(), UNAUTHORIZED);
}

test('R1a: Authorization Bearer token is accepted', async () => {
  const res = await getProtected({ Authorization: 'Bearer abc123' });
  assert.equal(res.status, 200);
  assertSuccessBody(await res.json());
});

test('R1b: Authorization Basic credentials are accepted', async () => {
  const res = await getProtected({ Authorization: 'Basic dXNlcjpwYXNz' });
  assert.equal(res.status, 200);
  assertSuccessBody(await res.json());
});

test('R1c: x-api-key without Authorization is accepted', async () => {
  const res = await getProtected({ 'x-api-key': 'key-123' });
  assert.equal(res.status, 200);
  assertSuccessBody(await res.json());
});

test('R1d: no credentials gets 401', async () => {
  await assertUnauthorized({});
});

test('R1e: other Authorization schemes get 401', async () => {
  for (const auth of ['Token abc', 'Digest abc', 'abc']) {
    await assertUnauthorized({ Authorization: auth });
  }
});

test('R1f: scheme names are case-sensitive', async () => {
  for (const auth of ['bearer abc', 'BASIC abc']) {
    await assertUnauthorized({ Authorization: auth });
  }
});

test('R1g: scheme without space and token gets 401', async () => {
  for (const auth of ['Bearer', 'Bearerabc']) {
    await assertUnauthorized({ Authorization: auth });
  }
});

test('R1h: empty x-api-key gets 401', async () => {
  await assertUnauthorized({ 'x-api-key': '' });
});

test('R1i: unsupported scheme falls back to a valid x-api-key', async () => {
  const res = await getProtected({ Authorization: 'Token abc', 'x-api-key': 'key-123' });
  assert.equal(res.status, 200);
  assertSuccessBody(await res.json());
});

test('R1j: a 401 is sent once without running the route handler', async () => {
  const res = await getProtected({});
  assert.equal(res.status, 401);
  const text = await res.text();
  assert.ok(!text.includes('Protected data'));
  assert.deepEqual(Object.keys(JSON.parse(text)), ['error']);

  const next = await getProtected({ Authorization: 'Bearer abc123' });
  assert.equal(next.status, 200);
  assertSuccessBody(await next.json());
});

test('bearer-token-and-api-key-both: Bearer with x-api-key is accepted', async () => {
  const res = await getProtected({ Authorization: 'Bearer abc', 'x-api-key': 'k' });
  assert.equal(res.status, 200);
  assertSuccessBody(await res.json());
});

test('R2a: success body shape and content type', async () => {
  const res = await getProtected({ Authorization: 'Bearer t' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json/);
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ['message', 'timestamp', 'user']);
  assertSuccessBody(body);
  assert.ok(Number.isInteger(body.timestamp));
  assert.ok(Math.abs(body.timestamp - Date.now()) < 60000);
});

test('R2b: 401 body shape and content type', async () => {
  const res = await getProtected({});
  assert.equal(res.status, 401);
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await res.json(), UNAUTHORIZED);
});

test('R3a: GET /api/users answers without credentials', async () => {
  const res = await fetch(`${API_URL}/api/users`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
});

test('R3a: GET /api/error/404 answers without credentials', async () => {
  const res = await fetch(`${API_URL}/api/error/404`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Simulated 404 error', code: 404 });
});

test('R3b: HEAD /api/protected follows the same auth rule', async () => {
  const denied = await getProtected({}, 'HEAD');
  assert.equal(denied.status, 401);
  assert.equal(await denied.text(), '');

  const allowed = await getProtected({ Authorization: 'Bearer t' }, 'HEAD');
  assert.equal(allowed.status, 200);
  assert.equal(await allowed.text(), '');
});

test('R3c: CORS preflight to /api/protected needs no credentials', async () => {
  const res = await getProtected({
    Origin: 'http://localhost:5173',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization',
  }, 'OPTIONS');
  assert.ok(res.status >= 200 && res.status < 300, `status ${res.status}`);
  assert.ok(res.headers.get('access-control-allow-origin'));
});
