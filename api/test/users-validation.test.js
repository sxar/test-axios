// Functional tests for user payload validation on POST/PUT /api/users (PR #9).
// Run against the running API: `npm run test:api` (API_BASE_URL defaults to http://localhost:3001).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const REQUIRED = ['firstName', 'lastName', 'email'];

let counter = 0;
function unique(prefix) {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`;
}

async function request(method, path, body) {
  const init = { method, headers: {}, signal: AbortSignal.timeout(5000) };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, init);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
}

function validPayload(overrides = {}) {
  const lastName = unique('Last');
  return { firstName: 'Alice', lastName, email: `${lastName.toLowerCase()}@example.com`, ...overrides };
}

async function createUser(overrides = {}) {
  const res = await request('POST', '/api/users', validPayload(overrides));
  assert.equal(res.status, 201, `setup POST failed: ${JSON.stringify(res.body)}`);
  return res.body;
}

async function totalUsers() {
  const res = await request('GET', '/api/users?limit=1000');
  return res.body.total;
}

function assertValidationFailed(res, expectedFields) {
  assert.equal(res.status, 400, `expected 400, got ${res.status}: ${JSON.stringify(res.body)}`);
  assert.equal(res.body.error, 'Validation failed');
  assert.deepEqual(Object.keys(res.body).sort(), ['error', 'fields']);
  assert.deepEqual([...res.body.fields].sort(), [...expectedFields].sort());
  assert.equal(new Set(res.body.fields).size, res.body.fields.length, 'fields has duplicates');
}

describe('R0 API starts', () => {
  test('GET /api/users answers', async () => {
    const res = await request('GET', '/api/users');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });
});

describe('R1 POST /api/users validation', () => {
  test('R1a/R6d: POST with all three valid fields creates the user', async () => {
    const payload = { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com' };
    const res = await request('POST', '/api/users', payload);
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.id, 'number');
    assert.equal(res.body.firstName, 'Alice');
    assert.equal(res.body.lastName, 'Johnson');
    assert.equal(res.body.email, 'alice@example.com');
    assert.equal(res.body.status, 'active');
    const got = await request('GET', `/api/users/${res.body.id}`);
    assert.equal(got.status, 200);
    assert.deepEqual(got.body, res.body);
  });

  for (const field of REQUIRED) {
    test(`R1b: POST missing ${field} returns 400 listing it`, async () => {
      const payload = validPayload();
      delete payload[field];
      assertValidationFailed(await request('POST', '/api/users', payload), [field]);
    });

    test(`R1c: POST with empty ${field} returns 400 listing it`, async () => {
      assertValidationFailed(await request('POST', '/api/users', validPayload({ [field]: '' })), [field]);
    });
  }

  for (const [field, value] of [['firstName', '   '], ['lastName', '\t'], ['email', '  ']]) {
    test(`R1d: POST with whitespace-only ${field} returns 400 listing it`, async () => {
      assertValidationFailed(await request('POST', '/api/users', validPayload({ [field]: value })), [field]);
    });
  }

  test('R1e: POST {} lists all three fields, email once', async () => {
    assertValidationFailed(await request('POST', '/api/users', {}), REQUIRED);
  });

  test('R1f: POST with null firstName is treated as missing', async () => {
    const res = await request('POST', '/api/users', { firstName: null, lastName: 'X', email: 'x@example.com' });
    assertValidationFailed(res, ['firstName']);
  });

  test('R1f: POST with all three null lists all three', async () => {
    const res = await request('POST', '/api/users', { firstName: null, lastName: null, email: null });
    assertValidationFailed(res, REQUIRED);
  });

  for (const [field, value] of [['firstName', 123], ['email', ['a@b.com']], ['lastName', {}]]) {
    test(`R1g: POST with non-string ${field} never 5xx and creates nothing`, async () => {
      const before = await totalUsers();
      const res = await request('POST', '/api/users', validPayload({ [field]: value }));
      assert.ok(res.status < 500, `got ${res.status}`);
      if (res.status === 400) {
        assert.deepEqual(res.body.fields, [field]);
        assert.equal(await totalUsers(), before);
      }
    });
  }

  test('R1h: rejected POST creates nothing', async () => {
    const before = await totalUsers();
    const lastName = unique('Rejected');
    const res = await request('POST', '/api/users', { firstName: '', lastName, email: 'r@example.com' });
    assert.equal(res.status, 400);
    assert.equal(await totalUsers(), before);
    const search = await request('GET', `/api/users?search=${lastName}`);
    assert.equal(search.body.total, 0);
  });

  test('R1h: rejected POST consumes no id', async () => {
    const before = await totalUsers();
    const a = await createUser();
    const bad = await request('POST', '/api/users', { lastName: 'X', email: 'not-an-email' });
    assert.equal(bad.status, 400);
    const b = await createUser();
    assert.equal(b.id, a.id + 1);
    assert.equal(await totalUsers(), before + 2);
  });

  test('R1i: POST with missing firstName and invalid email lists both', async () => {
    assertValidationFailed(await request('POST', '/api/users', { lastName: 'X', email: 'not-an-email' }), ['firstName', 'email']);
  });
});

describe('R2 PUT /api/users/:id validation', () => {
  test('R2a: PUT with all valid fields replaces them', async () => {
    const user = await createUser();
    const payload = { firstName: 'B', lastName: 'C', email: 'b.c@example.com' };
    const res = await request('PUT', `/api/users/${user.id}`, payload);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, user.id);
    assert.equal(res.body.firstName, 'B');
    assert.equal(res.body.lastName, 'C');
    assert.equal(res.body.email, 'b.c@example.com');
    const got = await request('GET', `/api/users/${user.id}`);
    assert.deepEqual(got.body, res.body);
  });

  for (const field of REQUIRED) {
    test(`R2b: PUT missing ${field} returns 400 listing it`, async () => {
      const user = await createUser();
      const payload = validPayload();
      delete payload[field];
      assertValidationFailed(await request('PUT', `/api/users/${user.id}`, payload), [field]);
    });

    test(`R2b: PUT with empty ${field} returns 400 listing it`, async () => {
      const user = await createUser();
      assertValidationFailed(await request('PUT', `/api/users/${user.id}`, validPayload({ [field]: '' })), [field]);
    });
  }

  test('R2c: rejected PUT leaves the user unchanged', async () => {
    const user = await createUser();
    const before = await request('GET', `/api/users/${user.id}`);
    const res = await request('PUT', `/api/users/${user.id}`, { firstName: 'Z', lastName: '', email: 'z@example.com' });
    assertValidationFailed(res, ['lastName']);
    const after = await request('GET', `/api/users/${user.id}`);
    assert.deepEqual(after.body, before.body);
  });

  test('R2d: PUT valid payload on non-existent id returns 404 and creates nothing', async () => {
    const res = await request('PUT', '/api/users/999999', validPayload());
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'User not found' });
    assert.equal((await request('GET', '/api/users/999999')).status, 404);
  });

  test('R2e: PUT {} on non-existent id is 400 or 404 and creates nothing', async () => {
    const res = await request('PUT', '/api/users/999999', {});
    assert.ok([400, 404].includes(res.status), `got ${res.status}`);
    assert.equal((await request('GET', '/api/users/999999')).status, 404);
  });

  test('R2f: PUT {} on existing user lists all three fields', async () => {
    const user = await createUser();
    assertValidationFailed(await request('PUT', `/api/users/${user.id}`, {}), REQUIRED);
  });
});

describe('R3 malformed email is rejected', () => {
  const malformed = [
    'plainaddress', 'a@@example.com', 'a@b@example.com', '@example.com', 'user@',
    'user name@example.com', 'user@exam ple.com', 'user..x@example.com', '.user@example.com',
    'user.@example.com', 'user@.example.com', 'user@example..com',
  ];
  for (const email of malformed) {
    test(`R3a: POST rejects ${JSON.stringify(email)}`, async () => {
      assertValidationFailed(await request('POST', '/api/users', validPayload({ email })), ['email']);
    });
  }

  for (const email of ['plainaddress', 'a@@example.com']) {
    test(`R3b: PUT rejects ${JSON.stringify(email)} and leaves user unchanged`, async () => {
      const user = await createUser();
      const res = await request('PUT', `/api/users/${user.id}`, validPayload({ email }));
      assertValidationFailed(res, ['email']);
      assert.deepEqual((await request('GET', `/api/users/${user.id}`)).body, user);
    });
  }
});

describe('R4 valid emails are accepted', () => {
  const common = [
    'john.doe@example.com', 'user+tag@example.co.uk', 'first_last@sub.example.org',
    'UPPER@EXAMPLE.COM', 'a1-b2@my-domain.io', 'x@example.museum',
  ];
  for (const email of common) {
    test(`R4a: POST accepts ${email}`, async () => {
      const res = await request('POST', '/api/users', validPayload({ email }));
      assert.equal(res.status, 201, JSON.stringify(res.body));
    });
  }

  // Defect F1: valid RFC 5322 local-part characters.
  const rfcLocal = [
    "o'brien@example.com", 'user!x@example.com', 'a=b@example.com', 'user%x@example.com',
    '{tag}@example.com', '-dash@example.com', 'user~x@example.com', '"john doe"@example.com',
  ];
  for (const email of rfcLocal) {
    test(`R4b (F1): POST accepts ${email} and the user is retrievable`, async () => {
      const res = await request('POST', '/api/users', validPayload({ email }));
      assert.equal(res.status, 201, JSON.stringify(res.body));
      assert.equal((await request('GET', `/api/users/${res.body.id}`)).body.email, email);
    });
  }

  // Defect F2: punycode TLDs.
  for (const email of ['user@example.xn--p1ai', 'user@xn--fsqu00a.xn--0zwm56d']) {
    test(`R4c (F2): POST accepts ${email}`, async () => {
      const res = await request('POST', '/api/users', validPayload({ email }));
      assert.equal(res.status, 201, JSON.stringify(res.body));
    });
  }

  for (const [label, email] of [
    ['F1', "o'brien@example.com"],
    ['valid', 'user+tag@example.co.uk'],
    ['F2', 'user@example.xn--p1ai'],
  ]) {
    test(`R4d (${label}): PUT accepts ${email}`, async () => {
      const user = await createUser();
      const res = await request('PUT', `/api/users/${user.id}`, validPayload({ email }));
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal((await request('GET', `/api/users/${user.id}`)).body.email, email);
    });
  }

  // Defect F3: domain literal.
  test('R4e (F3): POST accepts user@[192.168.0.1]', async () => {
    const res = await request('POST', '/api/users', { firstName: 'Ip', lastName: 'Lit', email: 'user@[192.168.0.1]' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
  });
});

describe('R5 PATCH /api/users/:id is unchanged', () => {
  test('R5a: PATCH one field keeps the rest', async () => {
    const user = await createUser();
    const res = await request('PATCH', `/api/users/${user.id}`, { firstName: 'Patched' });
    assert.equal(res.status, 200);
    const got = (await request('GET', `/api/users/${user.id}`)).body;
    assert.deepEqual(got, { ...user, firstName: 'Patched' });
  });

  test('R5b: PATCH {} changes nothing', async () => {
    const user = await createUser();
    const res = await request('PATCH', `/api/users/${user.id}`, {});
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, user);
  });

  test('R5c: PATCH with malformed email is accepted', async () => {
    const user = await createUser();
    const res = await request('PATCH', `/api/users/${user.id}`, { email: 'not-an-email' });
    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'not-an-email');
  });

  test('R5c: PATCH with empty lastName is accepted', async () => {
    const user = await createUser();
    const res = await request('PATCH', `/api/users/${user.id}`, { lastName: '' });
    assert.equal(res.status, 200);
    assert.equal(res.body.lastName, '');
  });

  test('R5d: PATCH on non-existent id returns 404', async () => {
    const res = await request('PATCH', '/api/users/999999', {});
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'User not found' });
  });
});

describe('R6 other user paths keep working', () => {
  test('R6a: POSTed user appears in search by lastName and email', async () => {
    const user = await createUser();
    const byName = await request('GET', `/api/users?search=${user.lastName}`);
    assert.equal(byName.body.total, 1);
    assert.equal(byName.body.data[0].id, user.id);
    const byEmail = await request('GET', `/api/users?search=${encodeURIComponent(user.email)}`);
    assert.equal(byEmail.body.total, 1);
    assert.equal(byEmail.body.data[0].id, user.id);
  });

  test('R6b: seed user 2 is updatable via PUT with full payload', async () => {
    const res = await request('PUT', '/api/users/2', { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' });
    assert.equal(res.status, 200);
    assert.equal(res.body.id, 2);
  });

  test('R6c: DELETE then PUT on that id', async () => {
    const user = await createUser();
    assert.equal((await request('DELETE', `/api/users/${user.id}`)).status, 204);
    const valid = await request('PUT', `/api/users/${user.id}`, validPayload());
    assert.equal(valid.status, 404);
    const invalid = await request('PUT', `/api/users/${user.id}`, {});
    assert.ok([400, 404].includes(invalid.status), `got ${invalid.status}`);
    assert.equal((await request('GET', `/api/users/${user.id}`)).status, 404);
  });
});
