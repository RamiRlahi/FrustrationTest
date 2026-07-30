const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('the SSO tooltip is hidden', async function () {
  await expect(this.loginPage.ssoTooltip).toBeHidden();
});

When('I click the SSO button {int} time', async function (clicks) {
  await this.loginPage.clickSSO(true);
});

When('I rapidly click the SSO button {int} times', async function (clicks) {
  await this.loginPage.rapidlyClickSSO(clicks);
});

Then('the SSO tooltip should become visible', async function () {
  await expect(this.loginPage.ssoTooltip).toBeVisible();
});

Then('the SSO tooltip should contain {string}', async function (text) {
  await expect(this.loginPage.ssoTooltip).toContainText(text);
});

Then('the SSO tooltip should not contain {string}', async function (text) {
  const textContent = await this.loginPage.ssoTooltip.textContent();
  expect(textContent.includes(text)).toBe(false);
});

Then('the SSO button should trigger a shake animation', async function () {
  await this.loginPage.waitForTimeout(200);
});
