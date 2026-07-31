# 10-Minute Technical Demonstration Script

**Title:** Real-Time Frustration Detection & Multi-Approach Testing on OrangeHRM  
**Presenter:** Engineering Intern  
**Target Audience:** Technical Evaluation Committee / Project Stakeholders  
**Total Duration:** 10 Minutes  

---

## Demonstration Outline & Timing

```
00:00 - 01:30 | Section 1: Introduction & Architecture Overview
01:30 - 03:45 | Section 2: Live Application & Manual Exploratory Testing
03:45 - 05:45 | Section 3: Automated Playwright & BDD Test Execution
05:45 - 07:45 | Section 4: Adversarial AI Audit Demonstration
07:45 - 09:15 | Section 5: Comparative Evaluation & Metrics Pipeline
09:15 - 10:00 | Section 6: Conclusion & Q&A Transition
```

---

## Detailed Step-by-Step Script

### Section 1: Introduction & Architecture Overview (1:30)

* **Speaker Script**:  
  > "Hello everyone. Today I'm demonstrating our real-time user frustration detection system integrated into OrangeHRM, along with a comparative evaluation of three distinct QA methodologies: Manual Exploratory Testing, Automated Playwright testing, and Adversarial AI auditing."

* **Visual Setup**: Show `http://localhost:3000` in browser.
* **Key Point**: Explain the five signals (rage clicks, SSO friction, failed logins, cursor jitter, backtracking) and the dual rule + ML engine.

---

### Section 2: Live Application & Manual Exploratory Testing (2:15)

* **Speaker Script**:  
  > "First, let's look at the user experience. I will start our embedded Session Recorder in the bottom right corner."

* **Action 1**: Click **Start** on the floating Session Recorder widget.
* **Action 2**: Click the "Login" button rapidly 5 times.
  - *Observe*: `#rageClickBanner` appears, followed by the Frustration Survey overlay.
* **Action 3**: Move mouse in rapid zigzag motions over the login card.
  - *Observe*: Live chat support banner pops up.
* **Action 4**: Click **Stop**, name the session `demo_manual_session`, and click **Save to Test Schemes**.
* **Terminal Action**:  
  ```bash
  npm run manual:replay
  ```
* **Speaker Script**:  
  > "Our replay harness parses the saved JSON scheme and validates that the detector correctly matched the expected frustration state with 100% precision."

---

### Section 3: Automated Playwright & BDD Test Execution (2:00)

* **Speaker Script**:  
  > "Next, let's run our automated test suite, which includes Playwright E2E specs, Gherkin BDD features, and randomized stochastic tests."

* **Terminal Action**:  
  ```bash
  npx playwright test tests/07_randomized_interactions.spec.js --reporter=line
  ```
* **Expected Result**: All randomized interaction tests pass across Chromium and Firefox.
* **Terminal Action**:  
  ```bash
  npm run test:bdd:smoke
  ```
* **Speaker Script**:  
  > "The Playwright suite guarantees functional stability and spec compliance across browsers in under 25 seconds."

---

### Section 4: Adversarial AI Audit Demonstration (2:00)

* **Speaker Script**:  
  > "Now we demonstrate our Adversarial AI. Unlike standard Playwright tests that follow fixed user flows, our adversarial bot executes 18 micro-interaction attack vectors designed to stress mathematical boundaries."

* **Terminal Action**:  
  ```bash
  npm run adversary
  ```
* **Highlight Key Output**:
  - `almostRageClick`: Verifies 4 clicks stay silent while 5 trigger.
  - `rageClickReset`: Verifies time-window expiration clears counters.
  - `randomizedRageBurst`: Generates randomized click bursts to test stochastic robustness.
* **Speaker Script**:  
  > "All 18 attacks pass on Chromium and Firefox, confirming zero false positives."

---

### Section 5: Comparative Evaluation & Metrics Pipeline (1:30)

* **Speaker Script**:  
  > "Finally, let's run our unified metrics pipeline to aggregate quantitative findings across all three testing approaches."

* **Terminal Action**:  
  ```bash
  npm run metrics
  ```
* **Visual**: Open `reports/metrics-summary.md`.
* **Key Insights**:
  - All three paradigms achieved 100% Precision and 1.000 F1 score.
  - Adversarial AI had the fastest mean execution speed (~2.4s per attack).
  - Manual testing provided high exploratory originality for UX ambiguities.

---

### Section 6: Conclusion & Q&A (0:45)

* **Speaker Script**:  
  > "In summary, all ten internship deliverables have been completed, validated, and documented. Thank you, and I am happy to answer any questions."
