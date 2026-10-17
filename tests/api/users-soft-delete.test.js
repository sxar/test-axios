import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createUser,
  deleteUser,
  getStats,
  getUser,
  listUsers,
  request,
} from './users-client.js';

const MISSING_ID = 999999;

const ids = (list) => list.data.map((u) => u.id);

describe('DELETE /api/users/:id', () => {
  test('R1a: returns 204 with an empty body', async () => {
    const user = await createUser();
    const res = await deleteUser(user.id);
    assert.equal(res.status, 204);
    assert.equal(res.text, '');
  });

  test('R1b: keeps the record and marks it deleted', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const res = await getUser(user.id);
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'deleted');
  });

  test('R1c: preserves the other fields of the user', async () => {
    const user = await createUser({ firstName: 'Keep', lastName: 'Fields', role: 'admin' });
    await deleteUser(user.id);
    const { json: after } = await getUser(user.id);
    const { status: _before, ...expected } = user;
    const { status: _after, ...actual } = after;
    assert.deepEqual(actual, expected);
  });

  test('R1d: returns 404 for an unknown id and changes nothing', async () => {
    const statsBefore = await getStats();
    const listBefore = await listUsers();
    const res = await deleteUser(MISSING_ID);
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { error: 'User not found' });
    assert.deepEqual(await getStats(), statsBefore);
    assert.deepEqual(await listUsers(), listBefore);
  });

  test('R1e: deleting an already-deleted user responds 204 or 404', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const res = await deleteUser(user.id);
    assert.ok([204, 404].includes(res.status), `got ${res.status}`);
  });

  test('R1e: deleting an already-deleted user leaves it deleted and counted once', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const statsBefore = await getStats();
    const res = await deleteUser(user.id);
    assert.ok(res.status < 500, `got ${res.status}`);
    assert.equal((await getUser(user.id)).json.status, 'deleted');
    assert.equal((await getStats()).totalUsers, statsBefore.totalUsers);
  });
});

describe('GET /api/users', () => {
  test('R2a: default list hides deleted users and excludes them from total', async () => {
    const user = await createUser();
    const before = await listUsers();
    assert.ok(ids(before).includes(user.id));
    await deleteUser(user.id);
    const after = await listUsers();
    assert.ok(!ids(after).includes(user.id));
    assert.equal(after.total, before.total - 1);
  });

  test('R2b: ?status=deleted lists deleted users only', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const list = await listUsers('status=deleted');
    assert.ok(ids(list).includes(user.id));
    assert.ok(list.data.every((u) => u.status === 'deleted'));
  });

  test('R2c: ?status=active and ?status=inactive never include deleted users', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    for (const status of ['active', 'inactive']) {
      const list = await listUsers(`status=${status}`);
      assert.ok(!ids(list).includes(user.id), `deleted user listed under ${status}`);
      assert.ok(list.data.every((u) => u.status === status));
    }
  });

  test('R2d: search without status hides deleted users', async () => {
    const unique = `soft-search-${Date.now()}`;
    const user = await createUser({ email: `${unique}@example.com` });
    await deleteUser(user.id);
    const hidden = await listUsers(`search=${unique}`);
    assert.deepEqual(hidden.data, []);
    assert.equal(hidden.total, 0);
    const shown = await listUsers(`search=${unique}&status=deleted`);
    assert.deepEqual(ids(shown), [user.id]);
  });

  test('R2d: role filter without status hides deleted users', async () => {
    const user = await createUser({ role: 'auditor' });
    await deleteUser(user.id);
    const list = await listUsers('role=auditor');
    assert.ok(!ids(list).includes(user.id));
  });

  test('R2e: pagination and total are computed after hiding deleted users', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const first = (await request('GET', '/api/users?limit=1&page=1')).json;
    const seen = [];
    for (let page = 1; page <= first.total; page++) {
      const { json } = await request('GET', `/api/users?limit=1&page=${page}`);
      assert.equal(json.data.length, 1, `page ${page} is empty`);
      seen.push(...json.data);
    }
    assert.ok(seen.every((u) => u.status !== 'deleted'));
    assert.ok(!seen.some((u) => u.id === user.id));
    assert.equal(first.total, (await getStats()).totalUsers);
  });

  test('R2f: active and inactive users are still listed by default', async () => {
    const list = await listUsers();
    const statuses = new Set(list.data.map((u) => u.status));
    assert.ok(statuses.has('active'));
    assert.ok(statuses.has('inactive'));
    assert.equal(list.data.find((u) => u.id === 3)?.status, 'inactive');
  });
});

describe('GET /api/users/:id', () => {
  test('R3a: returns a deleted user', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const res = await getUser(user.id);
    assert.equal(res.status, 200);
    assert.equal(res.json.id, user.id);
    assert.equal(res.json.status, 'deleted');
  });

  test('R3b: returns 404 for an id that never existed', async () => {
    const res = await getUser(MISSING_ID);
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { error: 'User not found' });
  });
});

describe('GET /api/stats', () => {
  test('R4a: deleting a user decrements totalUsers by one', async () => {
    const user = await createUser();
    const before = await getStats();
    await deleteUser(user.id);
    assert.equal((await getStats()).totalUsers, before.totalUsers - 1);
  });

  test('R4b: totalUsers equals the default list total', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const stats = await getStats();
    const list = await listUsers();
    assert.equal(stats.totalUsers, list.total);
  });

  test('R4c: activeUsers no longer counts a deleted active user', async () => {
    const user = await createUser();
    const before = await getStats();
    await deleteUser(user.id);
    assert.equal((await getStats()).activeUsers, before.activeUsers - 1);
  });

  test('R4d: creating a user increments totalUsers', async () => {
    const before = await getStats();
    await createUser();
    assert.equal((await getStats()).totalUsers, before.totalUsers + 1);
  });
});

describe('restoring and creating users', () => {
  test('R5a: PATCH {status: "active"} restores a deleted user', async () => {
    const user = await createUser();
    const before = await getStats();
    await deleteUser(user.id);
    const res = await request('PATCH', `/api/users/${user.id}`, { status: 'active' });
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'active');
    assert.ok(ids(await listUsers()).includes(user.id));
    assert.equal((await getStats()).totalUsers, before.totalUsers);
  });

  test('R5b: PUT without a status keeps a deleted user deleted', async () => {
    const user = await createUser();
    await deleteUser(user.id);
    const res = await request('PUT', `/api/users/${user.id}`, { firstName: 'X' });
    assert.ok(res.status < 500, `got ${res.status}`);
    assert.equal((await getUser(user.id)).json.status, 'deleted');
    assert.ok(!ids(await listUsers()).includes(user.id));
  });

  test('R5c: POST creates an active user listed by default', async () => {
    const res = await request('POST', '/api/users', {
      firstName: 'New',
      lastName: 'Person',
      email: `new-${Date.now()}@example.com`,
      role: 'user',
    });
    assert.equal(res.status, 201);
    assert.equal(res.json.status, 'active');
    assert.ok(ids(await listUsers()).includes(res.json.id));
  });
});
