import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteUser, getUser, listUsers, request } from './users-client.js';

test('delete-returns-204-empty: DELETE responds 204 with an empty body', async () => {
  const created = await request('POST', '/api/users', {
    firstName: 'Del',
    lastName: 'Me',
    email: 'del@example.com',
    role: 'user',
  });
  const res = await deleteUser(created.json.id);
  assert.equal(res.status, 204);
  assert.equal(res.text, '');
});

test('delete-then-list-hidden-then-status-deleted: hidden by default, listed under status=deleted, retrievable by id', async () => {
  const created = await request('POST', '/api/users', {
    firstName: 'Del',
    lastName: 'Me',
    email: 'del@example.com',
    role: 'user',
  });
  const { id } = created.json;
  await deleteUser(id);

  const byDefault = await listUsers();
  assert.ok(!byDefault.data.some((u) => u.id === id));

  const deleted = await listUsers('status=deleted');
  assert.ok(deleted.data.some((u) => u.id === id));

  const res = await getUser(id);
  assert.equal(res.status, 200);
  assert.equal(res.json.status, 'deleted');
});
