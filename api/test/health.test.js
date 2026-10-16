import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL ?? 'http://localhost:3001';
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = (path, init) => fetch(`${BASE_URL}${path}`, init);

async function getHealth(path = '/api/health') {
  const res = await request(path);
  assert.equal(res.status, 200);
  return res.json();
}

// R1: GET /api/health

test('R1a: GET /api/health with no headers responds 200 as JSON', async () => {
  const res = await request('/api/health');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
});

test('R1b: body.status is "ok"', async () => {
  const body = await getHealth();
  assert.equal(body.status, 'ok');
});

test('R1c: uptime is a non-negative integer number of seconds', async () => {
  const body = await getHealth();
  assert.equal(typeof body.uptime, 'number');
  assert.ok(Number.isInteger(body.uptime), `uptime ${body.uptime} is not an integer`);
  assert.ok(body.uptime >= 0, `uptime ${body.uptime} is negative`);
});

test('R1d: uptime grows with wall-clock time', async () => {
  const t1 = Date.now();
  const { uptime: uptime1 } = await getHealth();
  await sleep(2100);
  const t2 = Date.now();
  const { uptime: uptime2 } = await getHealth();

  const elapsed = (t2 - t1) / 1000;
  const delta = uptime2 - uptime1;
  assert.ok(uptime2 >= uptime1, `uptime went backwards: ${uptime1} -> ${uptime2}`);
  assert.ok(delta >= Math.floor(elapsed) - 1, `uptime grew ${delta}s over ${elapsed}s`);
  assert.ok(delta <= Math.ceil(elapsed) + 1, `uptime grew ${delta}s over ${elapsed}s`);
});

test('health-uptime-monotonic-repeated: uptime never goes backwards over 5 calls', async () => {
  const uptimes = [];
  for (let i = 0; i < 5; i++) {
    if (i > 0) await sleep(1100);
    uptimes.push((await getHealth()).uptime);
  }
  for (let i = 1; i < uptimes.length; i++) {
    assert.ok(uptimes[i] >= uptimes[i - 1], `uptime went backwards: ${uptimes.join(', ')}`);
  }
  const growth = uptimes.at(-1) - uptimes[0];
  assert.ok(growth >= 3 && growth <= 6, `uptime grew ${growth}s: ${uptimes.join(', ')}`);
});

test('R1e: timestamp is the current time as an ISO 8601 UTC string', async () => {
  const first = await getHealth();
  assert.match(first.timestamp, ISO_UTC);
  const parsed = Date.parse(first.timestamp);
  assert.ok(!Number.isNaN(parsed), `timestamp ${first.timestamp} does not parse`);
  assert.ok(Math.abs(parsed - Date.now()) <= 60_000, `timestamp ${first.timestamp} is not current`);

  await sleep(1100);
  const second = await getHealth();
  assert.ok(Date.parse(second.timestamp) > parsed, `${second.timestamp} is not later than ${first.timestamp}`);
});

test('R1f: body has exactly status, timestamp and uptime', async () => {
  const body = await getHealth();
  assert.deepEqual(Object.keys(body).sort(), ['status', 'timestamp', 'uptime']);
});

test('R1g: no auth needed and app-wide CORS headers are sent', async () => {
  const res = await request('/api/health', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('R1h: HEAD /api/health returns 200 with no body', async () => {
  const res = await request('/api/health', { method: 'HEAD' });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '');
});

test('R1i: unrelated query string does not change the response', async () => {
  const body = await getHealth('/api/health?verbose=1&foo=bar');
  assert.equal(body.status, 'ok');
  assert.ok(Number.isInteger(body.uptime) && body.uptime >= 0);
  assert.match(body.timestamp, ISO_UTC);
  assert.deepEqual(Object.keys(body).sort(), ['status', 'timestamp', 'uptime']);
});

test('R1j: POST /api/health is not routed', async () => {
  const res = await request('/api/health', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 404);
});

test('R1j: DELETE /api/health is not routed', async () => {
  const res = await request('/api/health', { method: 'DELETE' });
  assert.equal(res.status, 404);
});

// R2: neighbouring routes and middleware are unchanged

test('R2a: GET /api/users still lists the seeded users', async () => {
  const res = await request('/api/users');
  assert.equal(res.status, 200);
  const body = await res.json();
  const john = body.data.find((u) => u.id === 1);
  assert.equal(john?.email, 'john@example.com');
});

test('R2b: JSON body parsing still applies to POST /api/users', async () => {
  const res = await request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'Health', lastName: 'Check', email: 'hc@example.com' }),
  });
  assert.ok(res.status >= 200 && res.status < 300, `status ${res.status}`);
  const created = await res.json();
  assert.equal(created.firstName, 'Health');

  const fetched = await request(`/api/users/${created.id}`);
  assert.equal(fetched.status, 200);
  assert.deepEqual(await fetched.json(), created);
});

test('R2c: GET /api/protected without auth still returns 401', async () => {
  const res = await request('/api/protected');
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'Authentication required' });
});

test('R2d: GET /api/healthz is not matched by the health route', async () => {
  const res = await request('/api/healthz');
  assert.equal(res.status, 404);
});

test('R2d: GET /api/health/extra is not matched by the health route', async () => {
  const res = await request('/api/health/extra');
  assert.equal(res.status, 404);
});
