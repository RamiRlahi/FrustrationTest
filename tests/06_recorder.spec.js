const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../features/pages/LoginPage');

test.slow();

test('Verify session recording, frustration capture, and storage API', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();

  await expect(loginPage.recStartBtn).toBeEnabled();
  await expect(loginPage.recStopBtn).toBeDisabled();

  await loginPage.recStartBtn.click();
  await expect(loginPage.recStartBtn).toBeDisabled();
  await expect(loginPage.recStopBtn).toBeEnabled();

  await loginPage.rapidlyClickSSO(3);

  await expect(loginPage.ssoTooltip).toContainText('locked');

  await loginPage.recStopBtn.click();
  await expect(loginPage.recStartBtn).toBeEnabled();
  await expect(loginPage.recStopBtn).toBeDisabled();

  const sessionName = 'auto_recorded_sso_test';
  await loginPage.recSessionNameInput.fill(sessionName);
  await loginPage.recSaveBtn.click();

  await expect(loginPage.recMsg).toContainText('Session saved successfully!');

  const filePath = path.join(__dirname, '..', 'scripts', 'manual test schemes', `${sessionName}.json`);
  
  await page.waitForTimeout(500);
  expect(fs.existsSync(filePath)).toBe(true);

  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  expect(content.name).toBe(sessionName);
  expect(content.frustrationDetected.ssoLocked).toBe(true);
  
  fs.unlinkSync(filePath);
});
