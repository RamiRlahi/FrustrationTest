# Research and Benchmark Baseline

Date: 2026-06-26

## Project Under Test

This project is a vanilla Node.js and Playwright demo for login-flow frustration detection. The current implementation detects:

- Rage clicks on the login submit button.
- Repeated clicks on a locked SSO/passkey option.
- Repeated failed login attempts.
- Erratic mouse movement inside the login card.
- Repeated cancel/backtracking clicks.
- Once-per-session frustration survey display.
- Session recording with saved JSON test schemes.

## Benchmark Results

### Playwright End-to-End Suite

Command:

```powershell
npx.cmd playwright test --reporter=line
```

Result:

- 14 / 14 tests passed.
- Chromium and Firefox projects both passed.
- Runtime: 30.4 seconds.
- Recorder test produced 5 captured events in Chromium and 6 in Firefox before cleanup.

### Adversarial Audit

Command:

```powershell
npm.cmd run adversary
```

Result:

- Chromium: 12 / 12 attacks passed.
- Firefox optional pass: 12 / 12 attacks passed.
- Runtime observed from command execution: 71.4 seconds.

Coverage categories:

- Positive detection: passed.
- Negative suppression: passed.
- Boundary behavior just below threshold: passed.
- Reset-window behavior: passed.
- Recovery behavior after survey dismissal: passed.

## Research Takeaways

1. Interaction signals are a reasonable prototype basis.

   Recent research on frustration and stuckness detection supports using interaction patterns such as mouse dynamics and event sequences as lightweight signals. A 2026 Frustrometer paper found that mouse movements and gaze carried much of the predictive signal, while mouse movements alone were meaningfully predictive for some participants.

2. Mouse movement is useful but risky as a standalone signal.

   Mouse tracking research in web surveys found that cursor-derived features improved prediction of respondent difficulty over response-time-only models, especially when adjusted for individual baseline behavior. For this project, the current jitter rule should be treated as a heuristic, not a validated user-state classifier.

3. Clickstream frustration models usually need broader session context.

   A 2025 clickstream frustration paper defined frustration with multiple event families, including rage bursts, back-and-forth navigation, cart churn, search struggle, and wandering sessions. That supports this project's multi-signal approach, but suggests future benchmarking should measure session-level precision and recall rather than only single-trigger behavior.

4. Accessibility and input-assistance standards matter for login frustration.

   WCAG 2.2 includes success criteria for error identification, error suggestions, accessible authentication, and status messages. The login demo already gives text errors and suggestions, but benchmark coverage should eventually verify screen reader-visible status updates and keyboard-only operation.

## Baseline Assessment

Current model status: strong demo baseline.

The automated checks show the current thresholds are internally consistent across Chromium and Firefox. The project has a healthy starting benchmark because it tests:

- Expected detections.
- Near-threshold non-detections.
- Timeout resets.
- False-positive suppression.
- Survey recovery behavior.

The main gap is not failing automation; it is external validity. The current rules prove consistency against scripted scenarios, not accuracy against real user sessions.

## Recommended Next Benchmarks

1. Add a benchmark data set from recorded sessions.

   Use the existing recorder output as labeled fixtures, then replay sessions and compare expected triggers against actual triggers.

2. Track precision-style metrics.

   Add a JSON or markdown benchmark summary with counts for true positives, false positives, true negatives, and false negatives by signal type.

3. Add accessibility-oriented tests.

   Verify that validation errors, banners, modal state, and survey state are exposed through accessible roles, focus movement, and status semantics.

4. Add mobile and keyboard-only scenarios.

   Current tests focus on desktop mouse interactions. Login frustration can also come from touch targets, keyboard traps, focus loss, and password-manager friction.

5. Benchmark threshold sensitivity.

   Sweep click counts, timing windows, and jitter direction-change thresholds to identify where each signal starts over-triggering.

## Sources

- The Frustrometer: Detecting User Frustration in Data Visualization Tasks using Biomarkers and Interaction Patterns, arXiv, 2026: https://arxiv.org/abs/2606.13687
- Predicting respondent difficulty in web surveys: A machine-learning approach based on mouse movement features, arXiv, 2020: https://arxiv.org/abs/2011.06916
- Machine Learning to Predict Digital Frustration from Clickstream Data, arXiv, 2025: https://arxiv.org/abs/2512.20438
- Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation: https://www.w3.org/TR/WCAG22/
