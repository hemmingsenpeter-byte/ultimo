import {readFile} from 'node:fs/promises';
import {test, expect} from '@playwright/test';
import {
  importRecord, learnerKey, learnerRecord, openRoute,
  preventModelRequests, storedRecord,
} from './helpers.js';

async function changePlan(page, plan) {
  await openRoute(page, '#planner');
  await page.locator('#studyPlan').selectOption(plan);
  await page.locator('#savePlan').click();
  await expect(page.locator('#savePlan')).toBeFocused();
  expect((await storedRecord(page)).studyPlan).toBe(plan);
}

async function replaceRecord(page, record) {
  await page.evaluate(({key, record}) => localStorage.setItem(key, JSON.stringify(record)), {key: learnerKey, record});
  await page.reload();
  await expect(page.locator('main h1')).toBeVisible();
}

test.beforeEach(async ({page}) => {
  await preventModelRequests(page);
});

test('all study plans preserve learner work, reload preferences and include prerequisites', async ({page}) => {
  await openRoute(page, '#planner');
  const record = learnerRecord({
    completed: {'INT-101.L01': '2000-01-01'},
    quizzes: {'INT-101.L01': {date: '2000-01-01', correct: 2, total: 3}},
    reviews: {'INT-101.L01': {due: '2000-01-02', step: 0}},
    evidence: [{id: 'fictional-plan', course: 'INT-101', date: '2000-01-01', note: 'Fictional practice retained across study plans.'}],
  });
  await replaceRecord(page, record);
  await changePlan(page, 'faculty:MEN');
  await expect(page.locator('main')).toContainText('Learning how to learn');
  await expect(page.locator('#studyQueue a[href="#lesson/INT-101.L02"]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('#studyPlan')).toHaveValue('faculty:MEN');
  for (const plan of ['all', 'foundation', 'faculty:MEN']) {
    await changePlan(page, plan);
    const saved = await storedRecord(page);
    for (const field of ['completed', 'quizzes', 'reviews', 'evidence']) expect(saved[field], field).toEqual(record[field]);
  }
  await changePlan(page, 'all');
  await openRoute(page, '#home');
  await expect(page.locator('#activePlanTitle')).toHaveText('All written courses');
  await expect(page.locator('a.card-link[href="#course/INT-109"]')).toHaveCount(1);
  await openRoute(page, '#tutor');
  await expect(page.locator('main')).toContainText('All written courses');
});

test('global due reviews and weak practice survive focus changes within one weekly budget', async ({page}) => {
  const curriculum = JSON.parse(await readFile(new URL('../../dist/curriculum.json', import.meta.url), 'utf8'));
  const record = learnerRecord({hours: 1, studyPlan: 'faculty:MEN'});
  for (const lesson of curriculum.courses.find(course => course.id === 'INT-101').lessons) {
    record.completed[`INT-101.${lesson.id}`] = '2000-01-01';
  }
  for (const course of curriculum.courses.filter(course => course.authored).slice(0, 10)) {
    record.reviews[`${course.id}.L01`] = {due: '2000-01-01', step: 0};
  }
  await openRoute(page, '#planner');
  await replaceRecord(page, record);
  await expect(page.locator('#studyQueue')).toContainText('60 / 60 minutes planned');
  await expect(page.locator('#studyQueue a')).toHaveCount(4);
  await expect(page.getByRole('link', {name: 'Review lesson', exact: true})).toHaveCount(10);
  await changePlan(page, 'faculty:EMO');
  await expect(page.locator('#studyQueue')).toContainText('60 / 60 minutes planned');
  await expect(page.getByRole('link', {name: 'Review lesson', exact: true})).toHaveCount(10);
  record.reviews = {};
  await replaceRecord(page, record);
  await expect(page.locator('#studyQueue a[href="#lesson/MEN-101.L01"]')).toHaveCount(1);
  record.quizzes['INT-109.L01'] = {date: '2000-01-01', correct: 1, total: 3};
  await replaceRecord(page, record);
  await expect(page.locator('#studyQueue a[href="#lesson/INT-109.L01"]')).toHaveCount(1);
  await expect(page.locator('#studyQueue')).toContainText('Last formative self-check 1/3');
  await expect(page.locator('#studyQueue')).toContainText('20 / 60 minutes planned');
  await changePlan(page, 'foundation');
  await expect(page.locator('#studyQueue a[href="#lesson/INT-109.L01"]')).toHaveCount(1);
});

test('legacy and unknown-plan backups migrate while unsupported versions preserve records', async ({page}) => {
  await openRoute(page, '#settings');
  const record = learnerRecord({
    completed: {'INT-101.L01': '2000-01-01'},
    evidence: [{id: 'fictional-migration', course: 'INT-101', date: '2000-01-01', note: 'Fictional evidence for migration.'}],
    studyPlan: 'all',
  });
  const legacy = {...record};
  delete legacy.studyPlan;
  await importRecord(page, legacy);
  await expect(page.locator('#importData')).toBeFocused();
  expect(await storedRecord(page)).toEqual({...record, studyPlan: 'foundation'});
  await openRoute(page, '#settings');
  await importRecord(page, {...record, studyPlan: 'faculty:INVALID'});
  expect(await storedRecord(page)).toEqual({...record, studyPlan: 'foundation'});
  const before = await storedRecord(page);
  await page.locator('#importData').setInputFiles({
    name: 'unsupported-synthetic-backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({...record, version: 999})),
  });
  await expect(page.locator('#importResult')).toContainText('Unsupported learner data version');
  await expect(page.locator('#importData')).toBeFocused();
  expect(await storedRecord(page)).toEqual(before);
});

test('synthetic learning journeys keep requests on the static origin and avoid runtime errors', async ({page, baseURL}) => {
  const remote = [], errors = [];
  page.on('request', request => {
    if (new URL(request.url()).origin !== new URL(baseURL).origin) remote.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['#home', '#planner', '#courses', '#lesson/INT-101.L01', '#portfolio', '#tutor', '#settings']) {
    await openRoute(page, route);
  }
  await page.locator('#importData').setInputFiles({
    name: 'private-synthetic-backup.json', mimeType: 'application/json', buffer: Buffer.from('{not-json'),
  });
  await expect(page.locator('#importResult')).toContainText('Import failed');
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});
