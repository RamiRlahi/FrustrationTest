const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I navigate to the login page', async function () {
  await this.loginPage.navigate();
});

Given('the magic link banner is hidden', async function () {
  await expect(this.loginPage.magicLinkBanner).toBeHidden();
});

When('I enter email {string}', async function (email) {
  await this.loginPage.fillEmail(email);
});

When('I enter password {string}', async function (password) {
  await this.loginPage.fillPassword(password);
});

When('I click the submit button', async function () {
  await this.loginPage.clickSubmit();
});

When('I submit invalid credentials {int} times', async function (times) {
  await this.loginPage.submitInvalidCredentials(times);
});

When('I type {string} in the email input', async function (text) {
  await this.loginPage.fillEmail(text);
});

When('I type {string} in the password input', async function (text) {
  await this.loginPage.fillPassword(text);
});

Then('I should see the login feedback {string}', async function (text) {
  await expect(this.loginPage.loginFeedback).toBeVisible();
  await expect(this.loginPage.loginFeedback).toContainText(text);
});

Then('I should see the email validation error {string}', async function (text) {
  await expect(this.loginPage.emailError).toBeVisible();
  await expect(this.loginPage.emailError).toContainText(text);
});

Then('I should see the password validation error {string}', async function (text) {
  await expect(this.loginPage.passwordError).toBeVisible();
  await expect(this.loginPage.passwordError).toContainText(text);
});

Then('the login card should perform a shake animation', async function () {
  await this.loginPage.waitForTimeout(200);
});

Then('the magic link banner should become visible', async function () {
  await expect(this.loginPage.magicLinkBanner).toBeVisible();
});

Then('the magic link banner should display text {string}', async function (text) {
  await expect(this.loginPage.magicLinkBanner).toContainText(text);
});

Then('the magic link banner should remain hidden', async function () {
  await expect(this.loginPage.magicLinkBanner).toBeHidden();
});
