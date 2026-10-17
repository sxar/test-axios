import { test, expect } from '@playwright/test';
import { API_URL, createUsers, deleteUsers, listUsers, type User } from '../support/users-api';

const matchesSearch = (u: User, term: string) =>
  [u.firstName, u.lastName, u.email].some(v => v.toLowerCase().includes(term.toLowerCase()));

test.describe('GET /api/users totalPages (R1)', () => {
  test('R1a: no params returns data, total, totalPages, page and limit at the top level', async ({ request }) => {
    const body = await listUsers(request);
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.totalPages).toBe('number');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.totalPages).toBe(Math.ceil(body.total / 10));
    expect(body.data).toHaveLength(Math.min(body.total, 10));
    expect(body).not.toHaveProperty('pagination');
  });

  test('R1b: limit=2 gives totalPages = ceil(total/2) and two items on page 1', async ({ request }) => {
    const body = await listUsers(request, 'limit=2');
    expect(body.totalPages).toBe(Math.ceil(body.total / 2));
    expect(body.data).toHaveLength(Math.min(body.total, 2));
  });

  test('R1c: limit=total gives one page, limit=1 gives total pages', async ({ request }) => {
    const { total } = await listUsers(request);
    const whole = await listUsers(request, `limit=${total}`);
    expect(whole.totalPages).toBe(1);
    const single = await listUsers(request, 'limit=1');
    expect(single.totalPages).toBe(total);
  });

  test('R1d: role, status and search filters narrow total and totalPages', async ({ request }) => {
    const all = (await listUsers(request, 'limit=1000')).data;

    const byRole = await listUsers(request, 'role=user&limit=1');
    const roleCount = all.filter(u => u.role === 'user').length;
    expect(byRole.total).toBe(roleCount);
    expect(byRole.totalPages).toBe(roleCount);

    const byStatus = await listUsers(request, 'status=inactive&limit=1');
    const statusCount = all.filter(u => u.status === 'inactive').length;
    expect(byStatus.total).toBe(statusCount);
    expect(byStatus.totalPages).toBe(Math.ceil(statusCount / 1));

    const bySearch = await listUsers(request, 'search=jo&limit=1');
    const searchCount = all.filter(u => matchesSearch(u, 'jo')).length;
    expect(bySearch.total).toBe(searchCount);
    expect(bySearch.totalPages).toBe(Math.ceil(searchCount / 1));
  });

  test('R1e: a filter that matches nothing returns an empty page with a finite totalPages', async ({ request }) => {
    const body = await listUsers(request, 'search=zzzz-nomatch');
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
    expect(Number.isInteger(body.totalPages)).toBe(true);
    expect([0, 1]).toContain(body.totalPages);
  });

  test('R1f: creating users updates total and totalPages', async ({ request }) => {
    const before = await listUsers(request, 'limit=5');
    const created = await createUsers(request, 4);
    try {
      const after = await listUsers(request, 'limit=5');
      expect(after.total).toBe(before.total + 4);
      expect(after.totalPages).toBe(Math.ceil(after.total / 5));
    } finally {
      await deleteUsers(request, created);
    }
  });
});

test.describe('GET /api/users page window (R2)', () => {
  test('R2a: consecutive limit=2 pages cover the whole list with no overlap or gap', async ({ request }) => {
    const full = await listUsers(request, 'limit=1000');
    const first = await listUsers(request, 'limit=2&page=1');
    expect(first.data).toEqual(full.data.slice(0, 2));

    const pages = [first.data];
    for (let page = 2; page <= first.totalPages; page++) {
      const body = await listUsers(request, `limit=2&page=${page}`);
      expect(body.data).toEqual(full.data.slice((page - 1) * 2, page * 2));
      pages.push(body.data);
    }
    expect(pages.flat()).toEqual(full.data);
  });

  test('R2b: a page past the last returns no data and keeps the totals', async ({ request }) => {
    const first = await listUsers(request, 'limit=2');
    const body = await listUsers(request, 'limit=2&page=99');
    expect(body.data).toEqual([]);
    expect(body.total).toBe(first.total);
    expect(body.totalPages).toBe(first.totalPages);
    expect(body.page).toBe(99);
  });

  test('R2c: the window is taken from the filtered list', async ({ request }) => {
    const allUsers = await listUsers(request, 'role=user&limit=100');
    const page1 = await listUsers(request, 'role=user&limit=1&page=1');
    const page2 = await listUsers(request, 'role=user&limit=1&page=2');
    expect(page1.data).toEqual(allUsers.data.slice(0, 1));
    expect(page2.data).toEqual(allUsers.data.slice(1, 2));
  });
});

test.describe('GET /api/users page guard (R3)', () => {
  for (const [id, value] of [
    ['R3a', '0'],
    ['R3b', '-5'],
    ['R3c', 'abc'],
    ['R3c', ''],
  ]) {
    test(`${id}: page=${value} falls back to page 1`, async ({ request }) => {
      const firstWindow = await listUsers(request, 'page=1&limit=2');
      const body = await listUsers(request, `page=${value}&limit=2`);
      expect(body.page).toBe(1);
      expect(body.data).toEqual(firstWindow.data);
    });
  }

  test('R3d: page=1.7 is page 1', async ({ request }) => {
    const firstWindow = await listUsers(request, 'page=1&limit=2');
    const body = await listUsers(request, 'page=1.7&limit=2');
    expect(body.page).toBe(1);
    expect(body.data).toEqual(firstWindow.data);
  });

  test('R3d: a huge page answers 200 with an empty window', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/users?page=99999999999999999999&limit=2`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.page).toBe('number');
    expect(body.page).toBeGreaterThanOrEqual(1);
    expect(body.data).toEqual([]);
  });

  test('R3e: page and limit come back as JSON numbers', async ({ request }) => {
    const body = await listUsers(request, 'page=2&limit=2');
    expect(typeof body.page).toBe('number');
    expect(typeof body.limit).toBe('number');
    expect(body.page).toBe(2);
    expect(body.limit).toBe(2);
  });
});

test.describe('GET /api/users limit guard (R4)', () => {
  test('R4a: limit=0 clamps to 1 and totalPages stays finite', async ({ request }) => {
    const body = await listUsers(request, 'limit=0');
    expect(body.limit).toBe(1);
    expect(body.data).toHaveLength(Math.min(body.total, 1));
    expect(Number.isFinite(body.totalPages)).toBe(true);
    expect(body.totalPages).toBe(body.total);
  });

  test('R4b: a negative limit clamps to at least 1', async ({ request }) => {
    const body = await listUsers(request, 'limit=-3');
    expect(body.limit).toBeGreaterThanOrEqual(1);
    expect(body.data.length).toBeLessThanOrEqual(body.limit);
    expect(Number.isFinite(body.totalPages)).toBe(true);
    expect(body.totalPages).toBe(Math.ceil(body.total / body.limit));
  });

  for (const value of ['abc', '']) {
    test(`R4c: limit=${value} falls back to 10`, async ({ request }) => {
      const body = await listUsers(request, `limit=${value}`);
      expect(body.limit).toBe(10);
      expect(body.totalPages).toBe(Math.ceil(body.total / 10));
    });
  }

  test('R4d: limit=1000 returns every user on one page', async ({ request }) => {
    const body = await listUsers(request, 'limit=1000');
    expect(body.data).toHaveLength(body.total);
    expect(body.totalPages).toBe(1);
  });

  test('R4e: invalid page and limit together give page 1 of 10', async ({ request }) => {
    const defaults = await listUsers(request);
    const body = await listUsers(request, 'page=x&limit=y');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.data).toEqual(defaults.data.slice(0, 10));
  });
});

test.describe('Other consumers of /api/users (R7)', () => {
  test('R7b: limit=3, as RequestInterceptors sends, still returns the user array', async ({ request }) => {
    const body = await listUsers(request, 'limit=3');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(Math.min(body.total, 3));
    expect(body.limit).toBe(3);
  });

  test('R7c: POST and DELETE are reflected in the list and its total', async ({ request }) => {
    const before = await listUsers(request, 'limit=1000');
    const [created] = await createUsers(request, 1);

    const withUser = await listUsers(request, 'limit=1000');
    expect(withUser.data.map(u => u.id)).toContain(created.id);
    expect(withUser.total).toBe(before.total + 1);

    const del = await request.delete(`${API_URL}/api/users/${created.id}`);
    expect(del.status()).toBe(204);

    const after = await listUsers(request, 'limit=1000');
    expect(after.data.map(u => u.id)).not.toContain(created.id);
    expect(after.total).toBe(before.total);
  });
});
