const { test, expect } = require('@playwright/test');
const LoginPage = require('../features/pages/LoginPage');

test.slow();

test.describe('Authentication & Validation Specs', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank', { waitUntil: 'load' });
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await page.waitForSelector('#loginSubmit', { state: 'visible' });
  });

  test('Should perform successful login with valid credentials', async ({ page }) => {
    await loginPage.fillEmail('admin@Talan.com');
    await loginPage.fillPassword('password123');
    await loginPage.clickSubmit();
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    expect(page.url()).toContain('dashboard.html');
  });

  test('Should display validation error when email format is invalid', async () => {
    await loginPage.fillEmail('invalid-email-format');
    await loginPage.fillPassword('password123');
    await loginPage.clickSubmit();
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.emailError).toContainText('Please enter a valid');
  });

  test('Should display validation error when password is short', async () => {
    await loginPage.fillEmail('admin@Talan.com');
    await loginPage.fillPassword('short');
    await loginPage.clickSubmit();
    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.passwordError).toContainText('at least 8 characters');
  });

  test('Should detect Repeated Login Failures and offer Magic Link', async () => {
    await expect(loginPage.magicLinkBanner).toBeHidden();
    await loginPage.submitInvalidCredentials(3);
    await expect(loginPage.magicLinkBanner).toBeVisible();
    await expect(loginPage.magicLinkBanner).toContainText('Too many failed attempts');
  });
});
