import { expect } from '@playwright/test';

export const learnerKey = 'ultimo.learner.v1';

export function learnerRecord(overrides = {}) {
  return {
    version: 1,
    completed: {},
    reviews: {},
    quizzes: {},
    evidence: [],
    hours: 5,
    last: null,
    studyPlan: 'foundation',
    ...overrides,
  };
}

export async function openRoute(page, hash) {
  await page.goto(`/${hash}`);
  await expect(page.locator('main h1')).toBeVisible();
}

// Use actual keyboard navigation. A missing or unreachable target fails with its name.
export async function tabTo(page, target, maximumTabs = 160) {
  await expect(target).toHaveCount(1);
  for (let count = 0; count < maximumTabs; count++) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not reach ${await target.evaluate(element => element.outerHTML)} with Tab`);
}

export async function activateWithKeyboard(page, target) {
  await tabTo(page, target);
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
}

export async function storedRecord(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), learnerKey);
}

export async function seedRecord(page, record) {
  await page.addInitScript(({ key, record }) => localStorage.setItem(key, JSON.stringify(record)), {
    key: learnerKey,
    record,
  });
}

export async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function importRecord(page, record) {
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importData').setInputFiles({
    name: 'synthetic-learner-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(record)),
  });
  await expect(page.locator('#importResult')).toContainText('Backup restored.');
}

export async function preventModelRequests(page) {
  await page.route('**/api/tutor/status', route => route.fulfill({ status: 404, body: 'Static test site' }));
  await page.route('**/api/tutor', route => route.abort());
}
