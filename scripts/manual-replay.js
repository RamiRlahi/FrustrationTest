'use strict';

/**
 * MANUAL SESSION REPLAY & BENCHMARK HARNESS
 * =========================================
 * Loads all session JSON files recorded via the UI widget in `scripts/manual test schemes/`,
 * replays their event streams against the detection rules, and benchmarks accuracy,
 * precision, recall, and false positive metrics.
 *
 * Usage: node scripts/manual-replay.js
 */

const fs = require('fs');
const path = require('path');

const SCHEMES_DIR = path.join(__dirname, 'manual test schemes');
const OUTPUT_FILE = path.join(__dirname, '..', 'test-results', 'manual-replay-report.json');

// Replay engine evaluating event streams against rule thresholds
function replaySession(session) {
  const events = session.events || [];
  const expected = session.frustrationDetected || {};

  let detected = {
    rageClick: false,
    ssoLocked: false,
    magicLink: false,
    mouseJitter: false,
    backtrack: false,
  };

  // State
  let rageTimestamps = [];
  let ssoCount = 0;
  let cancelCount = 0;
  let lastCancelTime = 0;
  let mousePath = [];

  for (const evt of events) {
    if (evt.type === 'click') {
      const t = evt.time || 0;
      const target = evt.target || '';

      // 1. Rage Click Check (#loginSubmit, #punchBtn, #applyLeaveBtn)
      if (['#loginSubmit', '#punchBtn', '#applyLeaveBtn'].includes(target)) {
        rageTimestamps.push(t);
        rageTimestamps = rageTimestamps.filter((ts) => t - ts <= 3000);
        if (rageTimestamps.length >= 5) {
          detected.rageClick = true;
        }
      }

      // 2. SSO Lock Check (#ssoSubmit)
      if (target === '#ssoSubmit') {
        ssoCount++;
        if (ssoCount >= 3) {
          detected.ssoLocked = true;
        }
      }

      // 3. Backtrack Check (#cancelButton, #logoutBtn)
      if (['#cancelButton', '#logoutBtn'].includes(target)) {
        if (t - lastCancelTime > 2000) cancelCount = 0;
        cancelCount++;
        lastCancelTime = t;
        if (cancelCount >= 3) {
          detected.backtrack = true;
        }
      }
    }

    // 4. Trigger events recorded by front-end
    if (evt.type === 'trigger' && evt.triggerType) {
      if (evt.triggerType in detected) {
        detected[evt.triggerType] = true;
      }
    }

    // 5. Mouse Jitter
    if (evt.type === 'mousemove') {
      mousePath.push({ x: evt.x, y: evt.y });
      if (mousePath.length > 20) mousePath.shift();
      if (mousePath.length === 20) {
        let reversals = 0;
        for (let i = 2; i < mousePath.length; i++) {
          const p1 = mousePath[i - 2];
          const p2 = mousePath[i - 1];
          const p3 = mousePath[i];
          const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
          const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
          const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (m1 > 5 && m2 > 5) {
            const dot = v1.x * v2.x + v1.y * v2.y;
            const cosT = Math.max(-1, Math.min(1, dot / (m1 * m2)));
            if (Math.acos(cosT) * (180 / Math.PI) > 110) reversals++;
          }
        }
        if (reversals >= 5) detected.mouseJitter = true;
      }
    }
  }

  // Any frustration flag true = frustrated
  const expectedFrustrated = Object.values(expected).some(Boolean);
  const detectedFrustrated = Object.values(detected).some(Boolean);

  return {
    name: session.name || 'unnamed',
    expected,
    detected,
    expectedFrustrated,
    detectedFrustrated,
    matched: expectedFrustrated === detectedFrustrated,
  };
}

function runReplay() {
  console.log('\n==================================================');
  console.log('  MANUAL TEST SESSION REPLAY & BENCHMARK HARNESS');
  console.log('==================================================\n');

  if (!fs.existsSync(SCHEMES_DIR)) {
    console.error(`Directory not found: ${SCHEMES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SCHEMES_DIR).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} recorded session files in ${SCHEMES_DIR}\n`);

  let tp = 0, fp = 0, tn = 0, fn = 0;
  const sessionResults = [];

  for (const file of files) {
    const filePath = path.join(SCHEMES_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const session = JSON.parse(raw);
      const res = replaySession(session);

      sessionResults.push(res);

      if (res.expectedFrustrated && res.detectedFrustrated) tp++;
      else if (!res.expectedFrustrated && res.detectedFrustrated) fp++;
      else if (!res.expectedFrustrated && !res.detectedFrustrated) tn++;
      else if (res.expectedFrustrated && !res.detectedFrustrated) fn++;

      const status = res.matched ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      console.log(`  ${status}  ${file.padEnd(42)}  exp=${res.expectedFrustrated} det=${res.detectedFrustrated}`);
    } catch (err) {
      console.error(`  \x1b[31mERROR\x1b[0m reading ${file}: ${err.message}`);
    }
  }

  const total = tp + fp + tn + fn;
  const accuracy = total ? (tp + tn) / total : 0;
  const precision = (tp + fp) ? tp / (tp + fp) : 1.0;
  const recall = (tp + fn) ? tp / (tp + fn) : 1.0;
  const f1 = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;

  console.log('\n--------------------------------------------------');
  console.log(`Total Replayed Sessions: ${total}`);
  console.log(`True Positives (TP) : ${tp}`);
  console.log(`True Negatives (TN) : ${tn}`);
  console.log(`False Positives (FP): ${fp}`);
  console.log(`False Negatives (FN): ${fn}`);
  console.log(`Accuracy           : ${(accuracy * 100).toFixed(1)}%`);
  console.log(`Precision          : ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall             : ${(recall * 100).toFixed(1)}%`);
  console.log(`F1 Score           : ${f1.toFixed(3)}`);
  console.log('--------------------------------------------------\n');

  const report = {
    totalSessions: total,
    metrics: { tp, fp, tn, fn, accuracy, precision, recall, f1 },
    sessions: sessionResults,
    timestamp: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`Saved replay metrics report to: ${OUTPUT_FILE}\n`);
}

runReplay();
