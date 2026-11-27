import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { learnerRecord, openRoute, preventModelRequests, seedRecord } from './helpers.js';

const standardTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const routes = [
  '#home', '#courses', '#course/INT-101', '#lesson/INT-101.L01',
  '#lesson/PHY-102.L01', '#planner', '#library', '#frameworks',
  '#portfolio/INT-101', '#tutor/INT-101.L01', '#settings',
];

test('key routes and expanded learning controls pass automated WCAG A/AA checks', async ({ page }, testInfo) => {
  await preventModelRequests(page);
  await seedRecord(page, learnerRecord({
    completed: { 'INT-101.L01': '2000-01-01' },
    reviews: { 'INT-101.L01': { due: '2000-01-02', step: 0 } },
    evidence: [{ id: 'fictional-example', course: 'INT-101', date: '2000-01-01', note: 'A fictional learning-plan critique for this test.' }],
  }));
  const failures = [];
  for (const route of routes) {
    await test.step(`Scan ${route}`, async () => {
      await openRoute(page, route);
      if (route === '#lesson/INT-101.L01') {
        await page.locator('#quiz details').evaluateAll(details => details.forEach(element => { element.open = true; }));
        await page.getByText('View progression rubric', { exact: true }).click();
      }
      if (route.startsWith('#tutor')) {
        await page.getByRole('combobox', { name: 'Tutor role', exact: true }).selectOption('examiner');
        await page.getByText('Reveal model answer after attempting', { exact: true }).click();
      }
      const results = await new AxeBuilder({ page }).withTags(standardTags).analyze();
      if (results.violations.length) {
        failures.push({ route, violations: results.violations });
        await testInfo.attach(`axe-${route.replace(/[^a-z0-9]/gi, '-')}`, {
          body: JSON.stringify(results.violations, null, 2),
          contentType: 'application/json',
        });
      }
    });
  }
  expect(failures, JSON.stringify(failures.map(({ route, violations }) => ({
    route,
    violations: violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) })),
  })), null, 2)).toEqual([]);
});
