const { test, expect } = require('@playwright/test');

// Mark the suite as slow (gives 3x the default timeout for slower OS environments)
test.slow();

test.beforeEach(async ({ page }) => {
  // nestanew yodkhol lel page kbal
  await page.goto('/');
});
///el rage clicks meloul
test('1. Should detect Rage Clicking (fast clicks) on submit button', async ({ page }) => {
  const submitBtn = page.locator('#loginSubmit');
  const rageBanner = page.locator('#rageClickBanner');

  // banner mtaa rage melloul lezem mkhobi
  await expect(rageBanner).toBeHidden();

  // Click rapidly 5 times
  for (let i = 0; i < 5; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }

  // Verify assistance banner is displayed
  await expect(rageBanner).toBeVisible();
  await expect(rageBanner).toContainText('Need assistance?');
});


test('2. Should detect Rage Clicking on the locked SSO module', async ({ page }) => {
  const ssoBtn = page.locator('#ssoSubmit');
  const tooltip = page.locator('#ssoTooltip');

  await expect(tooltip).toBeHidden();

  // Click it once to see normal notice
  await ssoBtn.click({ force: true });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('disabled');

  // Click it 3 times to trigger frustration response (SSO locked warning)
  for (let i = 0; i < 3; i++) {
    await ssoBtn.click({ force: true });
  }

  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('SSO is temporarily locked');
});

test('3. Should detect Repeated Login Failures and offer Magic Link', async ({ page }) => {
  const emailInput = page.locator('#email');
  const passwordInput = page.locator('#password');
  const submitBtn = page.locator('#loginSubmit');
  const magicLinkBanner = page.locator('#magicLinkBanner');

  await expect(magicLinkBanner).toBeHidden();

  // Enter bad credentials and submit 3 times
  for (let i = 0; i < 3; i++) {
    await emailInput.fill('baduser@acme.com');
    await passwordInput.fill('WrongPassword123');
    await submitBtn.click();
    
    // Wait for shake animation to finish to ensure we click correctly
    await page.waitForTimeout(500);
  }

  // Verify magic link suggestion is displayed
  await expect(magicLinkBanner).toBeVisible();
  await expect(magicLinkBanner).toContainText('Too many failed attempts');
});

test('4. Should detect Mouse Jitters (erratic mouse movement)', async ({ page }) => {
  const jitterBanner = page.locator('#mouseJitterBanner');
  const card = page.locator('#loginCard');

  await expect(jitterBanner).toBeHidden();

  // Find card location and dimensions
  const box = await card.boundingBox();
  if (!box) throw new Error('Card not found');

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Move to center of card
  await page.mouse.move(centerX, centerY);

  // Make rapid zig-zag (back-and-forth) gestures to simulate nervous shaking
  for (let i = 0; i < 25; i++) {
    const offset = i % 2 === 0 ? 60 : -60;
    await page.mouse.move(centerX + offset, centerY);
    await page.waitForTimeout(30); // small delay to simulate human-scale jittering
  }

  // Verify the jitter detection banner popped up
  await expect(jitterBanner).toBeVisible();
  await expect(jitterBanner).toContainText('Feeling stuck?');
});

test('5. Should detect Backtracking (repeated back/cancel clicks)', async ({ page }) => {
  const cancelBtn = page.locator('#cancelButton');
  const confirmModal = page.locator('#reversionModal');

  await expect(confirmModal).toBeHidden();

  // Click "Cancel & Go Back" 3 times
  for (let i = 0; i < 3; i++) {
    await cancelBtn.click({ force: true });
  }

  // Verify the reversion check modal is active
  await expect(confirmModal).toBeVisible();
  await expect(confirmModal).toContainText('Need to head back?');

  // Click "Stay Here" to dismiss the modal
  await page.locator('#modalContinue').click();
  await expect(confirmModal).toBeHidden();
});

test('6. Should display frustration survey overlay and allow submitting a rating', async ({ page }) => {
  const submitBtn = page.locator('#loginSubmit');
  const surveyOverlay = page.locator('#surveyOverlay');
  const slider = page.locator('#frustrationSlider');
  const submitFeedbackBtn = page.locator('#surveySubmit');
  const feedbackMsg = page.locator('#surveyFeedback');

  await expect(surveyOverlay).toBeHidden();

  // Trigger frustration via rage clicking
  for (let i = 0; i < 5; i++) {
    await submitBtn.dispatchEvent('pointerdown');
  }

  // Survey overlay should be visible
  await expect(surveyOverlay).toBeVisible();

  // Slide frustration level to 5
  await slider.fill('5');
  
  // Submit feedback
  await submitFeedbackBtn.click();

  // Success message should appear
  await expect(feedbackMsg).toBeVisible();
  await expect(feedbackMsg).toContainText('Thank you');

  // Verify that the custom HTML attribute reflecting the submitted rating was set
  await expect(surveyOverlay).toHaveAttribute('data-submitted-rating', '5');
});
