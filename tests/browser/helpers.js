import { readFile } from 'node:fs/promises';
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

let curriculum;

async function routeHeading(hash) {
  curriculum ??= JSON.parse(await readFile(new URL('../../dist/curriculum.json', import.meta.url), 'utf8'));
  const [name, id] = hash.replace(/^#/, '').split('/');
  if (name === 'course') return curriculum.courses.find(course => course.id === id)?.title;
  if (name === 'lesson') {
    const [course, lesson] = id.split('.');
    return curriculum.courses.find(item => item.id === course)?.lessons.find(item => item.id === lesson)?.title;
  }
  return {
    home: 'A life well studied.', planner: 'Your study planner', courses: 'Faculties & courses',
    portfolio: 'Evidence portfolio', settings: 'Data and settings', tutor: 'Tutor studio',
    library: 'Reading library', frameworks: 'Framework library',
  }[name];
}

export async function openRoute(page, hash) {
  const heading = await routeHeading(hash);
  expect(heading, `Known heading for test route ${hash}`).toBeTruthy();
  await page.goto(`/${hash}`);
  // Hash navigation can resolve before rendering. Match this route, not the old h1.
  await expect(page.locator('main h1')).toHaveText(heading);
  await expect(page).toHaveTitle(`${heading} · Ultimo`);
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
  // Seed once in this tab; later reloads must exercise the app's real persistence.
  const marker = `ultimo.test.seeded.${crypto.randomUUID()}`;
  await page.addInitScript(({ key, record, marker }) => {
    if (sessionStorage.getItem(marker)) return;
    localStorage.setItem(key, JSON.stringify(record));
    sessionStorage.setItem(marker, 'true');
  }, {key: learnerKey, record, marker});
}

export async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function importRecord(page, record) {
  page.once('dialog', dialog => dialog.accept());
  await tabTo(page, page.locator('#importData'));
  await page.locator('#importData').setInputFiles({
    name: 'synthetic-learner-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(record)),
  });
  await expect(page.locator('#importData')).toHaveValue('');
  await expect(page.locator('#importResult')).toContainText('Backup restored.');
}

export async function preventModelRequests(page) {
  await page.route('**/api/tutor/status', route => route.fulfill({ status: 404, body: 'Static test site' }));
  await page.route('**/api/tutor', route => route.abort());
}
