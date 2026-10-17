import { statSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { API_URL, openScenario } from '../support/app';

// Progress text is only on screen while a transfer runs, so record the highest
// "<n>%" value the page ever renders.
async function trackMaxProgress(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __maxProgress: number };
    w.__maxProgress = -1;
    new MutationObserver(() => {
      for (const m of (document.body?.innerText ?? '').matchAll(/(\d+)%/g)) {
        w.__maxProgress = Math.max(w.__maxProgress, Number(m[1]));
      }
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
}
// On localhost a transfer completes inside one React batch, so the progress UI never
// paints. Throttle the network so progress events and completion land in separate renders.
async function throttleNetwork(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 50,
    downloadThroughput: 100 * 1024,
    uploadThroughput: 200 * 1024,
  });
}
const maxProgress = (page: Page) =>
  page.evaluate(() => (window as unknown as { __maxProgress: number }).__maxProgress);

// Records every percentage axios hands to the component's progress callback, by wrapping
// the callback in a request interceptor on the app's own axios module instance.
type ProgressKey = 'onUploadProgress' | 'onDownloadProgress';
async function recordProgressCallbacks(page: Page, key: ProgressKey) {
  await page.evaluate(async (key) => {
    const url = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .find((n) => n.includes('/node_modules/.vite/deps/axios.js'));
    if (!url) throw new Error('app axios module not loaded');
    const { default: axios } = await import(/* @vite-ignore */ url);
    const w = window as unknown as { __callbackProgress: number[] };
    w.__callbackProgress = [];
    axios.interceptors.request.use((config: Record<string, unknown>) => {
      const original = config[key] as ((e: { loaded: number; total?: number }) => void) | undefined;
      if (original) {
        config[key] = (e: { loaded: number; total?: number }) => {
          if (e.total) w.__callbackProgress.push(Math.round((e.loaded * 100) / e.total));
          original(e);
        };
      }
      return config;
    });
  }, key);
}
const callbackProgress = (page: Page) =>
  page.evaluate(() => (window as unknown as { __callbackProgress: number[] }).__callbackProgress);

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await trackMaxProgress(page);
    await openScenario(page, 'file-upload', 'File Upload');
  });

  test('R2k: single multipart upload sends a boundary, reports progress and returns the file', async ({ page }) => {
    await throttleNetwork(page);
    await recordProgressCallbacks(page, 'onUploadProgress');
    await page.getByTestId('file-input').setInputFiles({
      name: 'probe.bin',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(204800, 1),
    });

    const [res] = await Promise.all([
      page.waitForResponse(`${API_URL}/api/upload`),
      page.getByTestId('upload-single').click(),
    ]);
    expect((await res.request().allHeaders())['content-type']).toMatch(/multipart\/form-data; boundary=/);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ filename: 'probe.bin', size: 204800 });

    await expect(page.getByTestId('upload-single')).toBeEnabled();
    await expect(page.getByText('✗ Upload failed')).toHaveCount(0);
    expect(await maxProgress(page)).toBe(100);
    expect(Math.max(...(await callbackProgress(page)))).toBe(100);
  });

  test('R2k: multiple-file upload sends both files', async ({ page }) => {
    await page.getByTestId('multiple-mode').click();
    await page.getByTestId('multiple-file-input').setInputFiles([
      { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('first file') },
      { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('second file') },
    ]);

    const [res] = await Promise.all([
      page.waitForResponse(`${API_URL}/api/upload/multiple`),
      page.getByTestId('upload-multiple').click(),
    ]);
    expect((await res.request().allHeaders())['content-type']).toMatch(/multipart\/form-data; boundary=/);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.files.map((f: { filename: string }) => f.filename)).toEqual(['a.txt', 'b.txt']);
    await expect(page.getByText('✓ 2 File(s) Uploaded Successfully')).toBeVisible();
  });
});

test.describe('File Download', () => {
  test('R2l: blob download reports progress and triggers a browser download', async ({ page }, testInfo) => {
    await trackMaxProgress(page);
    await openScenario(page, 'file-download', 'File Download');
    const filename = await page.getByTestId('file-select').inputValue();
    await expect(page.getByTestId('response-type-blob')).toBeChecked();
    await throttleNetwork(page);
    await recordProgressCallbacks(page, 'onDownloadProgress');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-button').click(),
    ]);
    expect(download.suggestedFilename()).toBe(filename);
    const saved = testInfo.outputPath(filename);
    await download.saveAs(saved);
    expect(statSync(saved).size).toBe(102400);

    await expect(page.getByText('✓ Download completed successfully!')).toBeVisible();
    // The progress bar rendered while downloading, and the callback received 100%.
    // (The final 100% event and completion share one React render, so it is never painted.)
    expect(await maxProgress(page)).toBeGreaterThan(0);
    expect(Math.max(...(await callbackProgress(page)))).toBe(100);
  });
});
