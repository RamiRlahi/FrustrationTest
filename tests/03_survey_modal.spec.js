const { test, expect } = require('@playwright/test');
const LoginPage = require('../features/pages/LoginPage');
const FrustrationSurveyModal = require('../features/pages/FrustrationSurveyModal');

test.slow();

test.describe('Frustration Survey Overlay Specs', () => {
  let loginPage;
  let surveyModal;

  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank', { waitUntil: 'load' }); // Reset navigation state between tests
    loginPage = new LoginPage(page);
    surveyModal = new FrustrationSurveyModal(page);
    await loginPage.navigate();
    await page.waitForSelector('#loginSubmit', { state: 'visible' });
  });

  test('Should display frustration survey overlay and allow submitting a rating', async () => {
    await expect(surveyModal.surveyOverlay).toBeHidden();

    // Fallback score needs >= 0.5 to trigger survey.
    // failedAttempts >= 3 contributes 0.35, loginSubmitClicks >= 5 contributes 0.45 → total 0.80
    // Do 3 failed logins first to set failedAttempts = 3
    await loginPage.submitInvalidCredentials(3);

    // Then dispatch 5 rapid pointerdown events to reach loginSubmitClicks >= 5
    await loginPage.dispatchPointerDownSubmit(5);

    // Combined score 0.80 exceeds 0.50 threshold — survey should now appear
    await expect(surveyModal.surveyOverlay).toBeVisible();

    await surveyModal.setSliderValue('5');
    await surveyModal.submit();

    await expect(surveyModal.surveyFeedback).toBeVisible();
    await expect(surveyModal.surveyFeedback).toContainText('Thank you');
    await expect(surveyModal.surveyOverlay).toHaveAttribute('data-submitted-rating', '5');
  });
});
