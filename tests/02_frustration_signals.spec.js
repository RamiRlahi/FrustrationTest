const { test, expect } = require('@playwright/test');
const LoginPage = require('../features/pages/LoginPage');

test.slow();

test.describe('Frustration Signal Detection Specs', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank', { waitUntil: 'load' });
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await page.waitForSelector('#loginSubmit', { state: 'visible' });
  });

  test('Should detect Rage Clicking on submit button', async () => {
    await expect(loginPage.rageClickBanner).toBeHidden();
    await loginPage.dispatchPointerDownSubmit(5);
    await expect(loginPage.rageClickBanner).toBeVisible();
    await expect(loginPage.rageClickBanner).toContainText('Need assistance?');
  });

  test('Should detect Rage Clicking on locked SSO module', async () => {
    await expect(loginPage.ssoTooltip).toBeHidden();
    await loginPage.clickSSO(true);
    await expect(loginPage.ssoTooltip).toBeVisible();
    await expect(loginPage.ssoTooltip).toContainText('disabled');

    await loginPage.rapidlyClickSSO(3);
    await expect(loginPage.ssoTooltip).toBeVisible();
    await expect(loginPage.ssoTooltip).toContainText('SSO is temporarily locked');
  });

  test('Should detect Mouse Jitters (erratic mouse movement)', async () => {
    await expect(loginPage.mouseJitterBanner).toBeHidden();
    await loginPage.moveMouseZigZag(25);
    await expect(loginPage.mouseJitterBanner).toBeVisible();
    await expect(loginPage.mouseJitterBanner).toContainText('Feeling stuck?');
  });

  test('Should detect Backtracking (repeated back/cancel clicks)', async () => {
    await expect(loginPage.reversionModal).toBeHidden();
    await loginPage.clickCancel(3);
    await expect(loginPage.reversionModal).toBeVisible();
    await expect(loginPage.reversionModal).toContainText('Need to head back?');

    await loginPage.clickModalButton('Stay Here');
    await expect(loginPage.reversionModal).toBeHidden();
  });
});
