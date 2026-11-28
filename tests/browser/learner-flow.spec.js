import { test, expect } from '@playwright/test';
import {
  activateWithKeyboard, importRecord, learnerKey, learnerRecord, openRoute,
  preventModelRequests, readDownload, seedRecord, storedRecord, tabTo,
} from './helpers.js';

test.beforeEach(async ({ page }) => {
  await preventModelRequests(page);
});

test('a learner can find, self-check and mark a lesson read using the keyboard', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openRoute(page, '#home');
  await activateWithKeyboard(page, page.getByRole('link', { name: 'Skip to content', exact: true }));
  await expect(page.locator('main')).toBeFocused();
  await activateWithKeyboard(page, page.getByRole('navigation').getByRole('link', { name: 'Faculties & courses', exact: true }));
  await expect(page.locator('main')).toBeFocused();
  const search = page.getByRole('searchbox', { name: 'Search courses', exact: true });
  await tabTo(page, search);
  await page.keyboard.type('Learning how to learn');
  await expect(page.locator('#result-count')).toHaveText('1 courses');
  await activateWithKeyboard(page, page.locator('#results a[href="#course/INT-101"]'));
  await expect(page.locator('main')).toBeFocused();
  await activateWithKeyboard(page, page.locator('a[href="#lesson/INT-101.L01"]'));
  await expect(page.locator('main')).toBeFocused();
  const items = page.locator('#quiz .quiz-item');
  const total = await items.count();
  expect(total).toBeGreaterThan(0);
  for (let index = 0; index < total; index++) {
    const item = items.nth(index);
    const answer = item.getByRole('textbox');
    await tabTo(page, answer);
    await page.keyboard.type('Fictional practice answer for a learning demonstration.');
    await activateWithKeyboard(page, item.locator('summary'));
    await expect(item.locator('.answer')).toBeVisible();
    const selfMark = item.getByRole('checkbox', { name: 'My answer matched the essential idea' });
    await tabTo(page, selfMark);
    await page.keyboard.press('Space');
    await expect(selfMark).toBeChecked();
  }
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Save self-check', exact: true }));
  await expect(page.locator('#quizResult')).toContainText(`Saved self-check: ${total} / ${total}`);
  await expect(page.locator('#saveQuiz')).toBeFocused();
  const savedQuiz = await storedRecord(page);
  expect(savedQuiz.quizzes['INT-101.L01']).toMatchObject({ correct: total, total });
  expect(JSON.stringify(savedQuiz)).not.toContain('Fictional practice answer');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Mark lesson read', exact: true }));
  await expect(page.locator('#completionState')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Already marked read', exact: true })).toBeDisabled();
  const marked = await storedRecord(page);
  expect(marked.completed['INT-101.L01']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(marked.reviews['INT-101.L01']).toMatchObject({ step: 0 });
  expect(marked.reviews['INT-101.L01'].due > marked.completed['INT-101.L01']).toBe(true);
  await page.reload();
  await expect(page.locator('#quizResult')).toContainText(`Previous self-check: ${total} / ${total}`);
  await expect(page.getByRole('button', { name: 'Already marked read', exact: true })).toBeDisabled();
  await expect(page.locator('#attempt0')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('due review, evidence and backup journeys preserve records and keyboard focus', async ({ page }) => {
  const record = learnerRecord({
    completed: { 'INT-101.L01': '2000-01-01' },
    reviews: { 'INT-101.L01': { due: '2000-01-02', step: 0 } },
    quizzes: { 'INT-101.L01': { date: '2000-01-01', correct: 2, total: 3 } },
    last: 'INT-101.L01',
    studyPlan: 'faculty:MEN',
  });
  // Synthetic dates make this review due without clock-dependent waits.
  await seedRecord(page, record);
  await openRoute(page, '#planner');
  const reviewSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'All due reviews', exact: true }) });
  await activateWithKeyboard(page, reviewSection.getByRole('link', { name: 'Review lesson', exact: true }));
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Complete due review', exact: true }));
  await expect(page.locator('#completionState')).toBeFocused();
  let saved = await storedRecord(page);
  expect(saved.reviews['INT-101.L01'].step).toBe(1);
  expect(saved.reviews['INT-101.L01'].due > '2000-01-02').toBe(true);
  await activateWithKeyboard(page, page.getByRole('link', { name: 'Add practice evidence', exact: true }));
  await expect(page.locator('#eCourse')).toHaveValue('INT-101');
  const note = 'Fictional learner tested a retrieval plan, compared the result and revised the next attempt.';
  await tabTo(page, page.getByRole('textbox', { name: 'Practice evidence (max 4,000 characters)' }));
  await page.keyboard.type(note);
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Save practice note', exact: true }));
  await expect(page.locator('#eNote')).toBeFocused();
  await expect(page.locator('.evidence-row')).toContainText(note);
  await activateWithKeyboard(page, page.getByRole('navigation').getByRole('link', { name: 'Data & settings', exact: true }));
  const downloadEvent = page.waitForEvent('download');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Download JSON backup', exact: true }));
  const backup = await readDownload(await downloadEvent);
  expect(backup.studyPlan).toBe('faculty:MEN');
  expect(backup.evidence).toHaveLength(1);
  expect(backup.evidence[0]).toMatchObject({ course: 'INT-101', note });
  expect(backup.reviews['INT-101.L01'].step).toBe(1);
  page.once('dialog', dialog => dialog.accept());
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Erase all local data', exact: true }));
  await expect(page.locator('#erase')).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), learnerKey)).toBeNull();
  // Browser file selection is supplied directly; the user confirmation remains real.
  await importRecord(page, backup);
  await expect(page.locator('#importData')).toBeFocused();
  saved = await storedRecord(page);
  expect(saved).toEqual(backup);
  await activateWithKeyboard(page, page.getByRole('navigation').getByRole('link', { name: 'Evidence portfolio', exact: true }));
  await expect(page.locator('.evidence-row')).toContainText(note);
  page.once('dialog', dialog => dialog.accept());
  await activateWithKeyboard(page, page.getByRole('button', { name: /^Delete note for Learning how to learn/ }));
  await expect(page.locator('#eNote')).toBeFocused();
  await expect(page.getByText('No practice notes recorded yet.', { exact: true })).toBeVisible();
  expect((await storedRecord(page)).evidence).toEqual([]);
});

test('tutor controls retain keyboard focus after replacing their content', async ({ page }) => {
  await openRoute(page, '#tutor/INT-101.L01');
  const role = page.getByRole('combobox', { name: 'Tutor role', exact: true });
  await tabTo(page, role);
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('combobox', { name: 'Tutor role', exact: true })).toHaveValue('socratic');
  await expect(page.getByRole('combobox', { name: 'Tutor role', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('combobox', { name: 'Tutor role', exact: true })).toHaveValue('examiner');
  await expect(page.getByRole('combobox', { name: 'Tutor role', exact: true })).toBeFocused();
  const practiceAttempt = page.getByRole('textbox', { name: 'Your attempt (not stored)', exact: true });
  await tabTo(page, practiceAttempt);
  await page.keyboard.type('An original fictional attempt.');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Next question', exact: true }));
  await expect(practiceAttempt).toBeFocused();
  await expect(practiceAttempt).toHaveValue('');
  await expect(page.getByRole('heading', { name: /Practice question 2/ })).toBeVisible();
});

test('validation errors identify their fields and preserve existing learner records', async ({ page }) => {
  await openRoute(page, '#planner');
  await tabTo(page, page.locator('#studyPlan'));
  await page.keyboard.press('m');
  await expect(page.locator('#studyPlan')).toHaveValue('faculty:MEN');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Update study plan', exact: true }));
  await expect(page.locator('#savePlan')).toBeFocused();
  expect((await storedRecord(page)).studyPlan).toBe('faculty:MEN');
  await page.locator('#hours').fill('0');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Update study plan', exact: true }));
  await expect(page.locator('#hours')).toBeFocused();
  await expect(page.locator('#hours')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#hours')).toHaveAccessibleDescription(/Enter a whole number from 1 to 20/);
  await page.locator('#hours').fill('6');
  await expect(page.locator('#hours')).not.toHaveAttribute('aria-invalid', 'true');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Update study plan', exact: true }));
  await expect(page.locator('#savePlan')).toBeFocused();
  expect((await storedRecord(page)).hours).toBe(6);
  await openRoute(page, '#lesson/INT-101.L01');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Save self-check', exact: true }));
  await expect(page.locator('#quizResult')).toHaveText('Reveal and compare every answer before saving.');
  await expect(page.locator('#quiz summary').first()).toBeFocused();
  expect((await storedRecord(page)).quizzes).toEqual({});
  await openRoute(page, '#portfolio/INT-101');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Save practice note', exact: true }));
  await expect(page.locator('#eNote')).toBeFocused();
  await expect(page.locator('#eNote')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#eNote')).toHaveAccessibleDescription(/Enter a brief practice note/);
  expect((await storedRecord(page)).evidence).toEqual([]);
  await openRoute(page, '#settings');
  const before = await storedRecord(page);
  await page.locator('#importData').setInputFiles({
    name: 'invalid-synthetic-backup.json', mimeType: 'application/json', buffer: Buffer.from('{invalid-json'),
  });
  await expect(page.locator('#importData')).toBeFocused();
  await expect(page.locator('#importData')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#importData')).toHaveAccessibleDescription(/Import failed:/);
  expect(await storedRecord(page)).toEqual(before);
  await page.locator('#importData').setInputFiles({
    name: 'oversized-synthetic-backup.json', mimeType: 'application/json', buffer: Buffer.alloc(5 * 1024 * 1024 + 1, ' '),
  });
  await expect(page.locator('#importData')).toBeFocused();
  await expect(page.locator('#importResult')).toHaveText('Import failed: Backup exceeds 5 MB.');
  await expect(page.locator('#importData')).toHaveAccessibleDescription(/Backup exceeds 5 MB/);
  expect(await storedRecord(page)).toEqual(before);
});

test('cancelling destructive confirmations retains data and the original focused control', async ({ page }) => {
  const original = learnerRecord({
    completed: { 'INT-101.L01': '2000-01-01' },
    evidence: [{ id: 'fictional-keep', course: 'INT-101', date: '2000-01-01', note: 'A fictional note to retain after cancelled deletion.' }],
    studyPlan: 'faculty:MEN',
  });
  await seedRecord(page, original);
  await openRoute(page, '#portfolio/INT-101');
  const unchanged = await storedRecord(page);
  for (const field of ['completed', 'reviews', 'quizzes', 'evidence']) expect(unchanged[field]).toEqual(original[field]);
  const deleteNote = page.getByRole('button', { name: /^Delete note for Learning how to learn/ });
  page.once('dialog', dialog => dialog.dismiss());
  await activateWithKeyboard(page, deleteNote);
  await expect(deleteNote).toBeFocused();
  await expect(page.locator('.evidence-row')).toContainText(original.evidence[0].note);
  expect(await storedRecord(page)).toEqual(unchanged);
  await activateWithKeyboard(page, page.getByRole('navigation').getByRole('link', { name: 'Data & settings', exact: true }));
  page.once('dialog', dialog => dialog.dismiss());
  await activateWithKeyboard(page, page.locator('#erase'));
  await expect(page.locator('#erase')).toBeFocused();
  expect(await storedRecord(page)).toEqual(unchanged);
  await tabTo(page, page.locator('#importData'));
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#importData').setInputFiles({
    name: 'replacement-synthetic-backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(learnerRecord({ studyPlan: 'all' }))),
  });
  await expect(page.locator('#importData')).toBeFocused();
  await expect(page.locator('#importData')).toHaveValue('');
  expect(await storedRecord(page)).toEqual(unchanged);
});

test('tutor guidance, clearing and lesson selection preserve the keyboard context and route', async ({ page }) => {
  await openRoute(page, '#tutor/INT-101.L01');
  await tabTo(page, page.locator('#tutorQuery'));
  await page.keyboard.type('retrieval');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Find guidance', exact: true }));
  await expect(page.locator('#guidanceResult')).toBeFocused();
  await expect(page.locator('#guidanceResult')).toContainText('Relevant passages from the selected lesson');
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Clear conversation', exact: true }));
  await expect(page.locator('#tutorQuery')).toBeFocused();
  await tabTo(page, page.getByRole('combobox', { name: 'Lesson', exact: true }));
  await page.keyboard.press('End');
  const selected = await page.getByRole('combobox', { name: 'Lesson', exact: true }).inputValue();
  expect(selected).not.toBe('INT-101.L01');
  await expect(page.getByRole('combobox', { name: 'Lesson', exact: true })).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`#tutor/${selected.replace('.', '\\.')}$`));
  await expect(page.getByRole('link', { name: 'Read original lesson', exact: true })).toHaveAttribute('href', `#lesson/${selected}`);
});

test('route titles and skip navigation survive reload, and Escape returns mobile menu focus', async ({ page }) => {
  await openRoute(page, '#courses');
  await expect(page).toHaveTitle('Faculties & courses · Ultimo');
  await activateWithKeyboard(page, page.getByRole('link', { name: 'Skip to content', exact: true }));
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/#courses$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Faculties & courses', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#courses$/);
  await activateWithKeyboard(page, page.getByRole('navigation').getByRole('link', { name: 'Study planner', exact: true }));
  await expect(page).toHaveTitle('Your study planner · Ultimo');
  await expect(page.locator('main')).toBeFocused();
  await page.setViewportSize({ width: 320, height: 900 });
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Menu', exact: true }));
  await expect(page.locator('#menu')).toHaveAttribute('aria-expanded', 'true');
  await tabTo(page, page.getByRole('navigation').getByRole('link', { name: 'Overview', exact: true }));
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu')).toBeFocused();
  await expect(page.getByRole('navigation')).toBeHidden();
});
