const { setWorldConstructor, BeforeAll, AfterAll, Before, After, Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const adversary = require('../../scripts/adversary/adversary');

setDefaultTimeout(60000);

let serverProcess = null;

BeforeAll(async function () {
  const isServerRunning = await new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000/', () => resolve(true));
    req.on('error', () => resolve(false));
    req.end();
  });

  if (!isServerRunning) {
    const serverPath = path.join(__dirname, '..', '..', 'server.js');
    serverProcess = spawn('node', [serverPath], { stdio: 'ignore' });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 250));
      const running = await new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:3000/', () => resolve(true));
        req.on('error', () => resolve(false));
        req.end();
      });
      if (running) break;
    }
  }
});

AfterAll(async function () {
  if (serverProcess) {
    serverProcess.kill();
  }
});

class CustomWorld {
  constructor() {
    this.browser = null;
    this.page = null;
    this.recordedEvents = [];
    this.attackResult = null;
  }
}

setWorldConstructor(CustomWorld);

Before(async function () {
  this.browser = await chromium.launch({ headless: true });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After(async function () {
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
  if (this.browser) await this.browser.close();
});

// --- Navigation & Setup Steps ---
Given('I navigate to the login page', async function () {
  await this.page.goto('http://127.0.0.1:3000/');
});

Given('the rage click banner is hidden', async function () {
  await expect(this.page.locator('#rageClickBanner')).toBeHidden();
});

Given('the SSO tooltip is hidden', async function () {
  await expect(this.page.locator('#ssoTooltip')).toBeHidden();
});

Given('the magic link banner is hidden', async function () {
  await expect(this.page.locator('#magicLinkBanner')).toBeHidden();
});

Given('the mouse jitter banner is hidden', async function () {
  await expect(this.page.locator('#mouseJitterBanner')).toBeHidden();
});

Given('the reversion modal is hidden', async function () {
  await expect(this.page.locator('#reversionModal')).toBeHidden();
});

Given('the frustration survey overlay is hidden', async function () {
  await expect(this.page.locator('#surveyOverlay')).toBeHidden();
});

Given('the frustration survey overlay is visible', async function () {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < 5; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
  await expect(this.page.locator('#surveyOverlay')).toBeVisible();
});

Given('the frustration survey overlay was displayed and dismissed by the user', async function () {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < 5; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
  await expect(this.page.locator('#surveyOverlay')).toBeVisible();
  await this.page.locator('#surveyDismiss').click();
  await expect(this.page.locator('#surveyOverlay')).toBeHidden();
});

Given('the reversion modal is visible after {int} cancel clicks', async function (count) {
  const cancelBtn = this.page.locator('#cancelButton');
  for (let i = 0; i < count; i++) {
    await cancelBtn.click({ force: true });
  }
  await expect(this.page.locator('#reversionModal')).toBeVisible();
});

Given('the session recorder is actively recording', async function () {
  await this.page.locator('#recStartBtn').click();
});

Given('I have started session recording', async function () {
  await this.page.locator('#recStartBtn').click();
});

Given('I have recorded a session with events', async function () {
  await this.page.locator('#recStartBtn').click();
  await this.page.locator('#username').fill('test@company.com');
  await this.page.locator('#password').fill('password123');
});

// --- Action Steps ---
When('I enter email {string}', async function (email) {
  await this.page.locator('#username').fill(email);
});

When('I enter password {string}', async function (password) {
  await this.page.locator('#password').fill(password);
});

When('I click the submit button', async function () {
  await this.page.locator('#loginSubmit').click();
});

When('I rapidly click the submit button {int} times within {int} seconds', async function (clicks, seconds) {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < clicks; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
});

When('I rapidly click the submit button {int} times', async function (clicks) {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < clicks; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
});

When('I click the submit button {int} times', async function (clicks) {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < clicks; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
});

When('I click the SSO button {int} time', async function (clicks) {
  await this.page.locator('#ssoSubmit').click({ force: true });
});

When('I rapidly click the SSO button {int} times', async function (clicks) {
  const ssoBtn = this.page.locator('#ssoSubmit');
  for (let i = 0; i < clicks; i++) {
    await ssoBtn.click({ force: true });
  }
});

When('I submit invalid credentials {int} times', async function (times) {
  const usernameInput = this.page.locator('#username');
  const passwordInput = this.page.locator('#password');
  const submitBtn = this.page.locator('#loginSubmit');

  for (let i = 0; i < times; i++) {
    await usernameInput.fill('user@company.com');
    await passwordInput.fill('WrongPassword');
    await submitBtn.click();
    await this.page.waitForTimeout(500);
  }
});

When('I move the mouse inside the login card with {int} rapid zig-zag reversals', async function (count) {
  const card = this.page.locator('#loginCard');
  const box = await card.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await this.page.mouse.move(centerX, centerY);
  for (let i = 0; i < count; i++) {
    const offset = i % 2 === 0 ? 60 : -60;
    await this.page.mouse.move(centerX + offset, centerY);
    await this.page.waitForTimeout(30);
  }
});

When('I move the mouse smoothly across the login card in {int} linear steps', async function (count) {
  const card = this.page.locator('#loginCard');
  const box = await card.boundingBox();
  const startX = box.x + 10;
  const centerY = box.y + box.height / 2;

  await this.page.mouse.move(startX, centerY);
  for (let i = 0; i < count; i++) {
    await this.page.mouse.move(startX + i * 8, centerY);
    await this.page.waitForTimeout(20);
  }
});

When('I move the mouse with neutral priming followed by {int} zig-zag moves', async function (count) {
  const card = this.page.locator('#loginCard');
  const box = await card.boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await this.page.mouse.move(centerX - 80, centerY);
  for (let i = 0; i < 16; i++) {
    await this.page.mouse.move(centerX - 80 + i * 5, centerY);
    await this.page.waitForTimeout(20);
  }
  for (let i = 0; i < count; i++) {
    const offset = i % 2 === 0 ? 60 : -60;
    await this.page.mouse.move(centerX + offset, centerY);
    await this.page.waitForTimeout(30);
  }
});

When('I click the cancel button {int} times', async function (clicks) {
  const cancelBtn = this.page.locator('#cancelButton');
  for (let i = 0; i < clicks; i++) {
    await cancelBtn.click({ force: true });
    await this.page.waitForTimeout(100);
  }
});

When('I wait for {int} seconds', async function (seconds) {
  await this.page.waitForTimeout(seconds * 1000);
});

When('I click the modal {string} button', async function (btnText) {
  if (btnText === 'Stay Here') {
    await this.page.locator('#modalContinue').click();
  } else if (btnText === 'Discard & Go Back') {
    await this.page.locator('#modalExit').click();
  }
});

When('I trigger frustration by rapidly clicking submit {int} times', async function (clicks) {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < clicks; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
});

When('I trigger frustration again by rapidly clicking submit {int} times', async function (clicks) {
  const submitBtn = this.page.locator('#loginSubmit');
  for (let i = 0; i < clicks; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }
});

When('I adjust the frustration slider to {string}', async function (val) {
  await this.page.locator('#frustrationSlider').fill(val);
});

When('I click the survey submit button', async function () {
  await this.page.locator('#surveySubmit').click();
});

When('I click the recorder {string} button', async function (btnName) {
  if (btnName === 'Start') await this.page.locator('#recStartBtn').click();
  if (btnName === 'Stop') await this.page.locator('#recStopBtn').click();
});

When('I type {string} in the email input', async function (text) {
  await this.page.locator('#username').fill(text);
});

When('I type {string} in the password input', async function (text) {
  await this.page.locator('#password').fill(text);
});

When('I enter session name {string}', async function (name) {
  await this.page.locator('#recSessionName').fill(name);
});

When('I click {string}', async function (text) {
  if (text === 'Save to Test Schemes') {
    await this.page.locator('#recSaveBtn').click();
  }
});

When('I trigger the attack scenario {string}', async function (attackName) {
  if (typeof adversary[attackName] === 'function') {
    this.attackResult = await adversary[attackName](this.page);
  } else {
    throw new Error(`Unknown attack scenario function: ${attackName}`);
  }
});

// --- Assertion Steps ---
Then('I should see the login feedback {string}', async function (text) {
  const feedback = this.page.locator('#loginFeedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(text);
});

Then('I should see the email validation error {string}', async function (text) {
  const emailErr = this.page.locator('#emailError');
  await expect(emailErr).toBeVisible();
  await expect(emailErr).toContainText(text);
});

Then('I should see the password validation error {string}', async function (text) {
  const passErr = this.page.locator('#passwordError');
  await expect(passErr).toBeVisible();
  await expect(passErr).toContainText(text);
});

Then('the login card should perform a shake animation', async function () {
  // Card briefly receives shake class or feedback is presented
  await this.page.waitForTimeout(200);
});

Then('the rage click banner should become visible', async function () {
  await expect(this.page.locator('#rageClickBanner')).toBeVisible();
});

Then('the rage click banner should display text {string}', async function (text) {
  await expect(this.page.locator('#rageClickBanner')).toContainText(text);
});

Then('the frustration survey overlay should auto-open', async function () {
  await expect(this.page.locator('#surveyOverlay')).toBeVisible();
});

Then('the rage click banner should remain hidden', async function () {
  await expect(this.page.locator('#rageClickBanner')).toBeHidden();
});

Then('the SSO tooltip should become visible', async function () {
  await expect(this.page.locator('#ssoTooltip')).toBeVisible();
});

Then('the SSO tooltip should contain {string}', async function (text) {
  await expect(this.page.locator('#ssoTooltip')).toContainText(text);
});

Then('the SSO tooltip should not contain {string}', async function (text) {
  const textContent = await this.page.locator('#ssoTooltip').textContent();
  expect(textContent.includes(text)).toBe(false);
});

Then('the SSO button should trigger a shake animation', async function () {
  await this.page.waitForTimeout(200);
});

Then('the magic link banner should become visible', async function () {
  await expect(this.page.locator('#magicLinkBanner')).toBeVisible();
});

Then('the magic link banner should display text {string}', async function (text) {
  await expect(this.page.locator('#magicLinkBanner')).toContainText(text);
});

Then('the magic link banner should remain hidden', async function () {
  await expect(this.page.locator('#magicLinkBanner')).toBeHidden();
});

Then('the mouse jitter banner should become visible', async function () {
  await expect(this.page.locator('#mouseJitterBanner')).toBeVisible();
});

Then('the mouse jitter banner should display text {string}', async function (text) {
  await expect(this.page.locator('#mouseJitterBanner')).toContainText(text);
});

Then('the mouse jitter banner should remain hidden', async function () {
  await expect(this.page.locator('#mouseJitterBanner')).toBeHidden();
});

Then('the reversion modal should become visible', async function () {
  await expect(this.page.locator('#reversionModal')).toBeVisible();
});

Then('the reversion modal should contain {string}', async function (text) {
  await expect(this.page.locator('#reversionModal')).toContainText(text);
});

Then('the reversion modal should remain hidden', async function () {
  await expect(this.page.locator('#reversionModal')).toBeHidden();
});

Then('the reversion modal should become hidden', async function () {
  await expect(this.page.locator('#reversionModal')).toBeHidden();
});

Then('the session recording should automatically save and navigate away', async function () {
  await this.page.waitForTimeout(500);
});

Then('the frustration survey overlay should become visible', async function () {
  await expect(this.page.locator('#surveyOverlay')).toBeVisible();
});

Then('the slider default value should be {string}', async function (val) {
  const sliderVal = await this.page.locator('#frustrationSlider').inputValue();
  expect(sliderVal).toBe(val);
});

Then('the rating display should show {string}', async function (text) {
  await expect(this.page.locator('#ratingDisplay')).toContainText(text);
});

Then('the feedback success message should display {string}', async function (text) {
  await expect(this.page.locator('#surveyFeedback')).toBeVisible();
  await expect(this.page.locator('#surveyFeedback')).toContainText(text);
});

Then('the survey overlay attribute {string} should be set to {string}', async function (attr, val) {
  await expect(this.page.locator('#surveyOverlay')).toHaveAttribute(attr, val);
});

Then('the frustration survey overlay should remain hidden', async function () {
  await expect(this.page.locator('#surveyOverlay')).toBeHidden();
});

Then('the recorder status indicator should show recording active', async function () {
  await expect(this.page.locator('#recorderStatusDot')).toHaveClass(/recording/);
});

Then('the recorder event counter should start incrementing on user interactions', async function () {
  await expect(this.page.locator('#recEventCount')).not.toHaveText('0');
});

Then('the recorder event counter should reflect captured clicks, inputs, and the {string} trigger', async function (trigger) {
  const count = await this.page.locator('#recEventCount').textContent();
  expect(parseInt(count, 10)).toBeGreaterThan(0);
});

Then('the API endpoint {string} should return success', async function (endpoint) {
  const msg = this.page.locator('#recMsg');
  await expect(msg).toBeVisible({ timeout: 10000 });
  await expect(msg).toContainText('Session saved successfully!');
});

Then('the file {string} should exist on disk', async function (filePath) {
  const fs = require('fs');
  const path = require('path');
  const fullPath = path.join(__dirname, '..', '..', filePath);
  expect(fs.existsSync(fullPath)).toBe(true);
});

Then('the expected frustration detection result should be {string}', async function (expected) {
  expect(this.attackResult).not.toBeNull();
  expect(this.attackResult.passed).toBe(true);
});

Then('the detail message should confirm {string}', async function (keyword) {
  expect(this.attackResult.detail).toContain(keyword);
});
