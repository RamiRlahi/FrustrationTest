const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class FrustrationSurveyModal extends BasePage {
  constructor(page) {
    super(page);
    this.surveyOverlay = page.locator('#surveyOverlay');
    this.surveyDismiss = page.locator('#surveyDismiss');
    this.frustrationSlider = page.locator('#frustrationSlider');
    this.surveySubmit = page.locator('#surveySubmit');
    this.ratingDisplay = page.locator('#ratingDisplay');
    this.surveyFeedback = page.locator('#surveyFeedback');
  }

  async dismiss() {
    await this.surveyDismiss.click();
  }

  async setSliderValue(val) {
    await this.frustrationSlider.fill(val);
  }

  async submit() {
    await this.surveySubmit.click();
  }
}

module.exports = FrustrationSurveyModal;
