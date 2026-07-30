const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('the rage click banner is hidden', async function () {
  await expect(this.loginPage.rageClickBanner).toBeHidden();
});

Given('the mouse jitter banner is hidden', async function () {
  await expect(this.loginPage.mouseJitterBanner).toBeHidden();
});

Given('the reversion modal is hidden', async function () {
  await expect(this.loginPage.reversionModal).toBeHidden();
});

Given('the frustration survey overlay is hidden', async function () {
  await expect(this.surveyModal.surveyOverlay).toBeHidden();
});

Given('the frustration survey overlay is visible', async function () {
  await this.loginPage.dispatchPointerDownSubmit(5);
  await expect(this.surveyModal.surveyOverlay).toBeVisible();
});

Given('the frustration survey overlay was displayed and dismissed by the user', async function () {
  await this.loginPage.dispatchPointerDownSubmit(5);
  await expect(this.surveyModal.surveyOverlay).toBeVisible();
  await this.surveyModal.dismiss();
  await expect(this.surveyModal.surveyOverlay).toBeHidden();
});

Given('the reversion modal is visible after {int} cancel clicks', async function (count) {
  await this.loginPage.clickCancel(count);
  await expect(this.loginPage.reversionModal).toBeVisible();
});

When('I rapidly click the submit button {int} times within {int} seconds', async function (clicks, seconds) {
  await this.loginPage.dispatchPointerDownSubmit(clicks);
});

When('I rapidly click the submit button {int} times', async function (clicks) {
  await this.loginPage.dispatchPointerDownSubmit(clicks);
});

When('I click the submit button {int} times', async function (clicks) {
  await this.loginPage.dispatchPointerDownSubmit(clicks);
});

When('I move the mouse inside the login card with {int} rapid zig-zag reversals', async function (count) {
  await this.loginPage.moveMouseZigZag(count);
});

When('I move the mouse smoothly across the login card in {int} linear steps', async function (count) {
  await this.loginPage.moveMouseSmoothLinear(count);
});

When('I move the mouse with neutral priming followed by {int} zig-zag moves', async function (count) {
  await this.loginPage.moveMouseNeutralThenZigZag(count);
});

When('I click the cancel button {int} times', async function (clicks) {
  await this.loginPage.clickCancel(clicks);
});

When('I wait for {int} seconds', async function (seconds) {
  await this.loginPage.waitForTimeout(seconds * 1000);
});

When('I click the modal {string} button', async function (btnText) {
  await this.loginPage.clickModalButton(btnText);
});

When('I trigger frustration by rapidly clicking submit {int} times', async function (clicks) {
  await this.loginPage.dispatchPointerDownSubmit(clicks);
});

When('I trigger frustration again by rapidly clicking submit {int} times', async function (clicks) {
  await this.loginPage.dispatchPointerDownSubmit(clicks);
});

When('I adjust the frustration slider to {string}', async function (val) {
  await this.surveyModal.setSliderValue(val);
});

When('I click the survey submit button', async function () {
  await this.surveyModal.submit();
});

Then('the rage click banner should become visible', async function () {
  await expect(this.loginPage.rageClickBanner).toBeVisible();
});

Then('the rage click banner should display text {string}', async function (text) {
  await expect(this.loginPage.rageClickBanner).toContainText(text);
});

Then('the frustration survey overlay should auto-open', async function () {
  await expect(this.surveyModal.surveyOverlay).toBeVisible();
});

Then('the rage click banner should remain hidden', async function () {
  await expect(this.loginPage.rageClickBanner).toBeHidden();
});

Then('the mouse jitter banner should become visible', async function () {
  await expect(this.loginPage.mouseJitterBanner).toBeVisible();
});

Then('the mouse jitter banner should display text {string}', async function (text) {
  await expect(this.loginPage.mouseJitterBanner).toContainText(text);
});

Then('the mouse jitter banner should remain hidden', async function () {
  await expect(this.loginPage.mouseJitterBanner).toBeHidden();
});

Then('the reversion modal should become visible', async function () {
  await expect(this.loginPage.reversionModal).toBeVisible();
});

Then('the reversion modal should contain {string}', async function (text) {
  await expect(this.loginPage.reversionModal).toContainText(text);
});

Then('the reversion modal should remain hidden', async function () {
  await expect(this.loginPage.reversionModal).toBeHidden();
});

Then('the reversion modal should become hidden', async function () {
  await expect(this.loginPage.reversionModal).toBeHidden();
});

Then('the frustration survey overlay should become visible', async function () {
  await expect(this.surveyModal.surveyOverlay).toBeVisible();
});

Then('the slider default value should be {string}', async function (val) {
  const sliderVal = await this.surveyModal.frustrationSlider.inputValue();
  expect(sliderVal).toBe(val);
});

Then('the rating display should show {string}', async function (text) {
  await expect(this.surveyModal.ratingDisplay).toContainText(text);
});

Then('the feedback success message should display {string}', async function (text) {
  await expect(this.surveyModal.surveyFeedback).toBeVisible();
  await expect(this.surveyModal.surveyFeedback).toContainText(text);
});

Then('the survey overlay attribute {string} should be set to {string}', async function (attr, val) {
  await expect(this.surveyModal.surveyOverlay).toHaveAttribute(attr, val);
});

Then('the frustration survey overlay should remain hidden', async function () {
  await expect(this.surveyModal.surveyOverlay).toBeHidden();
});
