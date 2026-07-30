const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const adversary = require('../../scripts/adversary/adversary');

When('I trigger the attack scenario {string}', async function (attackName) {
  if (typeof adversary[attackName] === 'function') {
    this.attackResult = await adversary[attackName](this.page);
  } else {
    throw new Error(`Unknown attack scenario function: ${attackName}`);
  }
});

Then('the expected frustration detection result should be {string}', async function (expected) {
  expect(this.attackResult).not.toBeNull();
  expect(this.attackResult.passed).toBe(true);
});

Then('the detail message should confirm {string}', async function (keyword) {
  expect(this.attackResult.detail).toContain(keyword);
});
