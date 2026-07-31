const { expect } = require('@playwright/test');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(url = 'http://127.0.0.1:3000/') {
    await this.page.goto(url, { waitUntil: 'load' });
  }

  async waitForTimeout(ms) {
    await this.page.waitForTimeout(ms);
  }
}

module.exports = BasePage;
