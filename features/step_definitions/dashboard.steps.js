const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I navigate to the dashboard page', async function () {
  await this.dashboardPage.navigate();
});

When('I click the punch clock button', async function () {
  await this.dashboardPage.clickPunch();
});

When('I click the sidebar {string} menu item', async function (menuName) {
  if (menuName === 'Leave') {
    await this.dashboardPage.clickLeaveMenu();
  }
});

When('I click the {string} quick launch card', async function (cardName) {
  if (cardName === 'Apply Leave') {
    await this.dashboardPage.clickApplyLeaveQuickLaunch();
  }
});

When('I click the logout button on the dashboard', async function () {
  await this.dashboardPage.logout();
});

Then('the punch clock status should be {string}', async function (expectedStatus) {
  await expect(this.dashboardPage.punchStatus).toHaveText(expectedStatus);
});

Then('the punch button label should be {string}', async function (expectedLabel) {
  await expect(this.dashboardPage.punchBtn).toHaveText(expectedLabel);
});

Then('I should be navigated to the {string} page', async function (pageName) {
  if (pageName === 'Apply Leave') {
    await expect(this.page).toHaveURL(/leave\.html/);
    await expect(this.leavePage.headerTitle).toHaveText('Apply Leave');
  } else if (pageName === 'login') {
    await expect(this.page).toHaveURL(/index\.html/);
  }
});
