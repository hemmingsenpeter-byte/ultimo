import {test, expect} from '@playwright/test';
import {openRoute} from './helpers.js';

// These routes emulate the loopback gateway. No provider or credential is used.
async function gateway(page, reply) {
  await page.route('**/api/tutor/status', route => route.fulfill({json: {
    enabled: true, provider: 'ollama', csrf: 'fictional-test-token',
  }}));
  await page.route('**/api/tutor', reply);
  await openRoute(page, '#tutor/INT-101.L01');
  await expect(page.locator('#askModel')).toBeEnabled();
}

test('tutor validation clears on correction and failed requests remain readable', async ({page}) => {
  let requests = 0;
  await gateway(page, route => {
    requests++;
    return route.fulfill({status: 503, json: {error: 'Fictional gateway unavailable. Try again.'}});
  });
  await page.locator('#askModel').click();
  await expect(page.locator('#tutorQuery')).toBeFocused();
  await expect(page.locator('#tutorQuery')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#tutorQuery').fill('Explain the fictional practice example.');
  await expect(page.locator('#tutorQuery')).not.toHaveAttribute('aria-invalid');
  await page.locator('#askModel').click();
  await expect(page.locator('#providerConsent')).toBeFocused();
  await expect(page.locator('#providerConsent')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#tutorQuery').fill('A revised fictional practice question.');
  await expect(page.locator('#modelError')).toContainText('Consent is required');
  expect(requests).toBe(0);
  await page.locator('#providerConsent').check();
  await expect(page.locator('#providerConsent')).not.toHaveAttribute('aria-invalid');
  await page.locator('#askModel').click();
  await expect(page.locator('#modelError')).toHaveText('Fictional gateway unavailable. Try again.');
  await expect(page.locator('#tutorQuery')).toBeFocused();
  await expect(page.locator('#tutorQuery')).toHaveAttribute('aria-describedby', 'modelError');
  await expect(page.locator('#tutorQuery')).toHaveValue('A revised fictional practice question.');
  expect(requests).toBe(1);
});

test('a delayed tutor response preserves a new draft and focus outside its panel', async ({page}) => {
  let release;
  const released = new Promise(resolve => { release = resolve; });
  let started;
  const requested = new Promise(resolve => { started = resolve; });
  await gateway(page, async route => {
    started();
    await released;
    await route.fulfill({json: {answer: 'A fictional reply for this test.', citations: {cited: [], unknown: []}}});
  });
  await page.locator('#tutorQuery').fill('First fictional question.');
  await page.locator('#providerConsent').check();
  await page.locator('#askModel').click();
  await requested;
  await page.locator('#tutorQuery').fill('A newer unsent fictional question.');
  const navigation = page.getByRole('navigation').getByRole('link', {name: 'Study planner', exact: true});
  await navigation.focus();
  release();
  await expect(page.locator('#tutorConversation')).toContainText('A fictional reply for this test.');
  await expect(page.locator('#tutorQuery')).toHaveValue('A newer unsent fictional question.');
  await expect(navigation).toBeFocused();
  await expect(page.locator('#providerConsent')).not.toBeChecked();
});
