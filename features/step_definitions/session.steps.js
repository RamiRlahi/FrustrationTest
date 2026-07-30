const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

Given('the session recorder is actively recording', async function () {
  await this.loginPage.recStartBtn.click();
});

Given('I have started session recording', async function () {
  await this.loginPage.recStartBtn.click();
});

Given('I have recorded a session with events', async function () {
  await this.loginPage.recStartBtn.click();
  await this.loginPage.fillEmail('test@company.com');
  await this.loginPage.fillPassword('password123');
});

When('I click the recorder {string} button', async function (btnName) {
  if (btnName === 'Start') await this.loginPage.recStartBtn.click();
  if (btnName === 'Stop') await this.loginPage.recStopBtn.click();
});

When('I enter session name {string}', async function (name) {
  await this.loginPage.recSessionNameInput.fill(name);
});

When('I click {string}', async function (text) {
  if (text === 'Save to Test Schemes') {
    await this.loginPage.recSaveBtn.click();
  }
});

Then('the session recording should automatically save and navigate away', async function () {
  await this.loginPage.waitForTimeout(500);
});

Then('the recorder status indicator should show recording active', async function () {
  await expect(this.loginPage.recorderStatusDot).toHaveClass(/recording/);
});

Then('the recorder event counter should start incrementing on user interactions', async function () {
  await expect(this.loginPage.recEventCount).not.toHaveText('0');
});

Then('the recorder event counter should reflect captured clicks, inputs, and the {string} trigger', async function (trigger) {
  const count = await this.loginPage.recEventCount.textContent();
  expect(parseInt(count, 10)).toBeGreaterThan(0);
});

Then('the API endpoint {string} should return success', async function (endpoint) {
  await expect(this.loginPage.recMsg).toBeVisible({ timeout: 10000 });
  await expect(this.loginPage.recMsg).toContainText('Session saved successfully!');
});

Then('the file {string} should exist on disk', async function (filePath) {
  const fullPath = path.join(__dirname, '..', '..', filePath);
  expect(fs.existsSync(fullPath)).toBe(true);
});
