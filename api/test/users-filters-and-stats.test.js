// Functional tests for GET /api/users filtering/pagination and GET /api/stats,
// run against the running API (default http://localhost:3001, override with API_URL).
// Start the API with .skyramp/sut/setup.sh; the "fresh server" cases expect the seed data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const BASE = process.env.API_URL || 'http://localhost:3001';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(3000),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }
  return { status: res.status, body: json };
}

const get = path => request('GET', path);
const ids = res => res.body.data.map(u => u.id);
const stats = async () => (await get('/api/stats')).body.data;

async function createUser(body) {
  const res = await request('POST', '/api/users', body);
  assert.equal(res.status, 201);
  return res.body;
}

// --- R5 ---------------------------------------------------------------------

test('R5: api/server.js parses', () => {
  const src = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.doesNotThrow(() => new vm.Script(src, { filename: 'api/server.js' }));
});

// --- R1: filtering (fresh server) -----------------------------------------------

test('R1a: no filter params returns all seeded users', async () => {
  const res = await get('/api/users');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [1, 2, 3]);
  assert.equal(res.body.total, 3);
  assert.equal(res.body.page, 1);
  assert.equal(res.body.limit, 10);
});

test('R1b: search matches firstName/lastName case-insensitively', async () => {
  for (const q of ['JOHN', 'john']) {
    const res = await get(`/api/users?search=${q}`);
    assert.equal(res.status, 200);
    assert.deepEqual(ids(res), [1, 3], `search=${q}`);
    assert.equal(res.body.total, 2, `search=${q}`);
  }
});

test('R1c: search matches lastName only', async () => {
  const res = await get('/api/users?search=sMiTh');
  assert.deepEqual(ids(res), [2]);
  assert.equal(res.body.total, 1);
});

test('R1d: search matches email case-insensitively', async () => {
  const jane = await get('/api/users?search=JANE@EXAMPLE');
  assert.deepEqual(ids(jane), [2]);
  const all = await get('/api/users?search=example.com');
  assert.deepEqual(ids(all), [1, 2, 3]);
  assert.equal(all.body.total, 3);
});

test('R1e: search with no match returns an empty list', async () => {
  const res = await get('/api/users?search=zzznomatch');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, []);
  assert.equal(res.body.total, 0);
});

test('R1f: role filter is an exact, case-sensitive match', async () => {
  const user = await get('/api/users?role=user');
  assert.deepEqual(ids(user), [2, 3]);
  assert.equal(user.body.total, 2);
  const admin = await get('/api/users?role=admin');
  assert.deepEqual(ids(admin), [1]);
  assert.equal(admin.body.total, 1);
  const upper = await get('/api/users?role=ADMIN');
  assert.deepEqual(ids(upper), []);
  assert.equal(upper.body.total, 0);
});

test('R1g: status filter is an exact match', async () => {
  const active = await get('/api/users?status=active');
  assert.deepEqual(ids(active), [1, 2]);
  assert.equal(active.body.total, 2);
  const inactive = await get('/api/users?status=inactive');
  assert.deepEqual(ids(inactive), [3]);
  assert.equal(inactive.body.total, 1);
  const partial = await get('/api/users?status=act');
  assert.deepEqual(ids(partial), []);
  assert.equal(partial.body.total, 0);
});

test('R1h: filters combine with AND', async () => {
  const jane = await get('/api/users?search=j&role=user&status=active');
  assert.deepEqual(ids(jane), [2]);
  assert.equal(jane.body.total, 1);
  const bob = await get('/api/users?search=john&status=inactive');
  assert.deepEqual(ids(bob), [3]);
  assert.equal(bob.body.total, 1);
});

test('R1i: empty filter values do not filter', async () => {
  const res = await get('/api/users?search=&role=&status=');
  assert.deepEqual(ids(res), [1, 2, 3]);
  assert.equal(res.body.total, 3);
});

test('R1j: total is the filtered count, not the page size or list size', async () => {
  const res = await get('/api/users?role=user&limit=1');
  assert.deepEqual(ids(res), [2]);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.limit, 1);
});

// --- R2: pagination and response shape ------------------------------------------

test('R2a: default page/limit and response keys', async () => {
  const res = await get('/api/users');
  assert.deepEqual(Object.keys(res.body).sort(), ['data', 'limit', 'page', 'total']);
  assert.equal(res.body.page, 1);
  assert.equal(res.body.limit, 10);
});

test('R2b: explicit page slices the list', async () => {
  const p1 = await get('/api/users?page=1&limit=2');
  assert.deepEqual(ids(p1), [1, 2]);
  assert.equal(p1.body.total, 3);
  assert.equal(p1.body.page, 1);
  assert.equal(p1.body.limit, 2);
  const p2 = await get('/api/users?page=2&limit=2');
  assert.deepEqual(ids(p2), [3]);
  assert.equal(p2.body.total, 3);
  assert.equal(p2.body.page, 2);
  assert.equal(p2.body.limit, 2);
});

test('R2c: page beyond the end returns an empty page', async () => {
  const res = await get('/api/users?page=5&limit=2');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, []);
  assert.equal(res.body.total, 3);
});

test('R2d: pagination applies after filtering', async () => {
  const res = await get('/api/users?status=active&page=2&limit=1');
  assert.deepEqual(ids(res), [2]);
  assert.equal(res.body.total, 2);
});

// --- R3: stats ------------------------------------------------------------

test('R3a: seed data stats', async () => {
  assert.deepEqual(await stats(), { totalUsers: 3, activeUsers: 2, totalPosts: 2, totalComments: 2 });
});

test('R3e: activeUsers agrees with ?status=active total on fresh state', async () => {
  const list = await get('/api/users?status=active&limit=100');
  assert.equal((await stats()).activeUsers, list.body.total);
});

// --- R4e / F2: malformed search query (no stored data involved) -----------------------

test('R4e: repeated search param does not crash the endpoint (F2)', async () => {
  const res = await get('/api/users?search=john&search=jane');
  assert.ok(res.status < 500, `got ${res.status}`);
});

test('repeated-search-param-no-5xx: bracketed search param does not crash the endpoint (F2)', async () => {
  const res = await get('/api/users?search%5Ba%5D=b');
  assert.ok(res.status < 500, `got ${res.status}`);
});

// --- R3: stats follow writes ----------------------------------------------------

test('R3b: activeUsers and totalUsers follow creation', async () => {
  const before = await stats();
  const user = await createUser({ firstName: 'Ann', lastName: 'Lee', email: 'ann@example.com', role: 'user' });
  try {
    const after = await stats();
    assert.equal(after.activeUsers, before.activeUsers + 1);
    assert.equal(after.totalUsers, before.totalUsers + 1);
  } finally {
    await request('DELETE', `/api/users/${user.id}`);
  }
});

test('R3c: activeUsers counts only exact "active" status', async () => {
  const base = (await stats()).activeUsers;
  try {
    for (const status of ['inactive', 'Active', 'deactivated']) {
      assert.equal((await request('PATCH', '/api/users/2', { status })).status, 200);
      assert.equal((await stats()).activeUsers, base - 1, `status=${status}`);
    }
    await request('PATCH', '/api/users/2', { status: 'active' });
    assert.equal((await stats()).activeUsers, base);
  } finally {
    await request('PATCH', '/api/users/2', { status: 'active' });
  }
});

test('R3d: activeUsers follows deletion', async () => {
  const active = await createUser({ firstName: 'Del', lastName: 'Active', email: 'da@example.com', role: 'user' });
  const inactive = await createUser({ firstName: 'Del', lastName: 'Inactive', email: 'di@example.com', role: 'user' });
  await request('PATCH', `/api/users/${inactive.id}`, { status: 'inactive' });
  const base = await stats();

  assert.equal((await request('DELETE', `/api/users/${active.id}`)).status, 204);
  const afterActive = await stats();
  assert.equal(afterActive.activeUsers, base.activeUsers - 1);
  assert.equal(afterActive.totalUsers, base.totalUsers - 1);

  assert.equal((await request('DELETE', `/api/users/${inactive.id}`)).status, 204);
  const afterInactive = await stats();
  assert.equal(afterInactive.activeUsers, base.activeUsers - 1);
  assert.equal(afterInactive.totalUsers, base.totalUsers - 2);
});

test('stats-active-matches-status-filter: user with status "ACTIVE" is counted by neither', async () => {
  try {
    await request('PATCH', '/api/users/1', { status: 'ACTIVE' });
    const list = await get('/api/users?status=active&limit=100');
    assert.ok(!ids(list).includes(1));
    assert.equal((await stats()).activeUsers, list.body.total);
  } finally {
    await request('PATCH', '/api/users/1', { status: 'active' });
  }
  const list = await get('/api/users?status=active&limit=100');
  assert.equal((await stats()).activeUsers, list.body.total);
});

// --- R4: list filters reflect writes ------------------------------------------------

test('R4a: created user is found by search, role and status filters', async () => {
  const user = await createUser({ firstName: 'Zed', lastName: 'Quill', email: 'zq@example.com', role: 'editor' });
  try {
    assert.ok(ids(await get('/api/users?search=ZED')).includes(user.id), 'search=ZED');
    assert.ok(ids(await get('/api/users?role=editor')).includes(user.id), 'role=editor');
    assert.ok(ids(await get('/api/users?status=active&limit=100')).includes(user.id), 'status=active');
  } finally {
    await request('DELETE', `/api/users/${user.id}`);
  }
});

test('R4b: updated fields are reflected in filters', async () => {
  const user = await createUser({ firstName: 'Upd', lastName: 'Before', email: 'upd@example.com', role: 'user' });
  try {
    await request('PATCH', `/api/users/${user.id}`, { role: 'admin' });
    assert.ok(ids(await get('/api/users?role=admin')).includes(user.id), 'role=admin after PATCH');
    await request('PUT', `/api/users/${user.id}`, { firstName: 'Upd', lastName: 'Newname', email: 'upd@example.com', role: 'admin' });
    assert.ok(ids(await get('/api/users?search=newname')).includes(user.id), 'search=newname after PUT');
  } finally {
    await request('DELETE', `/api/users/${user.id}`);
  }
});

test('R4c: deleted user disappears from the filtered list', async () => {
  const user = await createUser({ firstName: 'Gone', lastName: 'Soon', email: 'gone@example.com', role: 'user' });
  assert.equal((await request('DELETE', `/api/users/${user.id}`)).status, 204);
  const res = await get('/api/users?search=gone');
  assert.equal(res.status, 200);
  assert.ok(!ids(res).includes(user.id));
});

test('R3e: activeUsers agrees with ?status=active total after mutations', async () => {
  const list = await get('/api/users?status=active&limit=100');
  assert.equal((await stats()).activeUsers, list.body.total);
});

// --- R4d / F1: stored user missing name fields -------------------------------------

test('R4d: search still works when a stored user has only an email (F1)', async () => {
  const user = await createUser({ email: 'x@example.com' });
  try {
    const res = await get('/api/users?search=anything');
    assert.equal(res.status, 200);
  } finally {
    await request('DELETE', `/api/users/${user.id}`);
  }
});

test('search-after-incomplete-user-no-5xx: John Doe still found when a user lacks firstName (F1)', async () => {
  const user = await createUser({ email: 'nofirst@example.com' });
  try {
    const res = await get('/api/users?search=john');
    assert.equal(res.status, 200);
    assert.ok(ids(res).includes(1));
  } finally {
    await request('DELETE', `/api/users/${user.id}`);
  }
});
