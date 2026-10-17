import { test, expect } from '@playwright/test';
import { apiRequest, openScenario } from '../support/app';

test.describe('Timeouts & Cancellation', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'timeouts-cancellation', 'Timeouts & Cancellation');
  });

  test('R2d: timeout shorter than the server delay fails with a timeout error', async ({ page }) => {
    await page.getByTestId('timeout-slider').fill('1000');
    await page.getByTestId('delay-slider').fill('3000');
    await page.getByTestId('send-timeout').click();

    const timeoutCard = page.locator('.display-card', { hasText: 'Timeout Test' });
    await expect(timeoutCard.locator('.status-badge')).toHaveText('Timeout/Error');
    await expect(timeoutCard).toContainText('Error: timeout of 1000ms exceeded');
    const elapsed = Number(
      (await timeoutCard.getByText(/Time elapsed: \d+ms/).textContent())?.match(/(\d+)ms/)?.[1],
    );
    expect(elapsed).toBeGreaterThanOrEqual(900);
    expect(elapsed).toBeLessThan(2500);
  });

  test('R2d: timeout longer than the server delay succeeds', async ({ page }) => {
    await page.getByTestId('timeout-slider').fill('5000');
    await page.getByTestId('delay-slider').fill('1000');
    await page.getByTestId('send-timeout').click();

    const timeoutCard = page.locator('.display-card', { hasText: 'Timeout Test' });
    await expect(timeoutCard.locator('.status-badge')).toHaveText('Success');
    const data = JSON.parse((await timeoutCard.locator('pre').textContent()) ?? '');
    expect(data).toEqual({ message: 'Slow response', delay: 1000 });
  });

  test('R2e: AbortController cancels the in-flight request and is reported as canceled', async ({ page }) => {
    const longRequest = page.waitForRequest(apiRequest('GET', /^\/api\/slow\?delay=30000$/));
    await page.getByTestId('start-long-request').click();
    const req = await longRequest;
    const aborted = page.waitForEvent('requestfailed', { predicate: (r) => r === req, timeout: 2_000 });

    await page.waitForTimeout(1_000);
    await page.getByTestId('cancel-request').click();

    await aborted;
    const cancelCard = page.locator('.display-card', { hasText: 'Request Cancellation Test' });
    await expect(cancelCard.getByText('Request Canceled:')).toBeVisible({ timeout: 2_000 });
    await expect(cancelCard).toContainText('Error message: Request canceled');
    await expect(page.getByTestId('cancel-request')).toBeDisabled();
  });
});
