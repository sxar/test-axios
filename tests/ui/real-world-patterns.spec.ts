import { test, expect, type Page } from '@playwright/test';
import { createUsers, deleteUsers, listUsers, type User } from '../support/users-api';

async function openPattern(page: Page, pattern: 'pagination' | 'concurrent' | 'debounce') {
  await page.goto('/');
  const realWorld = page.getByTestId('test-real-world-patterns');
  if (!(await realWorld.isVisible())) {
    await page.getByTestId('category-tab-4--advanced-features').click();
  }
  await realWorld.click();
  await page.getByTestId(`pattern-${pattern}`).click();
}

const paginationSummary = (page: Page) => page.locator('strong', { hasText: 'Showing:' }).locator('..');

test.describe('Real-World Patterns > Pagination (R5)', () => {
  let created: User[] = [];

  test.afterEach(async ({ request }) => {
    await deleteUsers(request, created);
    created = [];
  });

  test('R5a: Load First Page shows total and totalPages from the response', async ({ page, request }) => {
    const expected = await listUsers(request, 'page=1&limit=5');
    await openPattern(page, 'pagination');
    await page.getByTestId('load-first-page').click();

    const summary = paginationSummary(page);
    await expect(summary).toHaveText(
      new RegExp(`Showing:\\s*${expected.total} users •\\s*Page 1 of ${expected.totalPages}`),
    );
    await expect(summary).not.toContainText('undefined');
  });

  test('R5b: Next is disabled on the last page', async ({ page, request }) => {
    const { total } = await listUsers(request, 'page=1&limit=5');
    expect(total, 'precondition: everything fits on one page of 5').toBeLessThanOrEqual(5);
    await openPattern(page, 'pagination');
    await page.getByTestId('load-first-page').click();
    await expect(paginationSummary(page)).toBeVisible();
    await expect(page.getByTestId('next-page')).toBeDisabled();
  });

  test('R5c/R5e: Next navigates while pages remain and is disabled on the last one', async ({ page, request }) => {
    const { total } = await listUsers(request);
    created = await createUsers(request, Math.max(0, 6 - total), 'Pagerfive');
    const firstPage = await listUsers(request, 'page=1&limit=5');
    const totalPages = firstPage.totalPages;
    expect(totalPages).toBeGreaterThanOrEqual(2);

    await openPattern(page, 'pagination');
    await page.getByTestId('load-first-page').click();
    const summary = paginationSummary(page);
    await expect(summary).toContainText(`Page 1 of ${totalPages}`);
    await expect(page.getByTestId('next-page')).toBeEnabled();
    await expect(page.getByTestId('prev-page')).toBeDisabled();

    await page.getByTestId('next-page').click();
    await expect(summary).toContainText(`Page 2 of ${totalPages}`);
    await expect(page.getByTestId('prev-page')).toBeEnabled();
    const secondPage = await listUsers(request, 'page=2&limit=5');
    for (const user of secondPage.data) {
      await expect(summary.locator('xpath=..')).toContainText(user.email);
    }

    for (let p = 3; p <= totalPages; p++) {
      await page.getByTestId('next-page').click();
      await expect(summary).toContainText(`Page ${p} of ${totalPages}`);
    }
    await expect(page.getByTestId('next-page')).toBeDisabled();
  });

  test('R5d: Next is enabled before anything is loaded', async ({ page }) => {
    await openPattern(page, 'pagination');
    await expect(page.getByTestId('next-page')).toBeEnabled();
  });

  test('R5f: the code example shows the flat response structure', async ({ page }) => {
    await openPattern(page, 'pagination');
    const example = page.locator('pre', { hasText: '// Fetch paginated data' });
    await expect(example).toContainText(/^\s{2}totalPages: \d+,?$/m);
    await expect(example).not.toContainText('pagination:');
    await expect(example).not.toContainText('hasMore');
  });
});

test.describe('Real-World Patterns > Debounced search (R6)', () => {
  let created: User[] = [];

  test.afterEach(async ({ request }) => {
    await deleteUsers(request, created);
    created = [];
  });

  test('R6a: shows the number of matches from the response total', async ({ page, request }) => {
    const { total } = await listUsers(request, 'search=jo');
    await openPattern(page, 'debounce');
    await page.getByTestId('search-input').fill('jo');
    await expect(page.getByText(/^Found \d+ results$/)).toHaveText(`Found ${total} results`);
  });

  test('R6b: a term with no matches shows Found 0 results', async ({ page }) => {
    await openPattern(page, 'debounce');
    await page.getByTestId('search-input').fill('zzzz');
    await expect(page.getByText(/^Found \d+ results$/)).toHaveText('Found 0 results');
  });

  test('R6c: the count is the full total, not the page length', async ({ page, request }) => {
    created = await createUsers(request, 11, 'Pagetest');
    await openPattern(page, 'debounce');
    await page.getByTestId('search-input').fill('pagetest');
    await expect(page.getByText(/^Found \d+ results$/)).toHaveText('Found 11 results');
    await expect(page.getByText('@pagetest.example')).toHaveCount(5);
  });
});

test.describe('Real-World Patterns > Concurrent (R7)', () => {
  test('R7a: the Users count is the default page of users', async ({ page, request }) => {
    const { total } = await listUsers(request);
    await openPattern(page, 'concurrent');
    await page.getByTestId('fetch-concurrent').click();
    const usersTile = page.getByText('Users', { exact: true }).locator('..');
    await expect(usersTile).toHaveText(`${Math.min(total, 10)}Users`);
  });
});
