const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.slow();

test('Verify session recording, frustration capture, and storage API', async ({ page }) => {
  // Listen for console logs and uncaught errors from the browser page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  await page.goto('/');

  const startBtn = page.locator('#recStartBtn');
  const stopBtn = page.locator('#recStopBtn');
  const sessionNameInput = page.locator('#recSessionName');
  const saveBtn = page.locator('#recSaveBtn');
  const recMsg = page.locator('#recMsg');
  const ssoBtn = page.locator('#ssoSubmit');

  // Verify initial state
  await expect(startBtn).toBeEnabled();
  await expect(stopBtn).toBeDisabled();

  // Click start
  await startBtn.click();
  await expect(startBtn).toBeDisabled();
  await expect(stopBtn).toBeEnabled();

  // Perform frustration actions: Click SSO 3 times rapidly
  for (let i = 0; i < 3; i++) {
    await ssoBtn.click({ force: true });
  }

  // Verify SSO escalates
  const ssoTooltip = page.locator('#ssoTooltip');
  await expect(ssoTooltip).toContainText('locked');

  // Stop recording
  await stopBtn.click();
  await expect(startBtn).toBeEnabled();
  await expect(stopBtn).toBeDisabled();

  // Fill in session name and save
  const sessionName = 'auto_recorded_sso_test';
  await sessionNameInput.fill(sessionName);
  await saveBtn.click();

  // Verify success banner message
  await expect(recMsg).toContainText('Session saved successfully!');

  // Verify file got written on disk
  const filePath = path.join(__dirname, '..', 'scripts', 'manual test schemes', `${sessionName}.json`);
  
  // Wait a small moment for file IO
  await page.waitForTimeout(500);

  expect(fs.existsSync(filePath)).toBe(true);

  // Read and validate file content
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  expect(content.name).toBe(sessionName);
  expect(content.frustrationDetected.ssoLocked).toBe(true);
  
  // Clean up the generated file
  fs.unlinkSync(filePath);
});
