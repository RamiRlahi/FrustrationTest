'use strict';

/**
 * ADVERSARIAL AI — ATTACK LIBRARY
 *
 * Each attack receives a Playwright `page` already loaded at '/'.
 * Returns: { attack, passed, frustrationFired, detail }
 *
 * Attack taxonomy:
 *   POSITIVE  — trigger should fire  (model must detect it)
 *   NEGATIVE  — trigger must be silent (model must not over-fire)
 *   BOUNDARY  — one below threshold  (boundary precision check)
 *   RESET     — time-window expires between bursts
 *   RECOVERY  — behaviour after a frustration event resolves
 */

// ─── shared helpers ──────────────────────────────────────────────────────────

async function isVisible(page, selector) {
  return page.locator(selector).isVisible();
}

// ─── 1. slowRageClick [POSITIVE] ────────────────────────────────────────────
// Click submit 5 times with 500ms between each (total span ≈ 2s < 3s window)
async function slowRageClick(page) {
  const submitBtn = page.locator('#loginSubmit');

  for (let i = 0; i < 5; i++) {
    await submitBtn.click({ force: true });
    if (i < 4) await page.waitForTimeout(500);
  }

  await page.waitForTimeout(200);
  const fired = await isVisible(page, '#rageClickBanner');
  return {
    attack: 'slowRageClick',
    passed: fired === true,
    frustrationFired: fired,
    detail: fired
      ? 'Banner fires correctly for slow-but-within-window rage clicks'
      : 'FAIL: Banner silent — model missed slow rage within the 3s window',
  };
}

// ─── 2. almostRageClick [BOUNDARY / NEGATIVE] ────────────────────────────────
// Click only 4 times rapidly. Threshold is 5 — model must NOT fire.
async function almostRageClick(page) {
  const submitBtn = page.locator('#loginSubmit');

  for (let i = 0; i < 4; i++) {
    await submitBtn.click({ force: true });
  }

  await page.waitForTimeout(300);
  const fired = await isVisible(page, '#rageClickBanner');
  return {
    attack: 'almostRageClick',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Banner fires at only 4 clicks — model over-triggers below threshold'
      : 'Correctly silent at 4 clicks (threshold = 5)',
  };
}

// ─── 3. rageClickReset [RESET / NEGATIVE] ────────────────────────────────────
// 3 clicks → wait 4s (beyond the 3s filter window) → 3 more clicks.
// Counter must expire between bursts. Model must NOT fire.
async function rageClickReset(page) {
  const submitBtn = page.locator('#loginSubmit');

  for (let i = 0; i < 3; i++) {
    await submitBtn.click({ force: true });
  }
  await page.waitForTimeout(4000); // clears the 3s timestamp filter

  for (let i = 0; i < 3; i++) {
    await submitBtn.click({ force: true });
  }

  await page.waitForTimeout(300);
  const fired = await isVisible(page, '#rageClickBanner');
  return {
    attack: 'rageClickReset',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Banner fires across two separate 3-click bursts — window filter broken'
      : 'Counter resets correctly after 3s gap — two bursts of 3 produce no detection',
  };
}

// ─── 4. ssoSingleClick [POSITIVE — first-tier response] ─────────────────────
// One SSO click must show the "disabled" notice, NOT the "locked" escalation.
// Tests the two-tier SSO response: 1–2 clicks → soft notice, 3+ → hard lock.
async function ssoSingleClick(page) {
  const ssoBtn = page.locator('#ssoSubmit');
  const tooltip = page.locator('#ssoTooltip');

  await ssoBtn.click({ force: true });
  await page.waitForTimeout(200);

  const visible = await tooltip.isVisible();
  const text = visible ? (await tooltip.textContent() || '') : '';
  const correct = visible && text.includes('disabled') && !text.includes('locked');

  return {
    attack: 'ssoSingleClick',
    passed: correct,
    frustrationFired: false,
    detail: correct
      ? 'Single SSO click → "disabled" first-tier notice (correct)'
      : `FAIL: Unexpected tooltip state — visible=${visible}, text="${text.trim()}"`,
  };
}

// ─── 5. ssoExactThreshold [POSITIVE — escalation] ───────────────────────────
// Exactly 3 rapid SSO clicks must escalate to the "locked" message.
async function ssoExactThreshold(page) {
  const ssoBtn = page.locator('#ssoSubmit');
  const tooltip = page.locator('#ssoTooltip');

  for (let i = 0; i < 3; i++) {
    await ssoBtn.click({ force: true });
    await page.waitForTimeout(80);
  }

  await page.waitForTimeout(200);
  const visible = await tooltip.isVisible();
  const text = visible ? (await tooltip.textContent() || '') : '';
  const escalated = visible && text.includes('locked');

  return {
    attack: 'ssoExactThreshold',
    passed: escalated,
    frustrationFired: escalated,
    detail: escalated
      ? '3rd SSO click correctly escalates to "temporarily locked" message'
      : `FAIL: No escalation at exactly 3 clicks — visible=${visible}, text="${text.trim()}"`,
  };
}

// ─── 6. loginFailThenSucceed [NEGATIVE] ──────────────────────────────────────
// Fail twice then succeed with valid credentials.
// Magic link banner must stay hidden (only 2 failures, threshold = 3).
async function loginFailThenSucceed(page) {
  const email = page.locator('#email');
  const password = page.locator('#password');
  const submit = page.locator('#loginSubmit');

  for (let i = 0; i < 2; i++) {
    await email.fill('adversary@acme.com');
    await password.fill('BadPassw0rd!');
    await submit.click();
    await page.waitForTimeout(600);
  }

  await email.fill('admin@Talan.com');
  await password.fill('password123');
  await submit.click();
  await page.waitForTimeout(400);

  const fired = await isVisible(page, '#magicLinkBanner');
  return {
    attack: 'loginFailThenSucceed',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Magic link fires after only 2 failures — threshold miscounted'
      : '2 failures + success correctly suppresses magic link banner',
  };
}

// ─── 7. loginFailExactThreshold [POSITIVE] ───────────────────────────────────
// Fail exactly 3 times — model must offer the magic link banner.
async function loginFailExactThreshold(page) {
  const email = page.locator('#email');
  const password = page.locator('#password');
  const submit = page.locator('#loginSubmit');

  for (let i = 0; i < 3; i++) {
    await email.fill('adversary@acme.com');
    await password.fill('BadPassw0rd!');
    await submit.click();
    await page.waitForTimeout(600);
  }

  const fired = await isVisible(page, '#magicLinkBanner');
  return {
    attack: 'loginFailExactThreshold',
    passed: fired === true,
    frustrationFired: fired,
    detail: fired
      ? '3 failures correctly triggers magic link banner'
      : 'FAIL: Magic link banner absent after 3 failures',
  };
}

// ─── 8. gentleMouseMovement [NEGATIVE] ───────────────────────────────────────
// Move the mouse in a smooth horizontal line — no direction reversals at all.
// Jitter banner must stay hidden (zero sharp angle changes).
async function gentleMouseMovement(page) {
  const card = page.locator('#loginCard');
  const box = await card.boundingBox();
  if (!box) throw new Error('loginCard bounding box not found');

  const startX = box.x + 10;
  const centerY = box.y + box.height / 2;

  // 25 smooth rightward steps — same direction throughout, m > 5 but angle ≈ 0°
  await page.mouse.move(startX, centerY);
  for (let i = 0; i < 25; i++) {
    await page.mouse.move(startX + i * 8, centerY);
    await page.waitForTimeout(20);
  }

  const fired = await isVisible(page, '#mouseJitterBanner');
  return {
    attack: 'gentleMouseMovement',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Jitter false-positive on smooth linear movement'
      : 'Smooth arc produces zero direction changes — no jitter detected',
  };
}

// ─── 9. borderlineJitter [BOUNDARY / NEGATIVE] ───────────────────────────────
// Fill the 20-sample buffer with neutral moves, then make exactly 5 zigzag
// moves. 5 points create ≤ 4 direction-change events (threshold is ≥ 5).
// Model must NOT trigger.
async function borderlineJitter(page) {
  const card = page.locator('#loginCard');
  const box = await card.boundingBox();
  if (!box) throw new Error('loginCard bounding box not found');

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Phase 1: 16 neutral rightward moves to prime the sample buffer
  await page.mouse.move(centerX - 80, centerY);
  for (let i = 0; i < 16; i++) {
    await page.mouse.move(centerX - 80 + i * 5, centerY);
    await page.waitForTimeout(20);
  }

  // Phase 2: exactly 5 zigzag moves (alternating ±60px)
  // With 5 reversal points, the consecutive-triplet analysis detects
  // at most 4 angle-change events — one below the ≥ 5 threshold.
  for (let i = 0; i < 5; i++) {
    const offset = i % 2 === 0 ? 60 : -60;
    await page.mouse.move(centerX + offset, centerY);
    await page.waitForTimeout(30);
  }

  await page.waitForTimeout(200);
  const fired = await isVisible(page, '#mouseJitterBanner');
  return {
    attack: 'borderlineJitter',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Jitter triggered at only 4 direction changes — threshold should be ≥ 5'
      : '5 zigzag moves (4 reversals) correctly stays below jitter threshold',
  };
}

// ─── 10. backtrackTwice [BOUNDARY / NEGATIVE] ────────────────────────────────
// Click cancel exactly 2 times. Threshold is 3 — model must NOT show modal.
async function backtrackTwice(page) {
  const cancelBtn = page.locator('#cancelButton');

  for (let i = 0; i < 2; i++) {
    await cancelBtn.click({ force: true });
    await page.waitForTimeout(100);
  }

  await page.waitForTimeout(300);
  const fired = await isVisible(page, '#reversionModal');
  return {
    attack: 'backtrackTwice',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Reversion modal appears on only 2 cancel clicks — over-triggered'
      : '2 cancel clicks correctly produces no modal (threshold = 3)',
  };
}

// ─── 11. backtrackTimeout [RESET / NEGATIVE] ─────────────────────────────────
// Click cancel 2×, wait 3s (beyond the 2s reset timeout), click 2× more.
// Both bursts are below threshold and separated by a counter reset.
// Model must NOT show modal.
async function backtrackTimeout(page) {
  const cancelBtn = page.locator('#cancelButton');

  for (let i = 0; i < 2; i++) {
    await cancelBtn.click({ force: true });
    await page.waitForTimeout(100);
  }

  await page.waitForTimeout(3000); // beyond the 2s backtrack reset window

  for (let i = 0; i < 2; i++) {
    await cancelBtn.click({ force: true });
    await page.waitForTimeout(100);
  }

  await page.waitForTimeout(300);
  const fired = await isVisible(page, '#reversionModal');
  return {
    attack: 'backtrackTimeout',
    passed: fired === false,
    frustrationFired: fired,
    detail: fired
      ? 'FAIL: Modal fires across two separate 2-click bursts — timeout reset broken'
      : 'Counter resets after 2s gap — two separate bursts of 2 produce no modal',
  };
}

// ─── 12. surveyDoesNotReTrigger [RECOVERY / NEGATIVE] ────────────────────────
// Trigger survey via rage click → dismiss it → rage click again.
// Survey must NOT re-appear — it is shown exactly once per session.
async function surveyDoesNotReTrigger(page) {
  const submitBtn = page.locator('#loginSubmit');
  const surveyOverlay = page.locator('#surveyOverlay');
  const surveyDismiss = page.locator('#surveyDismiss');

  // First rage: survey must appear
  for (let i = 0; i < 5; i++) {
    await submitBtn.click({ force: true });
  }
  await page.waitForTimeout(300);

  const firstAppear = await surveyOverlay.isVisible();
  if (!firstAppear) {
    return {
      attack: 'surveyDoesNotReTrigger',
      passed: false,
      frustrationFired: false,
      detail: 'FAIL: Survey did not appear on first rage — prerequisite failed',
    };
  }

  // Dismiss the survey
  await surveyDismiss.click();
  await page.waitForTimeout(300);

  // Second rage: 5 more rapid clicks — survey must NOT re-open
  for (let i = 0; i < 5; i++) {
    await submitBtn.click({ force: true });
  }
  await page.waitForTimeout(300);

  const reAppeared = await surveyOverlay.isVisible();
  return {
    attack: 'surveyDoesNotReTrigger',
    passed: reAppeared === false,
    frustrationFired: reAppeared,
    detail: reAppeared
      ? 'FAIL: Survey re-appeared after dismiss — must only show once per session'
      : 'Survey correctly suppressed after dismiss (once-per-session enforced)',
  };
}

module.exports = {
  slowRageClick,
  almostRageClick,
  rageClickReset,
  ssoSingleClick,
  ssoExactThreshold,
  loginFailThenSucceed,
  loginFailExactThreshold,
  gentleMouseMovement,
  borderlineJitter,
  backtrackTwice,
  backtrackTimeout,
  surveyDoesNotReTrigger,
};
