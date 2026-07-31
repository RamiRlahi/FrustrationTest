const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class LeavePage extends BasePage {
  constructor(page) {
    super(page);
    this.headerTitle = page.locator('.oxd-topbar-header-title');
    this.leaveTypeSelect = page.locator('#leaveTypeSelect');
    this.startDateInput = page.locator('#startDateInput');
    this.endDateInput = page.locator('#endDateInput');
    this.commentsInput = page.locator('#commentsInput');
    this.applyLeaveBtn = page.locator('#applyLeaveBtn');

    this.leaveBalanceBadge = page.locator('#leaveBalanceBadge');
    this.leaveErrorBanner = page.locator('#leaveErrorBanner');
    this.leaveErrorMsg = page.locator('#leaveErrorMsg');
    this.leaveFrictionBanner = page.locator('#leaveFrictionBanner');
    this.leaveSuccessBanner = page.locator('#leaveSuccessBanner');
    this.leaveSuccessMsg = page.locator('#leaveSuccessMsg');
    this.leaveTableBody = page.locator('#leaveTableBody');
  }

  async navigate() {
    await this.goto('http://127.0.0.1:3000/leave.html');
  }

  async fillLeaveRequest(type, startDate, endDate, comments = '') {
    if (type) await this.leaveTypeSelect.selectOption(type);
    if (startDate) await this.startDateInput.fill(startDate);
    if (endDate) await this.endDateInput.fill(endDate);
    if (comments) await this.commentsInput.fill(comments);
  }

  async clickApply() {
    await this.applyLeaveBtn.click();
  }

  async rapidlyClickApply(times = 3) {
    for (let i = 0; i < times; i++) {
      await this.applyLeaveBtn.click();
    }
  }
}

module.exports = LeavePage;
