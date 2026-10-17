import { test, expect } from '@playwright/test';
import { API_URL, openScenario } from '../support/app';

test.describe('Real-World Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await openScenario(page, 'real-world-patterns', 'Real-World Patterns');
  });

  test('R2p: concurrent requests with Promise.all all resolve and are displayed', async ({ page }) => {
    await page.getByTestId('pattern-concurrent').click();
    const paths = ['/api/users', '/api/posts', '/api/comments', '/api/stats'];
    const responses = Promise.all(paths.map((p) => page.waitForResponse(`${API_URL}${p}`)));
    await page.getByTestId('fetch-concurrent').click();
    for (const res of await responses) expect(res.status()).toBe(200);

    const card = page.locator('.display-card', { hasText: 'Concurrent Requests' });
    for (const name of ['Users', 'Posts', 'Comments', 'Stats']) {
      await expect(card.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(page.getByTestId('fetch-concurrent')).toHaveText('Fetch All Data');
  });

  test('R2p: retry with backoff against /api/flaky terminates', async ({ page }) => {
    test.setTimeout(30_000);
    await page.getByTestId('pattern-retry').click();
    await page.getByTestId('retry-button').click();
    const card = page.locator('.display-card', { hasText: 'Retry with Exponential Backoff' });
    await expect(card.getByText(/✓ Success!|✗ Failed/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('retry-button')).toHaveText('Test Retry Logic');
  });
});
