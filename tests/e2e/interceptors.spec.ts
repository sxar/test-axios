import { test, expect, type Page } from '@playwright/test';
import { apiRequest, openScenario } from '../support/app';

const testRequestCard = (page: Page, title: string) => page.locator('.display-card', { hasText: title }).last();

test.describe('Request Interceptors', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'request-interceptors', 'Request Interceptors');
  });

  async function sendTestRequest(page: Page) {
    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('GET', '/api/users')),
      page.getByTestId('send-test-request').click(),
    ]);
    await expect(testRequestCard(page, 'Test Request').locator('.status-badge')).toHaveText('200 OK');
    return req.allHeaders();
  }

  test('R2i: custom header interceptor modifies the outgoing request', async ({ page }) => {
    await page.getByTestId('add-custom-interceptor').click();
    await expect(page.getByTestId('interceptor-1')).toContainText('Custom Header');

    const headers = await sendTestRequest(page);
    expect(headers['x-custom-header']).toBe('interceptor-value');
    await expect(testRequestCard(page, 'Test Request')).toContainText('Interceptor 1 (Custom Header) executed');
  });

  test('R2i: auth token interceptor adds the Authorization header', async ({ page }) => {
    await page.getByTestId('add-auth-interceptor').click();
    await expect(page.getByTestId('interceptor-1')).toContainText('Auth Token');

    const headers = await sendTestRequest(page);
    expect(headers['authorization']).toBe('Bearer interceptor-token-123');
  });

  test('R2i: removed (ejected) interceptor no longer modifies requests', async ({ page }) => {
    await page.getByTestId('add-custom-interceptor').click();
    await page.getByTestId('remove-interceptor-1').click();
    await expect(page.getByTestId('interceptor-1')).toHaveCount(0);

    const headers = await sendTestRequest(page);
    expect(headers['x-custom-header']).toBeUndefined();
    await expect(testRequestCard(page, 'Test Request')).not.toContainText('Execution Log');
  });
});

test.describe('Response Interceptors', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'response-interceptors', 'Response Interceptors');
  });

  const shownData = async (page: Page) =>
    JSON.parse((await testRequestCard(page, 'Test Requests').locator('pre').textContent()) ?? '');

  test('R2j: data extractor unwraps the /api/wrapped payload', async ({ page }) => {
    await page.getByTestId('add-extractor-interceptor').click();
    await page.getByTestId('send-test-request').click();
    await expect(testRequestCard(page, 'Test Requests').locator('.status-badge')).toHaveText('200 OK');

    const data = await shownData(page);
    expect(data).not.toHaveProperty('success');
    expect(Array.isArray(data.users)).toBe(true);
  });

  test('R2j: error handler interceptor adds a user-friendly message to the 404', async ({ page }) => {
    await page.getByTestId('add-error-interceptor').click();
    await page.getByTestId('send-error-request').click();
    const card = testRequestCard(page, 'Test Requests');
    await expect(card.locator('.status-badge')).toHaveText('404 Not Found');
    await expect(card).toContainText('Error: Resource not found.');
  });

  test('R2j: removing the extractor restores the raw wrapped response', async ({ page }) => {
    await page.getByTestId('add-extractor-interceptor').click();
    await page.getByTestId('remove-interceptor-1').click();
    await page.getByTestId('send-test-request').click();
    await expect(testRequestCard(page, 'Test Requests').locator('.status-badge')).toHaveText('200 OK');

    const data = await shownData(page);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.users)).toBe(true);
  });
});
