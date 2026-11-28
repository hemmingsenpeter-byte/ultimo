import {readFile} from 'node:fs/promises';
import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  activateWithKeyboard, importRecord, learnerKey, learnerRecord, openRoute, preventModelRequests, seedRecord,
  readDownload, readDownloadText, storedRecord, tabTo,
} from './helpers.js';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const firstNote = 'Fictional practice: explained why closed-note retrieval differs from recognising a shown answer.';
const secondNote = 'Fictional reassessment: applied the criterion to a new study example and identified a remaining limitation.';

async function createPortfolio(page, {keyboard = false} = {}) {
  await openRoute(page, '#portfolio/INT-101.L01');
  await expect(page.locator('#pCourse')).toHaveValue('INT-101');
  await expect(page.locator('#pLesson')).toHaveValue('INT-101.L01');
  const curriculum = JSON.parse(await readFile(new URL('../../dist/curriculum.json', import.meta.url), 'utf8'));
  const lesson = curriculum.courses.find(course => course.id === 'INT-101').lessons.find(item => item.id === 'L01');
  await expect(page.locator('#pCriterion')).toContainText(lesson.evidence_rubric.criterion);
  if (keyboard) {
    await tabTo(page, page.locator('#pNote'));
    await page.keyboard.type(firstNote);
    await tabTo(page, page.locator('#pJudgement'));
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#pJudgement')).toHaveValue('developing');
  } else {
    await page.locator('#pNote').fill(firstNote);
    await page.locator('#pJudgement').selectOption('developing');
  }
  await page.locator('#pReview').fill('2026-11-29');
  if (keyboard) await activateWithKeyboard(page, page.locator('#savePortfolio'));
  else await page.locator('#savePortfolio').click();
  await expect(page.locator('#portfolioStatus')).toBeFocused();
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  const state = await storedRecord(page);
  expect(state.version).toBe(2);
  expect(state.portfolios).toHaveLength(1);
  const record = state.portfolios[0];
  await expect(page).toHaveURL(new RegExp(`#portfolio/${record.id}$`));
  expect(record).toMatchObject({course: 'INT-101', lesson: 'L01', competency: 'INT-101.L01'});
  expect(record.attempts).toHaveLength(1);
  expect(record.attempts[0]).toMatchObject({
    date: '2026-11-28', note: firstNote, judgement: 'developing', reassessOn: '2026-11-29',
    rubric: lesson.evidence_rubric,
  });
  expect(record.attempts[0].rubric.version).toMatch(/^sha256:[a-f0-9]{64}$/);
  expect(state.completed).toEqual({});
  expect(state.quizzes).toEqual({});
  return record;
}

test.beforeEach(async ({page}) => {
  await preventModelRequests(page);
  // Freeze Date only; timers and keyboard interaction retain normal browser behaviour.
  await page.clock.setFixedTime(new Date('2026-11-28T12:00:00Z'));
});

test('criterion evidence is self-assessed, due globally and reassessed through immutable history', async ({page}) => {
  const record = await createPortfolio(page, {keyboard: true});
  const firstAttempt = structuredClone(record.attempts[0]);
  await page.clock.setFixedTime(new Date('2026-11-30T12:00:00Z'));
  await openRoute(page, '#home');
  await expect(page.locator(`.portfolio-due a[href="#portfolio/${record.id}"]`)).toHaveCount(1);
  await openRoute(page, '#planner');
  await page.locator('#studyPlan').selectOption('faculty:EMO');
  await page.locator('#hours').fill('1');
  await page.locator('#savePlan').click();
  await expect(page.locator(`.portfolio-due a[href="#portfolio/${record.id}"]`)).toHaveCount(1);
  await expect(page.locator(`#studyQueue a[href="#portfolio/${record.id}"]`)).toHaveCount(0);
  await activateWithKeyboard(page, page.locator(`.portfolio-due a[href="#portfolio/${record.id}"]`));
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  await activateWithKeyboard(page, page.locator('#newAttempt'));
  await expect(page.locator('#pNote')).toBeFocused();
  await expect(page.locator('#pCourse')).toBeDisabled();
  await expect(page.locator('#pLesson')).toBeDisabled();
  await expect(page.locator('#pNote')).toHaveValue('');
  await page.keyboard.type(secondNote);
  await page.locator('#pJudgement').selectOption('meets');
  await page.locator('#pReview').fill('2026-12-02');
  await activateWithKeyboard(page, page.locator('#savePortfolio'));
  await expect(page.locator('#portfolioStatus')).toBeFocused();
  const updated = (await storedRecord(page)).portfolios[0];
  expect(updated.id).toBe(record.id);
  expect(updated.attempts).toHaveLength(2);
  expect(updated.attempts[0]).toEqual(firstAttempt);
  expect(updated.attempts[1]).toMatchObject({date: '2026-11-30', note: secondNote, judgement: 'meets', reassessOn: '2026-12-02'});
  expect(updated.attempts[1].id).not.toBe(firstAttempt.id);
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  await expect(page.locator('#attemptHistory')).toContainText(secondNote);
  await expect(page.locator('#attemptHistory')).toContainText('self-assessed');
  await page.reload();
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  await expect(page.locator('#attemptHistory')).toContainText(secondNote);
  for (const route of ['#home', '#planner']) {
    await openRoute(page, route);
    await expect(page.locator(`.portfolio-due a[href="#portfolio/${record.id}"]`)).toHaveCount(0);
  }
  const final = await storedRecord(page);
  expect(final.completed).toEqual({});
  expect(final.quizzes).toEqual({});
});

test('portfolio backup restoration preserves snapshots and rejects malformed replacements atomically', async ({page}) => {
  const record = await createPortfolio(page);
  await openRoute(page, '#settings');
  const downloadEvent = page.waitForEvent('download');
  await activateWithKeyboard(page, page.locator('#exportData'));
  const backup = await readDownload(await downloadEvent);
  expect(backup.version).toBe(2);
  expect(backup.portfolios).toEqual([record]);
  page.once('dialog', dialog => dialog.accept());
  await activateWithKeyboard(page, page.locator('#erase'));
  expect(await page.evaluate(key => localStorage.getItem(key), learnerKey)).toBeNull();
  await importRecord(page, backup);
  expect(await storedRecord(page)).toEqual(backup);
  for (const portfolios of [[{id: 'malformed'}], [record, structuredClone(record)], [{...record, competency: 'INT-999.L01'}]]) {
    await page.locator('#importData').setInputFiles({
      name: 'invalid-criterion-backup.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({...backup, portfolios})),
    });
    await expect(page.locator('#importData')).toHaveValue('');
    await expect(page.locator('#importResult')).toContainText('Import failed:');
    await expect(page.locator('#importData')).toBeFocused();
    expect(await storedRecord(page)).toEqual(backup);
  }
  await openRoute(page, `#portfolio/${record.id}`);
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  page.once('dialog', dialog => dialog.dismiss());
  await activateWithKeyboard(page, page.locator('#deletePortfolio'));
  await expect(page.locator('#deletePortfolio')).toBeFocused();
  expect((await storedRecord(page)).portfolios).toEqual([record]);
  page.once('dialog', dialog => dialog.accept());
  await activateWithKeyboard(page, page.locator('#deletePortfolio'));
  await expect(page.locator('#pNote')).toBeFocused();
  expect((await storedRecord(page)).portfolios).toEqual([]);
  await expect(page.locator('#attemptHistory')).toHaveCount(0);
});

test('new evidence forms expose errors and save selected criteria with an optional follow-up', async ({page}) => {
  await openRoute(page, '#portfolio/INT-101.L01');
  await activateWithKeyboard(page, page.locator('#savePortfolio'));
  await expect(page.locator('#pNote')).toBeFocused();
  await expect(page.locator('#pNote')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#pNote')).toHaveAccessibleDescription(/evidence|note|describe/i);
  await page.locator('#pNote').fill(firstNote);
  await page.locator('#pReview').fill('2026-11-27');
  await activateWithKeyboard(page, page.locator('#savePortfolio'));
  await expect(page.locator('#pReview')).toBeFocused();
  await expect(page.locator('#pReview')).toHaveAttribute('aria-invalid', 'true');
  expect((await storedRecord(page))?.portfolios ?? []).toEqual([]);
  await page.locator('#pReview').fill('');
  await expect(page.locator('#pReview')).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#pLesson').selectOption('INT-101.L02');
  const curriculum = JSON.parse(await readFile(new URL('../../dist/curriculum.json', import.meta.url), 'utf8'));
  const selected = curriculum.courses.find(course => course.id === 'INT-101').lessons.find(lesson => lesson.id === 'L02');
  await expect(page.locator('#pCriterion')).toContainText(selected.evidence_rubric.criterion);
  await activateWithKeyboard(page, page.locator('#savePortfolio'));
  await expect(page.locator('#portfolioStatus')).toBeFocused();
  const record = (await storedRecord(page)).portfolios[0];
  expect(record).toMatchObject({course: 'INT-101', lesson: 'L02', competency: 'INT-101.L02'});
  expect(record.attempts[0]).toMatchObject({judgement: 'not_yet', reassessOn: null, rubric: selected.evidence_rubric});
});

test('criterion forms and expanded history remain accessible on mobile and at 200% text', async ({page}, testInfo) => {
  const record = await createPortfolio(page);
  await page.locator('#newAttempt').click();
  await expect(page.locator('#attemptComposer')).toBeVisible();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({width, height: 900});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    for (const selector of ['#pCourse', '#pLesson', '#pNote', '#pJudgement', '#pReview', '#savePortfolio']) {
      const bounds = await page.locator(selector).boundingBox();
      expect(bounds.width, selector).toBeGreaterThan(0);
      expect(bounds.x, selector).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width, selector).toBeLessThanOrEqual(width + 1);
    }
  }
  const results = await new AxeBuilder({page}).withTags(tags).analyze();
  if (results.violations.length) await testInfo.attach('criterion-portfolio-axe', {body: JSON.stringify(results.violations, null, 2), contentType: 'application/json'});
  expect(results.violations.map(item => ({id: item.id, targets: item.nodes.map(node => node.target)}))).toEqual([]);
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll('body, body *')].map(element => [element, getComputedStyle(element).fontSize]);
    for (const [element, size] of sizes) element.style.fontSize = `${parseFloat(size) * 2}px`;
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.locator('#pNote')).toBeVisible();
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  expect((await storedRecord(page)).portfolios[0]).toEqual(record);
});

test('criterion notes are excluded from a separately consented mocked tutor request', async ({page}) => {
  await createPortfolio(page);
  let capture;
  const requested = new Promise(resolve => {capture = resolve;});
  await page.route('**/api/tutor/status', route => route.fulfill({json: {enabled: true, provider: 'ollama', csrf: 'fictional-test-token'}}));
  await page.route('**/api/tutor', route => {
    capture(route.request().postDataJSON());
    return route.fulfill({json: {answer: 'A fictional curriculum-only reply.', citations: {cited: [], unknown: []}}});
  });
  await openRoute(page, '#tutor/INT-101.L01');
  await expect(page.locator('#askModel')).toBeEnabled();
  await page.locator('#tutorQuery').fill('Explain retrieval using a fictional study example.');
  await page.locator('#providerConsent').check();
  await page.locator('#askModel').click();
  const payload = await requested;
  expect(payload).toMatchObject({lesson: 'INT-101.L01', consent: true, question: 'Explain retrieval using a fictional study example.'});
  expect(JSON.stringify(payload)).not.toContain(firstNote);
  expect(payload).not.toHaveProperty('portfolios');
  expect(payload).not.toHaveProperty('evidence');
  await expect(page.locator('#tutorConversation')).toContainText('A fictional curriculum-only reply.');
});


test('unreadable or future local records survive session writes and can be recovered exactly', async ({page}) => {
  await createPortfolio(page);
  const backup = await storedRecord(page);
  for (const original of ['  ' + JSON.stringify({...backup, version: 99}) + '\n', '{fictional-unreadable-json', JSON.stringify({...backup, portfolios: [{id: 'malformed'}]})]) {
    await page.evaluate(({key, original}) => localStorage.setItem(key, original), {key: learnerKey, original});
    await page.reload();
    await expect(page.locator('main')).toContainText('The original is protected in browser storage.');
    await openRoute(page, '#lesson/INT-101.L01');
    expect(await page.evaluate(key => localStorage.getItem(key), learnerKey)).toBe(original);
    await openRoute(page, '#portfolio/INT-101.L01');
    await page.locator('#pNote').fill('Fictional session-only attempt that must not overwrite protected original records.');
    await page.locator('#savePortfolio').click();
    await expect(page.locator('#portfolioStatus')).toContainText('session only');
    expect(await page.evaluate(key => localStorage.getItem(key), learnerKey)).toBe(original);
    await openRoute(page, '#settings');
    const downloadEvent = page.waitForEvent('download');
    await activateWithKeyboard(page, page.locator('#exportOriginalData'));
    expect(await readDownloadText(await downloadEvent)).toBe(original);
    expect(await page.evaluate(key => localStorage.getItem(key), learnerKey)).toBe(original);
    await importRecord(page, backup);
    expect(await storedRecord(page)).toEqual(backup);
    await expect(page.locator('#exportOriginalData')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('The original is protected in browser storage.');
  }
});


test('a migrated v1 course note stays unlinked until explicitly reused and saved', async ({page}) => {
  const note = {id: 'fictional-legacy-note', course: 'MEN-102', date: '2000-01-01', note: 'Fictional course note retained while choosing a competency and my own judgement.'};
  await seedRecord(page, learnerRecord({evidence: [note]}));
  await openRoute(page, '#portfolio');
  const migrated = await storedRecord(page);
  expect(migrated.version).toBe(2);
  expect(migrated.evidence).toEqual([note]);
  expect(migrated.portfolios).toEqual([]);
  await activateWithKeyboard(page, page.locator('[data-reuse-evidence="0"]'));
  await expect(page.locator('#pCourse')).toHaveValue('MEN-102');
  await expect(page.locator('#pLesson')).toBeFocused();
  await expect(page.locator('#pNote')).toHaveValue(note.note);
  await expect(page.locator('#pJudgement')).toHaveValue('not_yet');
  expect((await storedRecord(page)).portfolios).toEqual([]);
  expect((await storedRecord(page)).evidence).toEqual([note]);
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#pLesson')).toHaveValue('MEN-102.L02');
  await page.locator('#pJudgement').selectOption('developing');
  await page.locator('#pReview').fill('');
  await activateWithKeyboard(page, page.locator('#savePortfolio'));
  await expect(page.locator('#portfolioStatus')).toBeFocused();
  const saved = await storedRecord(page);
  expect(saved.evidence).toEqual([note]);
  expect(saved.portfolios).toHaveLength(1);
  expect(saved.portfolios[0]).toMatchObject({course: 'MEN-102', lesson: 'L02', competency: 'MEN-102.L02'});
  expect(saved.portfolios[0].attempts).toHaveLength(1);
  expect(saved.portfolios[0].attempts[0]).toMatchObject({note: note.note, judgement: 'developing', reassessOn: null, date: '2026-11-28'});
  expect(saved.completed).toEqual({});
  expect(saved.quizzes).toEqual({});
});

test('a revised curriculum rubric applies only to new reassessment attempts', async ({page}) => {
  const original = await createPortfolio(page);
  const originalBytes = JSON.stringify(original.attempts[0]);
  const curriculum = JSON.parse(await readFile(new URL('../../dist/curriculum.json', import.meta.url), 'utf8'));
  const lesson = curriculum.courses.find(course => course.id === 'INT-101').lessons.find(item => item.id === 'L01');
  const revised = {
    version: 'sha256:' + 'b'.repeat(64),
    criterion: 'Fictional revised criterion: explain and compare two novel learning examples, stating one limitation.',
    levels: lesson.evidence_rubric.levels.map((level, index) => `Fictional revision ${index}: ${level}`),
  };
  lesson.evidence_rubric = revised;
  await page.route('**/curriculum.json', route => route.fulfill({json: curriculum}));
  await page.reload();
  await expect(page.locator('#attemptHistory')).toContainText(firstNote);
  await page.locator('#attemptHistory summary').first().click();
  await expect(page.locator('#attemptHistory').getByText(original.attempts[0].rubric.criterion, {exact: true})).toBeVisible();
  await expect(page.locator('#attemptHistory')).toContainText('The current rubric differs. This earlier attempt retains its saved criteria.');
  await expect(page.locator('#attemptHistory code')).toHaveAttribute('title', original.attempts[0].rubric.version);
  expect(JSON.stringify((await storedRecord(page)).portfolios[0].attempts[0])).toBe(originalBytes);
  await page.clock.setFixedTime(new Date('2026-11-30T12:00:00Z'));
  await activateWithKeyboard(page, page.locator('#newAttempt'));
  await expect(page.locator('#pNote')).toBeFocused();
  await expect(page.locator('#pCriterion')).toContainText(revised.criterion);
  await page.locator('#pCriterion summary').click();
  await expect(page.locator('#pCriterion code')).toHaveAttribute('title', revised.version);
  for (const level of revised.levels) await expect(page.locator('#pCriterion')).toContainText(level);
  await page.locator('#pNote').fill(secondNote);
  await page.locator('#pJudgement').selectOption('meets');
  await page.locator('#pReview').fill('2026-12-02');
  await activateWithKeyboard(page, page.locator('#savePortfolio'));
  await expect(page.locator('#portfolioStatus')).toBeFocused();
  const updated = (await storedRecord(page)).portfolios[0];
  expect(updated.id).toBe(original.id);
  expect(updated.attempts).toHaveLength(2);
  expect(JSON.stringify(updated.attempts[0])).toBe(originalBytes);
  expect(updated.attempts[1]).toMatchObject({note: secondNote, judgement: 'meets', date: '2026-11-30', rubric: revised});
});
