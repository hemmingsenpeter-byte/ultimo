import { test, expect } from '@playwright/test';
import { activateWithKeyboard, openRoute, preventModelRequests } from './helpers.js';

const routes = ['#home', '#planner', '#courses', '#lesson/INT-101.L01', '#portfolio', '#tutor/INT-101.L01', '#settings'];

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test('320px reflow keeps learning controls visible and the mobile menu keyboard accessible', async ({ page }) => {
  await preventModelRequests(page);
  await page.setViewportSize({ width: 320, height: 900 });
  for (const route of routes) {
    await test.step(`Reflow ${route}`, async () => {
      await openRoute(page, route);
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('main h1')).toBeVisible();
      const controls = page.locator('main input:visible, main select:visible, main textarea:visible, main button:visible');
      for (const control of await controls.all()) {
        const bounds = await control.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(321);
      }
    });
  }
  await activateWithKeyboard(page, page.getByRole('button', { name: 'Menu', exact: true }));
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await activateWithKeyboard(page, page.getByRole('navigation').getByRole('link', { name: 'Study planner', exact: true }));
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: 'Your study planner', exact: true })).toBeVisible();
});

test('doubling rendered text preserves content and usable controls', async ({ page }) => {
  await preventModelRequests(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of routes) {
    await test.step(`200% text ${route}`, async () => {
      await openRoute(page, route);
      // Hash routing reuses the document, so clear the previous route's text zoom.
      await page.reload();
      await expect(page.locator('main h1')).toBeVisible();
      const initial = await page.locator('main h1').evaluate(element => parseFloat(getComputedStyle(element).fontSize));
      // Snapshot every computed size before changing anything, then double each size.
      // This simulates text-only zoom without letting inherited sizes compound.
      await page.evaluate(() => {
        const sizes = [...document.querySelectorAll('body, body *')].map(element => [element, getComputedStyle(element).fontSize]);
        for (const [element, size] of sizes) element.style.fontSize = `${parseFloat(size) * 2}px`;
      });
      await expect.poll(() => page.locator('main h1').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(initial * 2, 1);
      await expectNoHorizontalOverflow(page);
      for (const control of await page.locator('main button:visible, main input:visible, main select:visible, main textarea:visible').all()) {
        const bounds = await control.boundingBox();
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(1281);
      }
      await expect(page.locator('main h1')).toBeVisible();
    });
  }
});
