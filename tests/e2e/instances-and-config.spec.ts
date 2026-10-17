import { test, expect, type Page } from '@playwright/test';
import { apiRequest, openScenario } from '../support/app';

test.describe('Custom Instances & Defaults', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'custom-instances', 'Custom Instances & Defaults');
  });

  const instances = [
    {
      testId: 'instance-default',
      path: '/api/users',
      present: {},
      absent: ['x-custom-header', 'x-api-version', 'authorization', 'x-client-type'],
    },
    {
      testId: 'instance-custom1',
      path: '/api/users',
      present: { 'x-custom-header': 'api-client', 'x-api-version': 'v1' },
      absent: ['authorization', 'x-client-type'],
    },
    {
      testId: 'instance-custom2',
      path: '/api/protected',
      present: { authorization: 'Bearer demo-token-12345', 'x-client-type': 'auth-client' },
      absent: ['x-custom-header', 'x-api-version'],
    },
  ];
  for (const { testId, path, present, absent } of instances) {
    test(`R2m: ${testId} sends only its own headers`, async ({ page }) => {
      await page.getByTestId(testId).check();
      const [req] = await Promise.all([
        page.waitForRequest(apiRequest('GET', path)),
        page.getByTestId('send-request').click(),
      ]);
      const headers = await req.allHeaders();
      expect(headers).toMatchObject(present);
      for (const name of absent) expect(headers[name], name).toBeUndefined();
      await expect(page.locator('.display-card', { hasText: 'Instance Configuration' })).toContainText('✓ 200');
    });
  }

  test('R2m: global defaults apply to the default axios instance', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByTestId('custom-header-input').fill('my-app-v2');
    await page.getByTestId('set-defaults').click();

    await page.getByTestId('instance-default').check();
    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('GET', '/api/users')),
      page.getByTestId('send-request').click(),
    ]);
    expect((await req.allHeaders())['x-custom-header']).toBe('my-app-v2');
  });
});

test.describe('Response Types & Transformation', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'response-types', 'Response Types & Transformation');
  });

  const responseCard = (page: Page) => page.locator('.display-card', { has: page.locator('h3', { hasText: /^Response$/ }) });

  test('R2n: json responseType returns a parsed object', async ({ page }) => {
    await page.getByTestId('type-json').click();
    await page.getByTestId('endpoint-selector').selectOption('/api/users');
    await page.getByTestId('fetch-data').click();
    const card = responseCard(page);
    await expect(card.locator('.status-badge')).toHaveText('200 OK');
    await expect(card.locator('h4 code')).toHaveText('json');
    const data = JSON.parse((await card.locator('pre').textContent()) ?? '');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('R2n: text responseType returns a string', async ({ page }) => {
    await page.getByTestId('type-text').click();
    await page.getByTestId('endpoint-selector').selectOption('/api/text');
    await page.getByTestId('fetch-data').click();
    const card = responseCard(page);
    await expect(card.locator('.status-badge')).toHaveText('200 OK');
    await expect(card.locator('h4 code')).toHaveText('text');
    await expect(card).toContainText('Content-Type: text/plain');
    await expect(card.getByText('Hello, World!', { exact: true })).toBeVisible();
  });

  test('R2n: blob responseType returns a Blob that can be downloaded', async ({ page }) => {
    await page.getByTestId('type-blob').click();
    await page.getByTestId('endpoint-selector').selectOption('/api/download/file.pdf');
    await page.getByTestId('fetch-data').click();
    const card = responseCard(page);
    await expect(card.locator('.status-badge')).toHaveText('200 OK');
    await expect(card.locator('h4 code')).toHaveText('blob');
    await expect(card).toContainText('Type: application/octet-stream');
    await expect(card).toContainText('Size: 102400 bytes');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-blob').click(),
    ]);
    expect(download.suggestedFilename()).toBe('download');
  });

  test('R2n: arraybuffer responseType returns raw bytes', async ({ page }) => {
    await page.getByTestId('type-arraybuffer').click();
    await page.getByTestId('endpoint-selector').selectOption('/api/download/file.pdf');
    await page.getByTestId('fetch-data').click();
    const card = responseCard(page);
    await expect(card.locator('.status-badge')).toHaveText('200 OK');
    await expect(card).toContainText('ArrayBuffer Size: 102400 bytes');
  });
});

test.describe('Headers & Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'headers-auth', 'Headers & Authentication');
  });

  test('R2o: bearer token reaches /api/protected', async ({ page }) => {
    await page.getByTestId('auth-bearer').click();
    await expect(page.getByTestId('token-input')).toHaveValue('test-token-123');
    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('GET', '/api/protected')),
      page.getByTestId('send-auth-request').click(),
    ]);
    expect((await req.allHeaders())['authorization']).toBe('Bearer test-token-123');
    await expect(page.locator('.status-badge')).toHaveText('200 OK');
    await expect(page.getByText('Authentication Successful:')).toBeVisible();
    const response = page.locator('.display-card', { has: page.locator('h3', { hasText: /^Response$/ }) });
    await expect(response.locator('pre')).toContainText('"message": "Protected data"');
  });

  test('R2o: request without a token is rejected with 401', async ({ page }) => {
    await page.getByTestId('auth-none').click();
    await page.getByTestId('send-auth-request').click();
    await expect(page.locator('.status-badge')).toHaveText('401 Unauthorized');
    await expect(page.locator('.status-badge')).toHaveClass(/status-error/);
    await expect(page.getByText('Error: Request failed with status code 401')).toBeVisible();
  });

  test('R2o: custom header is sent with the request', async ({ page }) => {
    await page.getByTestId('auth-bearer').click();
    await page.getByTestId('add-custom-header').click();
    await page.getByTestId('custom-header-key-0').fill('X-Trace-Id');
    await page.getByTestId('custom-header-value-0').fill('trace-42');
    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('GET', '/api/protected')),
      page.getByTestId('send-auth-request').click(),
    ]);
    expect((await req.allHeaders())['x-trace-id']).toBe('trace-42');
    await expect(page.locator('.status-badge')).toHaveText('200 OK');
  });
});
