import { test, expect } from '@playwright/test';

const SIDEBAR_ITEMS = [
  'GET Requests',
  'POST, PUT, PATCH Requests',
  'DELETE & Other Methods',
  'Headers & Authentication',
  'Timeouts & Cancellation',
  'Response Types & Transformation',
  'Request Interceptors',
  'Response Interceptors',
  'Error Handling',
  'File Upload',
  'File Download',
  'Custom Instances & Defaults',
  'Real-World Patterns',
];

test.describe('App load with axios 1.20.0', () => {
  test('R1b: frontend renders header and sidebar without console or page errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('TestAxios | Axios HTTP Client Test Application');
    await expect(page.locator('.sidebar .menu-item')).toHaveText(SIDEBAR_ITEMS);
    // The default scenario mounts and imports axios.
    await expect(page.locator('.test-section-title')).toHaveText('GET Requests');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('R1b: Vite serves the optimized axios 1.20.0 browser build without Node-only deps', async ({ request }) => {
    const res = await request.get('/node_modules/.vite/deps/axios.js');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('VERSION = "1.20.0"');
    expect(body).not.toMatch(/https-proxy-agent|proxy-from-env|follow-redirects/);
  });
});
