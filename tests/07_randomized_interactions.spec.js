const { test, expect } = require('@playwright/test');

// Simple Mulberry32 seeded PRNG for reproducible pseudo-random test runs
function makePRNG(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test.describe('Stochastic & Randomized Interaction Tests', () => {
  test('Randomized click sequences on Login Submit verify threshold precision', async ({ page }) => {
    const rng = makePRNG(42);
    await page.goto('/index.html');
    await page.waitForSelector('#loginSubmit');

    // Run 3 randomized trials with random click counts between 2 and 7
    for (let trial = 0; trial < 3; trial++) {
      await page.goto('/index.html');
      await page.waitForSelector('#loginSubmit');

      const clickCount = Math.floor(rng() * 6) + 2; // 2 to 7 clicks
      const submitBtn = page.locator('#loginSubmit');
      const banner = page.locator('#rageClickBanner');

      for (let i = 0; i < clickCount; i++) {
        await submitBtn.click({ force: true });
        const delay = Math.floor(rng() * 200) + 50; // 50ms - 250ms
        await page.waitForTimeout(delay);
      }

      await page.waitForTimeout(300);
      const isBannerVisible = await banner.isVisible();

      if (clickCount >= 5) {
        expect(isBannerVisible).toBe(true);
      } else {
        expect(isBannerVisible).toBe(false);
      }
    }
  });

  test('Randomized mouse trajectories across Login Card test jitter robustness', async ({ page }) => {
    const rng = makePRNG(123);
    await page.goto('/index.html');
    await page.waitForSelector('#loginCard');

    const card = page.locator('#loginCard');
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    if (!box) return;

    // Trial 1: Smooth stochastic trajectory (should NOT trigger jitter)
    let currentX = box.x + 20;
    let currentY = box.y + 20;
    await page.mouse.move(currentX, currentY);

    for (let i = 0; i < 20; i++) {
      currentX += Math.floor(rng() * 10) + 5; // rightward trend
      currentY += (rng() - 0.5) * 4;           // minimal vertical noise
      await page.mouse.move(currentX, currentY);
      await page.waitForTimeout(20);
    }

    const jitterBanner = page.locator('#mouseJitterBanner');
    expect(await jitterBanner.isVisible()).toBe(false);
  });

  test('Randomized Leave application submits on Leave page', async ({ page }) => {
    const rng = makePRNG(999);
    await page.goto('/leave.html');
    await page.waitForSelector('#applyLeaveBtn');

    const applyBtn = page.locator('#applyLeaveBtn');

    // Click 4 times rapidly
    for (let i = 0; i < 4; i++) {
      await applyBtn.click({ force: true });
      await page.waitForTimeout(Math.floor(rng() * 100) + 50);
    }

    // Leave friction banner should appear
    const frictionBanner = page.locator('#leaveFrictionBanner');
    await expect(frictionBanner).toBeVisible();
  });
});
