import { test, expect } from '@playwright/test';
import { API_URL } from '../support/app';

test.use({ baseURL: API_URL });

test.describe('GET /api/users', () => {
  test('R3a: API server answers with the user list', async ({ request }) => {
    const res = await request.get('/api/users');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^application\/json/);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('R3b: limit query param paginates', async ({ request }) => {
    const res = await request.get('/api/users?limit=2');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.limit).toBe(2);
  });

  test('R3b: search query param filters users', async ({ request }) => {
    const res = await request.get('/api/users?search=john');
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.map((u: { email: string }) => u.email)).toContain('john@example.com');
    expect(data.map((u: { email: string }) => u.email)).not.toContain('jane@example.com');
    for (const u of data) {
      expect(`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase()).toContain('john');
    }
  });

  test('R3b: nested and repeated query forms are parsed without a server error', async ({ request }) => {
    const res = await request.get('/api/users?a[b]=1&c=1&c=2');
    expect(res.status()).toBeLessThan(500);
  });

  test('R3b: pagination edge values keep their current behaviour', async ({ request }) => {
    const zeroLimit = await request.get('/api/users?limit=0');
    expect(zeroLimit.status()).toBe(200);
    expect((await zeroLimit.json()).data).toEqual([]);

    const badLimit = await request.get('/api/users?limit=abc');
    expect(badLimit.status()).toBe(200);
    expect(await badLimit.json()).toMatchObject({ data: [], limit: null });

    const zeroPage = await request.get('/api/users?page=0');
    expect(zeroPage.status()).toBe(200);
    expect((await zeroPage.json()).data).toEqual([]);
  });
});

test.describe('POST /api/upload', () => {
  test('R3c: multipart file upload returns filename and size', async ({ request }) => {
    const res = await request.post('/api/upload', {
      multipart: {
        file: { name: 'contract.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(1024, 7) },
        description: 'contract test',
      },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ filename: 'contract.bin', size: 1024, description: 'contract test' });
  });

  test('R3c: multipart request without a file is rejected', async ({ request }) => {
    const res = await request.post('/api/upload', { multipart: { description: 'no file' } });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: 'No file uploaded' });
  });
});

test.describe('POST /api/users', () => {
  test('R3c: JSON body creates a user', async ({ request }) => {
    const user = { firstName: 'Contract', lastName: 'Tester', email: 'contract@example.com' };
    const res = await request.post('/api/users', { data: user });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ ...user, status: 'active' });
    expect(typeof body.id).toBe('number');
  });
});
