import { test, expect, type Page } from '@playwright/test';
import { apiRequest, openScenario } from '../support/app';

const analysis = (page: Page) => page.locator('.display-card', { hasText: 'Error Analysis' });

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'error-handling', 'Error Handling');
  });

  test('R2f: 404 rejects with an AxiosError carrying the response', async ({ page }) => {
    await page.getByTestId('error-404').click();
    const card = analysis(page);
    await expect(card).toContainText('response Error');
    await expect(card).toContainText('isAxiosError: true');
    await expect(card.locator('code')).toHaveText('ERR_BAD_REQUEST');
    await expect(card).toContainText('404 Not Found');
    await expect(card).toContainText('error.response:✓ Present');
  });

  test('R2f: 500 rejects with ERR_BAD_RESPONSE', async ({ page }) => {
    await page.getByTestId('error-500').click();
    const card = analysis(page);
    await expect(card).toContainText('response Error');
    await expect(card.locator('code')).toHaveText('ERR_BAD_RESPONSE');
    await expect(card).toContainText('500 Internal Server Error');
  });

  test('R2f: validateStatus override resolves the 404', async ({ page }) => {
    await page.getByTestId('validate-status-toggle').check();
    const [req] = await Promise.all([
      page.waitForRequest(apiRequest('GET', '/api/error/404')),
      page.getByTestId('error-404').click(),
    ]);
    expect((await req.response())?.status()).toBe(404);
    // The request resolved: buttons re-enable and no error analysis is rendered.
    await expect(page.getByTestId('error-404')).toBeEnabled();
    await expect(analysis(page)).toHaveCount(0);
  });

  test('R2g: unreachable server yields a request-category ERR_NETWORK error', async ({ page }) => {
    await page.getByTestId('network-error').click();
    const card = analysis(page);
    await expect(card).toContainText('request Error');
    await expect(card.locator('code')).toHaveText('ERR_NETWORK');
    await expect(card).toContainText('Network Error');
    await expect(card).toContainText('error.response:✗ Not present');
  });

  test('R2h: timeout yields a request-category ECONNABORTED error', async ({ page }) => {
    await page.getByTestId('timeout-error').click();
    const card = analysis(page);
    await expect(card).toContainText('request Error', { timeout: 2_000 });
    await expect(card.locator('code')).toHaveText('ECONNABORTED');
    await expect(card).toContainText('timeout of 500ms exceeded');
  });
});
