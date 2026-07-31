const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.headerTitle = page.locator('.oxd-topbar-header-title');
    this.userDropdownName = page.locator('.oxd-userdropdown-name');
    this.logoutBtn = page.locator('#logoutBtn');
    this.punchBtn = page.locator('#punchBtn');
    this.punchStatus = page.locator('.punch-status');
    this.leaveMenuLink = page.locator('#leaveMenuLink');
    this.applyLeaveQuickLaunch = page.locator('#applyLeaveQuickLaunch');
  }

  async navigate() {
    await this.goto('http://127.0.0.1:3000/dashboard.html');
  }

  async clickPunch() {
    await this.punchBtn.click({ force: true });
  }

  async clickLeaveMenu() {
    await this.leaveMenuLink.click();
  }

  async clickApplyLeaveQuickLaunch() {
    await this.applyLeaveQuickLaunch.click();
  }

  async logout() {
    await this.logoutBtn.click();
  }
}

module.exports = DashboardPage;
