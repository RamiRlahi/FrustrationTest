'use strict';

/**
 * ADVERSARIAL AI — CLI RUNNER
 *
 * Launches the local server, runs all 12 adversarial attacks against
 * Chromium (required) and Firefox (optional), and prints a structured report.
 *
 * Usage:  npm run adversary
 * Exit:   0 = all Chromium attacks passed,  1 = one or more failed
 */

const { spawn } = require('child_process');
const http      = require('http');
const path      = require('path');
const { launchSandbox } = require('./sandbox');
const attacks   = require('./adversary');

const BASE_URL = 'http://127.0.0.1:3000';

// ─── Attack registry ─────────────────────────────────────────────────────────
const ATTACKS = [
  { fn: attacks.slowRageClick,           label: '1.  slowRageClick          ', type: 'POSITIVE'  },
  { fn: attacks.almostRageClick,         label: '2.  almostRageClick        ', type: 'BOUNDARY'  },
  { fn: attacks.rageClickReset,          label: '3.  rageClickReset         ', type: 'RESET'     },
  { fn: attacks.ssoSingleClick,          label: '4.  ssoSingleClick         ', type: 'POSITIVE'  },
  { fn: attacks.ssoExactThreshold,       label: '5.  ssoExactThreshold      ', type: 'POSITIVE'  },
  { fn: attacks.loginFailThenSucceed,    label: '6.  loginFailThenSucceed   ', type: 'NEGATIVE'  },
  { fn: attacks.loginFailExactThreshold, label: '7.  loginFailExactThreshold', type: 'POSITIVE'  },
  { fn: attacks.gentleMouseMovement,     label: '8.  gentleMouseMovement    ', type: 'NEGATIVE'  },
  { fn: attacks.borderlineJitter,        label: '9.  borderlineJitter       ', type: 'BOUNDARY'  },
  { fn: attacks.backtrackTwice,          label: '10. backtrackTwice         ', type: 'BOUNDARY'  },
  { fn: attacks.backtrackTimeout,        label: '11. backtrackTimeout       ', type: 'RESET'     },
  { fn: attacks.surveyDoesNotReTrigger,  label: '12. surveyDoesNotReTrigger ', type: 'RECOVERY'  },
];

// ─── ANSI colour helpers ──────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
};

// ─── Server management ────────────────────────────────────────────────────────
async function isPortOpen() {
  return new Promise(resolve => {
    http.get(BASE_URL, res => { res.resume(); resolve(true); })
        .on('error', () => resolve(false));
  });
}

async function startServerIfNeeded() {
  if (await isPortOpen()) {
    console.log(`  ${C.yellow}Port 3000 already in use — reusing existing server${C.reset}`);
    return null; // caller must not kill a server it didn't start
  }
  const serverPath = path.join(__dirname, '..', '..', 'server.js');
  const proc = spawn('node', [serverPath], { stdio: 'pipe' });
  proc.stderr.on('data', d => process.stderr.write(d));
  // Wait until the server accepts connections
  for (let i = 0; i < 25; i++) {
    if (await isPortOpen()) return proc;
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server at ${BASE_URL} did not become ready in time`);
}

// ─── Run one browser pass ─────────────────────────────────────────────────────
async function runAttacks(browserType) {
  const results = [];
  for (const { fn, label, type } of ATTACKS) {
    const { page, close } = await launchSandbox(browserType);
    try {
      const result = await fn(page);
      results.push({ ...result, label, type });
    } catch (err) {
      results.push({
        attack: label.trim(),
        label,
        type,
        passed: false,
        frustrationFired: false,
        detail: `ERROR: ${err.message}`,
      });
    } finally {
      await close();
    }
  }
  return results;
}

// ─── Reporter ─────────────────────────────────────────────────────────────────
const TYPE_COLOR = {
  POSITIVE: C.green,
  NEGATIVE: C.red,
  BOUNDARY: C.cyan,
  RESET:    C.yellow,
  RECOVERY: C.grey,
};

function printReport(results, browserLabel, optional = false) {
  const tag = optional ? `${C.yellow} [optional]${C.reset}` : '';
  console.log(`\n${C.bold}  ▸ ${browserLabel}${C.reset}${tag}`);
  console.log(`  ${'─'.repeat(72)}`);

  let passed = 0;
  for (const r of results) {
    const status  = r.passed ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
    const typeTag = `${TYPE_COLOR[r.type] || ''}${r.type.padEnd(8)}${C.reset}`;
    console.log(`  ${status}  ${typeTag}  ${r.label}  ${C.grey}${r.detail}${C.reset}`);
    if (r.passed) passed++;
  }

  console.log(`  ${'─'.repeat(72)}`);
  const allPassed = passed === results.length;
  const countColor = allPassed ? C.green : C.red;
  console.log(`  ${countColor}${C.bold}${passed} / ${results.length} passed${C.reset}\n`);
  return allPassed;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║       ADVERSARIAL AI — FRUSTRATION MODEL AUDIT           ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`\n  ${C.grey}Taxonomy:  POSITIVE=must detect  NEGATIVE=must not fire  BOUNDARY=one-below-threshold  RESET=window-expiry  RECOVERY=post-event${C.reset}\n`);

  console.log(`  Checking server...`);
  const serverProc = await startServerIfNeeded(); // null if server already running
  if (serverProc) {
    console.log(`  ${C.green}Server started${C.reset} at ${BASE_URL}\n`);
  } else {
    console.log(`  ${C.green}Server ready${C.reset} at ${BASE_URL}\n`);
  }

  let chromiumPassed = false;

  try {
    // ── Chromium (required) ──────────────────────────────────────────────────
    console.log(`  Running ${ATTACKS.length} attacks on ${C.bold}Chromium${C.reset}...`);
    const chromiumResults = await runAttacks('chromium');
    chromiumPassed = printReport(chromiumResults, 'Chromium');

    // ── Firefox (optional) ───────────────────────────────────────────────────
    console.log(`  Running ${ATTACKS.length} attacks on ${C.bold}Firefox${C.reset} (optional)...`);
    try {
      const firefoxResults = await runAttacks('firefox');
      const ffPassed = printReport(firefoxResults, 'Firefox', true);
      if (!ffPassed) {
        console.log(`  ${C.yellow}⚠  Firefox failures noted — non-blocking${C.reset}\n`);
      }
    } catch (err) {
      console.log(`  ${C.yellow}⚠  Firefox skipped: ${err.message}${C.reset}\n`);
    }

  } finally {
    // Only kill the server if we were the one who started it
    if (serverProc) serverProc.kill();
  }

  // ── Final verdict ────────────────────────────────────────────────────────────
  console.log('═'.repeat(62));
  if (chromiumPassed) {
    console.log(`${C.bold}${C.green}  ✓  All Chromium attacks passed — model is adversarially validated${C.reset}`);
  } else {
    console.log(`${C.bold}${C.red}  ✗  Chromium attacks failed — frustration model has edge-case gaps${C.reset}`);
  }
  console.log(`${'═'.repeat(62)}\n`);

  process.exit(chromiumPassed ? 0 : 1);
}

main().catch(err => {
  console.error(`${C.red}Fatal:${C.reset}`, err.message);
  process.exit(1);
});
