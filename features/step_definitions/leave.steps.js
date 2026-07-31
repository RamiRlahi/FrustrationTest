const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I navigate to the leave management page', async function () {
  await this.leavePage.navigate();
});

When('I select leave type {string}', async function (leaveType) {
  await this.leavePage.leaveTypeSelect.selectOption(leaveType);
});

When('I enter from date {string} and to date {string}', async function (startDate, endDate) {
  await this.leavePage.fillLeaveRequest(null, startDate, endDate);
});

When('I click the apply leave button', async function () {
  await this.leavePage.clickApply();
});

When('I rapidly click the apply leave button {int} times', async function (times) {
  await this.leavePage.rapidlyClickApply(times);
});

Then('the leave success message should display {string}', async function (expectedMsg) {
  await expect(this.leavePage.leaveSuccessBanner).toBeVisible();
  await expect(this.leavePage.leaveSuccessMsg).toContainText(expectedMsg);
});

Then('the leave balance should be updated to {string}', async function (expectedBalanceText) {
  await expect(this.leavePage.leaveBalanceBadge).toContainText(expectedBalanceText);
});

Then('the leave error message should display {string}', async function (expectedMsg) {
  await expect(this.leavePage.leaveErrorBanner).toBeVisible();
  await expect(this.leavePage.leaveErrorMsg).toContainText(expectedMsg);
});

Then('the leave friction banner should become visible', async function () {
  await expect(this.leavePage.leaveFrictionBanner).toBeVisible();
});
