'use strict';
const { chromium, firefox } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:3000';

/**
 * Launch an isolated browser sandbox for a single adversarial attack.
 * Each call creates a fresh browser instance so no state leaks between attacks.
 *
 * @param {'chromium'|'firefox'} browserType
 * @returns {Promise<{ page: import('@playwright/test').Page, close: () => Promise<void> }>}
 */
async function launchSandbox(browserType = 'chromium') {
  const launcher = browserType === 'firefox' ? firefox : chromium;
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await page.goto('/');

  return {
    page,
    async close() {
      await browser.close();
    },
  };
}

module.exports = { launchSandbox };
