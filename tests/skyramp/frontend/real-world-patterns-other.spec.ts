import { test, expect } from '@playwright/test';
import { API_URL, openPattern } from './support/real-world-patterns-page';

test.describe('Real-World Patterns > other patterns (R6)', () => {
  test('R6: Retry Logic shows success once the flaky endpoint answers', async ({ page }) => {
    // /api/flaky fails twice before succeeding; answer at once so the test does not wait out the backoff.
    await page.route(`${API_URL}/api/flaky`, route =>
      route.fulfill({ json: { message: 'Success after retries', data: { id: 1, value: 'test' } } }),
    );
    await openPattern(page, 'retry');
    await page.getByTestId('retry-button').click();
    await expect(page.getByText('✓ Success!')).toBeVisible();
    await expect(page.getByText('Success after retries')).toBeVisible();
  });

  test('R6: Concurrent fetch shows a count for each resource', async ({ page, request }) => {
    const users = await (await request.get(`${API_URL}/api/users`)).json();
    await openPattern(page, 'concurrent');
    await page.getByTestId('fetch-concurrent').click();
    const usersTile = page.getByText('Users', { exact: true }).locator('..');
    await expect(usersTile).toContainText(String(users.data.length));
    for (const name of ['Posts', 'Comments', 'Stats']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test('R6: Debounced search lists matching users after typing stops', async ({ page }) => {
    await openPattern(page, 'debounce');
    await page.getByTestId('search-input').fill('jane');
    await expect(page.getByText('Waiting for you to finish typing...')).toBeVisible();
    await expect(page.getByText('jane@example.com')).toBeVisible();
  });
});
