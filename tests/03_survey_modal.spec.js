const { test, expect } = require('@playwright/test');
const LoginPage = require('../features/pages/LoginPage');
const FrustrationSurveyModal = require('../features/pages/FrustrationSurveyModal');

test.slow();

test.describe('Frustration Survey Overlay Specs', () => {
  let loginPage;
  let surveyModal;

  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank', { waitUntil: 'load' });
    loginPage = new LoginPage(page);
    surveyModal = new FrustrationSurveyModal(page);
    await loginPage.navigate();
    await page.waitForSelector('#loginSubmit', { state: 'visible' });
  });

  test('Should display frustration survey overlay and allow submitting a rating', async () => {
    await expect(surveyModal.surveyOverlay).toBeHidden();

    await loginPage.submitInvalidCredentials(3);
    await loginPage.dispatchPointerDownSubmit(5);

    await expect(surveyModal.surveyOverlay).toBeVisible();

    await surveyModal.setSliderValue('5');
    await surveyModal.submit();

    await expect(surveyModal.surveyFeedback).toBeVisible();
    await expect(surveyModal.surveyFeedback).toContainText('Thank you');
    await expect(surveyModal.surveyOverlay).toHaveAttribute('data-submitted-rating', '5');
  });
});
