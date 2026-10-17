import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL, openPattern } from './support/real-world-patterns-page';

// The API starts with these three users; every test leaves exactly these behind.
const SEED_USERS = [
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'admin' },
  { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'user' },
  { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', role: 'user' },
];

type User = { id: number; firstName: string; lastName: string; email: string };

async function listUsers(request: APIRequestContext): Promise<User[]> {
  const res = await request.get(`${API_URL}/api/users`, { params: { limit: 1000 } });
  expect(res.ok()).toBe(true);
  return (await res.json()).data;
}

/** Deletes every user that is not a seed user and re-creates any missing seed user. */
async function resetUsers(request: APIRequestContext) {
  const users = await listUsers(request);
  const seedEmails = SEED_USERS.map(u => u.email);
  for (const user of users.filter(u => !seedEmails.includes(u.email))) {
    await request.delete(`${API_URL}/api/users/${user.id}`);
  }
  for (const seed of SEED_USERS.filter(s => !users.some(u => u.email === s.email))) {
    await request.post(`${API_URL}/api/users`, { data: seed });
  }
}

/** Adds users until GET /api/users reports `total`; returns the created users in order. */
async function seedUsersUpTo(request: APIRequestContext, total: number): Promise<User[]> {
  const existing = (await listUsers(request)).length;
  const created: User[] = [];
  for (let i = existing + 1; i <= total; i++) {
    const res = await request.post(`${API_URL}/api/users`, {
      data: { firstName: `Extra${i}`, lastName: 'Tester', email: `extra${i}@example.com`, role: 'user' },
    });
    expect(res.status()).toBe(201);
    created.push(await res.json());
  }
  const check = await request.get(`${API_URL}/api/users`);
  expect((await check.json()).total).toBe(total);
  return created;
}

const prevButton = (page: Page) => page.getByTestId('prev-page');
const nextButton = (page: Page) => page.getByTestId('next-page');
const loadFirstPage = (page: Page) => page.getByTestId('load-first-page');
// The "Page X of Y" label sits between the Previous and Next buttons.
const pageLabel = (page: Page) => prevButton(page).locator('xpath=following-sibling::span[1]');
const summaryLine = (page: Page) => page.getByText('Showing:').locator('..');
const userEntries = (page: Page) => summaryLine(page).locator('xpath=following-sibling::div[1]/div');

async function loadFirstPageAndWait(page: Page) {
  const response = page.waitForResponse(r => r.url().startsWith(`${API_URL}/api/users`) && r.request().method() === 'GET');
  await loadFirstPage(page).click();
  await response;
  await expect(summaryLine(page)).toBeVisible();
}

async function clickAndWait(page: Page, button: ReturnType<typeof nextButton>) {
  const response = page.waitForResponse(r => r.url().startsWith(`${API_URL}/api/users`) && r.request().method() === 'GET');
  await button.click();
  await response;
}

test.describe('Real-World Patterns > Pagination', () => {
  test.beforeEach(async ({ request }) => {
    await resetUsers(request);
  });

  test.afterEach(async ({ request }) => {
    await resetUsers(request);
  });

  test('R1a: with 3 users the label reads "Page 1 of 1"', async ({ page }) => {
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(pageLabel(page)).toHaveText('Page 1 of 1');
  });

  test('R1b: with 5 users (exact multiple of page size) the label reads "Page 1 of 1"', async ({ page, request }) => {
    await seedUsersUpTo(request, 5);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(pageLabel(page)).toHaveText('Page 1 of 1');
  });

  test('R1c: with 6 users the label reads "Page 1 of 2"', async ({ page, request }) => {
    await seedUsersUpTo(request, 6);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(pageLabel(page)).toHaveText('Page 1 of 2');
  });

  test('R1d: with 11 users the label reads "Page 1 of 3"', async ({ page, request }) => {
    await seedUsersUpTo(request, 11);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(pageLabel(page)).toHaveText('Page 1 of 3');
  });

  test('R1e: summary line with 3 users reads "Showing: 3 users • Page 1 of 1"', async ({ page }) => {
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(summaryLine(page)).toContainText('Showing: 3 users');
    await expect(summaryLine(page)).toContainText('Page 1 of 1');
  });

  test('R1e: summary line with 6 users on page 2 reads "Showing: 6 users • Page 2 of 2"', async ({ page, request }) => {
    await seedUsersUpTo(request, 6);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();
    await clickAndWait(page, nextButton(page));
    await expect(summaryLine(page)).toContainText('Showing: 6 users');
    await expect(summaryLine(page)).toContainText('Page 2 of 2');
  });

  test('R1f: before any page is loaded the label reads "Page 1" with no page count', async ({ page }) => {
    await openPattern(page, 'pagination');
    await expect(pageLabel(page)).toHaveText('Page 1');
    await expect(page.getByText('Showing:')).toHaveCount(0);
  });

  test('R2a: with 3 users Next is disabled after Load First Page', async ({ page }) => {
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeDisabled();
    await expect(nextButton(page)).toHaveCSS('opacity', '0.4');
  });

  test('R2b: with 6 users Next is enabled on page 1', async ({ page, request }) => {
    await seedUsersUpTo(request, 6);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();
    await expect(nextButton(page)).toHaveCSS('opacity', '1');
  });

  test('R2c: with 6 users Next shows page 2 with only the 6th user, then Next is disabled', async ({ page, request }) => {
    const [sixth] = await seedUsersUpTo(request, 6);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();
    await clickAndWait(page, nextButton(page));
    await expect(pageLabel(page)).toHaveText('Page 2 of 2');
    await expect(userEntries(page)).toHaveCount(1);
    await expect(userEntries(page).first()).toContainText(sixth.email);
    await expect(nextButton(page)).toBeDisabled();
  });

  test('R2d: with 10 users Next is enabled on page 1 and disabled on page 2', async ({ page, request }) => {
    await seedUsersUpTo(request, 10);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();
    await clickAndWait(page, nextButton(page));
    await expect(pageLabel(page)).toHaveText('Page 2 of 2');
    await expect(userEntries(page)).toHaveCount(5);
    await expect(nextButton(page)).toBeDisabled();
  });

  test('R2f: Next is disabled while a page request is in flight', async ({ page, request }) => {
    // 10 users: page 1 is not the last page under either rounding, so Next is enabled once loaded.
    await seedUsersUpTo(request, 10);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();

    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(`${API_URL}/api/users?**`, async route => {
      await gate;
      await route.continue();
    });
    const response = page.waitForResponse(r => r.url().startsWith(`${API_URL}/api/users`));
    await loadFirstPage(page).click();
    await expect(nextButton(page)).toBeDisabled();
    release();
    await response;
    await expect(nextButton(page)).toBeEnabled();
  });

  test('R2g: before data loads, Next never shows a page past the end (3 users)', async ({ page }) => {
    await openPattern(page, 'pagination');
    if (await nextButton(page).isEnabled()) {
      await clickAndWait(page, nextButton(page));
    }
    await expect(pageLabel(page)).not.toHaveText(/^Page 2/);
  });

  test('R3a: Previous is disabled on page 1 before and after Load First Page', async ({ page }) => {
    await openPattern(page, 'pagination');
    await expect(prevButton(page)).toBeDisabled();
    await loadFirstPageAndWait(page);
    await expect(prevButton(page)).toBeDisabled();
  });

  test('R3b: with 6 users Previous is enabled on page 2 and returns to page 1', async ({ page, request }) => {
    await seedUsersUpTo(request, 6);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();
    await clickAndWait(page, nextButton(page));
    await expect(prevButton(page)).toBeEnabled();
    await clickAndWait(page, prevButton(page));
    await expect(pageLabel(page)).toHaveText('Page 1 of 2');
    await expect(userEntries(page)).toHaveCount(5);
    await expect(prevButton(page)).toBeDisabled();
    await expect(nextButton(page)).toBeEnabled();
  });

  test('R4a: Load First Page renders the result panel without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(page.getByText('Showing:')).toBeVisible();
    await expect(userEntries(page)).toHaveCount(3);
    await expect(page.getByTestId('pattern-pagination')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('R4b: each listed user shows the name and email', async ({ page }) => {
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(userEntries(page)).toHaveCount(3);
    await expect(userEntries(page).first()).toContainText('John');
    await expect(userEntries(page).first()).toContainText('Doe');
    await expect(userEntries(page).first()).toContainText('john@example.com');
    for (const text of await userEntries(page).allTextContents()) {
      expect(text.trim()).not.toMatch(/^-/);
    }
  });

  test('R5a: with 6 users, Load First Page from page 2 returns to page 1', async ({ page, request }) => {
    await seedUsersUpTo(request, 6);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(nextButton(page)).toBeEnabled();
    await clickAndWait(page, nextButton(page));
    await clickAndWait(page, loadFirstPage(page));
    await expect(pageLabel(page)).toHaveText('Page 1 of 2');
    await expect(userEntries(page)).toHaveCount(5);
    await expect(nextButton(page)).toBeEnabled();
    await expect(prevButton(page)).toBeDisabled();
  });

  test('six-users-page-two-reachable: with 6 users page 2 shows the 6th user', async ({ page, request }) => {
    const created = await seedUsersUpTo(request, 6);
    const sixth = created[created.length - 1];
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(pageLabel(page)).toHaveText('Page 1 of 2');
    await expect(nextButton(page)).toBeEnabled();
    await clickAndWait(page, nextButton(page));
    await expect(userEntries(page)).toHaveCount(1);
    await expect(userEntries(page).first()).toContainText(sixth.email);
    await expect(pageLabel(page)).toHaveText('Page 2 of 2');
  });

  test('three-users-page-count-one: header and summary both read "Page 1 of 1"', async ({ page }) => {
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(pageLabel(page)).toHaveText('Page 1 of 1');
    await expect(summaryLine(page)).toContainText('Page 1 of 1');
    await expect(summaryLine(page)).not.toContainText('of 0');
  });

  test('user-list-shows-names: no entry has a blank name', async ({ page }) => {
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(userEntries(page).first()).toContainText('John Doe');
    await expect(userEntries(page).first()).toContainText('john@example.com');
    await expect(userEntries(page).filter({ hasText: /^\s*-\s/ })).toHaveCount(0);
  });

  test('next-before-load-not-past-end: Next before loading does not show an empty page 2', async ({ page }) => {
    await openPattern(page, 'pagination');
    if (await nextButton(page).isEnabled()) {
      await clickAndWait(page, nextButton(page));
      const onEmptyPageTwo =
        /^Page 2/.test((await pageLabel(page).textContent()) ?? '') && (await userEntries(page).count()) === 0;
      expect(onEmptyPageTwo).toBe(false);
    } else {
      await expect(nextButton(page)).toBeDisabled();
    }
  });

  // Deletes every user, so it runs last; afterEach restores the seed users (with new ids).
  test('R2e: with 0 users both buttons are disabled and the panel renders', async ({ page, request }) => {
    for (const user of await listUsers(request)) {
      await request.delete(`${API_URL}/api/users/${user.id}`);
    }
    expect(await listUsers(request)).toHaveLength(0);
    await openPattern(page, 'pagination');
    await loadFirstPageAndWait(page);
    await expect(summaryLine(page)).toContainText('Showing: 0 users');
    await expect(userEntries(page)).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    await expect(prevButton(page)).toBeDisabled();
    await expect(pageLabel(page)).toHaveText(/^Page 1 of [01]$/);
  });
});
