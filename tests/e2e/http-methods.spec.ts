import { test, expect, type Page } from '@playwright/test';
import { API_URL, apiRequest, openScenario } from '../support/app';

// Mutating scenarios work on a throwaway user so the seed users stay intact.
async function createUser(page: Page): Promise<number> {
  const res = await page.request.post(`${API_URL}/api/users`, {
    data: { firstName: 'Temp', lastName: 'User', email: 'temp@example.com', role: 'user' },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).id;
}

test.describe('HTTP methods', () => {
  test('R2a: GET sends query params and custom headers', async ({ page }) => {
    await openScenario(page, 'get-requests', 'GET Requests');
    await expect(page.getByTestId('url-input')).toHaveValue('/api/users');

    await page.getByTestId('add-query-param').click();
    await page.getByTestId('query-key-0').fill('limit');
    await page.getByTestId('query-value-0').fill('2');
    await page.getByTestId('add-header').click();
    await page.getByTestId('header-key-0').fill('X-Test');
    await page.getByTestId('header-value-0').fill('abc');

    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('GET', '/api/users')),
      page.getByTestId('send-get-request').click(),
    ]);
    expect(new URL(req.url()).searchParams.get('limit')).toBe('2');
    expect((await req.allHeaders())['x-test']).toBe('abc');

    await expect(page.locator('.status-badge')).toHaveText('200 OK');
    await expect(page.locator('.status-badge')).toHaveClass(/status-success/);
    const body = JSON.parse((await page.locator('pre').first().textContent()) ?? '');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  const writes = [
    { method: 'POST', testId: 'method-post', badge: '201 Created', onUser: false },
    { method: 'PUT', testId: 'method-put', badge: '200 OK', onUser: true },
    { method: 'PATCH', testId: 'method-patch', badge: '200 OK', onUser: true },
  ];
  for (const { method, testId, badge, onUser } of writes) {
    test(`R2b: ${method} sends a JSON body`, async ({ page }) => {
      const path = onUser ? `/api/users/${await createUser(page)}` : '/api/users';
      await openScenario(page, 'post-put-patch', 'POST, PUT, PATCH Requests');
      await page.getByTestId(testId).click();
      await page.getByTestId('url-input').fill(path);
      const expectedBody = JSON.parse(await page.getByTestId('request-body').inputValue());

      const [req] = await Promise.all([
        page.waitForRequest(apiRequest(method, path)),
        page.getByTestId('send-request').click(),
      ]);
      expect((await req.allHeaders())['content-type']).toMatch(/^application\/json/);
      expect(req.postDataJSON()).toEqual(expectedBody);

      await expect(page.locator('.status-badge')).toHaveText(badge);
      await expect(page.locator('.status-badge')).toHaveClass(/status-success/);
      const shown = JSON.parse((await page.locator('pre').first().textContent()) ?? '');
      expect(shown).toMatchObject(expectedBody);
    });
  }

  test('R2c: DELETE removes a user', async ({ page }) => {
    const id = await createUser(page);
    await openScenario(page, 'delete-others', 'DELETE & Other Methods');
    await page.getByTestId('method-delete').click();
    await page.getByTestId('url-input').fill(`/api/users/${id}`);

    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('DELETE', `/api/users/${id}`)),
      page.getByTestId('send-request').click(),
    ]);
    expect((await req.response())?.status()).toBe(204);
    await expect(page.locator('.status-badge')).toHaveClass(/status-success/);
    await expect(page.getByText('✓ Resource deleted successfully')).toBeVisible();
  });

  test('R2c: HEAD returns headers with no body', async ({ page }) => {
    await openScenario(page, 'delete-others', 'DELETE & Other Methods');
    await page.getByTestId('method-head').click();
    await page.getByTestId('url-input').fill('/api/users/1');

    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('HEAD', '/api/users')),
      page.getByTestId('send-request').click(),
    ]);
    const res = await req.response();
    expect(res?.status()).toBe(200);
    expect(await res?.body()).toHaveLength(0);
    await expect(page.locator('.status-badge')).toHaveText('200 OK');
    await expect(page.getByText('Headers Only (No Body)')).toBeVisible();
    await expect(page.locator('pre').first()).toContainText('"content-type": "application/json');
  });

  test('R2c: OPTIONS succeeds', async ({ page }) => {
    await openScenario(page, 'delete-others', 'DELETE & Other Methods');
    await page.getByTestId('method-options').click();
    await page.getByTestId('url-input').fill('/api/users/1');

    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('OPTIONS', '/api/users')),
      page.getByTestId('send-request').click(),
    ]);
    const status = (await req.response())?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
    await expect(page.locator('.status-badge')).toHaveClass(/status-success/);
    await expect(page.getByText('Allowed Methods')).toBeVisible();
  });
});
