const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.loginCard = page.locator('#loginCard');
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitBtn = page.locator('#loginSubmit');
    this.loginFeedback = page.locator('#loginFeedback');
    this.emailError = page.locator('#emailError');
    this.passwordError = page.locator('#passwordError');

    // SSO Module
    this.ssoSubmitBtn = page.locator('#ssoSubmit');
    this.ssoTooltip = page.locator('#ssoTooltip');

    // Banners & Modals
    this.rageClickBanner = page.locator('#rageClickBanner');
    this.magicLinkBanner = page.locator('#magicLinkBanner');
    this.mouseJitterBanner = page.locator('#mouseJitterBanner');
    this.reversionModal = page.locator('#reversionModal');
    this.cancelBtn = page.locator('#cancelButton');
    this.modalContinueBtn = page.locator('#modalContinue');
    this.modalExitBtn = page.locator('#modalExit');

    // Recorder Controls
    this.recStartBtn = page.locator('#recStartBtn');
    this.recStopBtn = page.locator('#recStopBtn');
    this.recSessionNameInput = page.locator('#recSessionName');
    this.recSaveBtn = page.locator('#recSaveBtn');
    this.recorderStatusDot = page.locator('#recorderStatusDot');
    this.recEventCount = page.locator('#recEventCount');
    this.recMsg = page.locator('#recMsg');
  }

  async navigate() {
    await this.goto('http://127.0.0.1:3000/');
  }

  async fillEmail(email) {
    await this.usernameInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickSubmit() {
    // requestSubmit() is the only reliable cross-browser way to fire the form's submit event from JS
    await this.page.evaluate(() => document.getElementById('loginForm').requestSubmit());
  }

  async dispatchPointerDownSubmit(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.submitBtn.dispatchEvent('pointerdown', { bubbles: true, cancelable: true });
      await this.page.waitForTimeout(30); // App has 20ms dedup guard; 30ms delay ensures each event registers
    }
  }

  async clickSSO(force = true) {
    await this.ssoSubmitBtn.click({ force });
  }

  async rapidlyClickSSO(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.ssoSubmitBtn.click({ force: true });
    }
  }

  async clickCancel(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.cancelBtn.click({ force: true });
      await this.page.waitForTimeout(100);
    }
  }

  async clickModalButton(btnText) {
    if (btnText === 'Stay Here') {
      await this.modalContinueBtn.click();
    } else if (btnText === 'Discard & Go Back') {
      await this.modalExitBtn.click();
    }
  }

  async submitInvalidCredentials(times) {
    for (let i = 0; i < times; i++) {
      await this.usernameInput.fill('user@company.com');
      await this.passwordInput.fill('WrongPassword');
      await this.page.evaluate(() => document.getElementById('loginForm').requestSubmit());
      await this.page.waitForTimeout(500);
    }
  }

  async moveMouseZigZag(count) {
    const box = await this.loginCard.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await this.page.mouse.move(centerX, centerY);
    for (let i = 0; i < count; i++) {
      const offset = i % 2 === 0 ? 60 : -60;
      await this.page.mouse.move(centerX + offset, centerY);
      await this.page.waitForTimeout(30);
    }
  }

  async moveMouseSmoothLinear(count) {
    const box = await this.loginCard.boundingBox();
    const startX = box.x + 10;
    const centerY = box.y + box.height / 2;

    await this.page.mouse.move(startX, centerY);
    for (let i = 0; i < count; i++) {
      await this.page.mouse.move(startX + i * 8, centerY);
      await this.page.waitForTimeout(20);
    }
  }

  async moveMouseNeutralThenZigZag(count) {
    const box = await this.loginCard.boundingBox();
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
  }
}

module.exports = LoginPage;
