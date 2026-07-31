const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../features/pages/LoginPage');

test.slow();

test('Verify session recording, frustration capture, and storage API', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();

  // Verify initial state
  await expect(loginPage.recStartBtn).toBeEnabled();
  await expect(loginPage.recStopBtn).toBeDisabled();

  // Click start
  await loginPage.recStartBtn.click();
  await expect(loginPage.recStartBtn).toBeDisabled();
  await expect(loginPage.recStopBtn).toBeEnabled();

  // Perform frustration actions: Click SSO 3 times rapidly
  await loginPage.rapidlyClickSSO(3);

  // Verify SSO escalates
  await expect(loginPage.ssoTooltip).toContainText('locked');

  // Stop recording
  await loginPage.recStopBtn.click();
  await expect(loginPage.recStartBtn).toBeEnabled();
  await expect(loginPage.recStopBtn).toBeDisabled();

  // Fill in session name and save
  const sessionName = 'auto_recorded_sso_test';
  await loginPage.recSessionNameInput.fill(sessionName);
  await loginPage.recSaveBtn.click();

  // Verify success banner message
  await expect(loginPage.recMsg).toContainText('Session saved successfully!');

  // Verify file got written on disk
  const filePath = path.join(__dirname, '..', 'scripts', 'manual test schemes', `${sessionName}.json`);
  
  await page.waitForTimeout(500);
  expect(fs.existsSync(filePath)).toBe(true);

  // Read and validate file content
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  expect(content.name).toBe(sessionName);
  expect(content.frustrationDetected.ssoLocked).toBe(true);
  
  // Clean up
  fs.unlinkSync(filePath);
});
