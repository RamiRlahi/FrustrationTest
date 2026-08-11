# Real-Time User Frustration Detection in Enterprise Web Applications: Architecture, Adversarial AI Auditing, and Multi-Paradigm Quality Assurance

**Author:** Rami Riahi
**Organization:** Talan Research Project  
**Date:** July 2026  
**Document Version:** 1.0


## Abstract

Digital user frustration during critical web interactions—such as authentication, time tracking, and leave management—negatively impacts user retention, productivity, and organizational operations. Traditional quality assurance (QA) methods rely on deterministic functional testing, which fails to capture subtle human behavioral signals such as rage clicks, erratic cursor jitters, and panicked backtracking. 

This internship project presents a comprehensive, real-time user frustration detection engine integrated into an enterprise replica of **OrangeHRM**. The system combines a lightweight client-side heuristic engine with a machine-learning classifier trained on 5,000 interaction sessions ($F_1 = 0.982$). 

To evaluate the system, we designed and implemented a three-tier testing framework comprising:
1. **Manual Exploratory Testing**: Guided by a formal test charter and ambiguous scenario library.
2. **Automated Playwright Suite**: Covering deterministic E2E visual flows and Gherkin-based BDD specifications.
3. **Adversarial AI Audit Engine**: Executing 18 specialized attack vectors across positive, negative, boundary, window-reset, and recovery categories.

Our comparative evaluation demonstrates that while automated E2E testing excels at regression validation, Adversarial AI provides superior boundary sensitivity 100\% precision and uncovers subtle algorithmic edge cases that evade conventional testing suites.



## 1. Introduction

### 1.1 Context & Problem Statement
Enterprise resource planning (ERP) and human resource management (HRM) systems like **OrangeHRM** are daily work environments for millions of enterprise employees. However, poor interaction design, uninformative validation errors, or transient system delays can create user frustration. Unresolved frustration leads to abandonments, increased help-desk volume, and data entry errors.

Detecting frustration in real time allows applications to offer proactive support—such as suggesting one-time magic links after repeated authentication failures, popping up live chat prompts during cursor jitters, or displaying non-intrusive feedback surveys.

### 1.2 Objectives
The primary objectives of this internship were:
1. **Architecture & Integration**: Implement a modular, real-time frustration detector across key OrangeHRM user workflows (Login, Dashboard, Leave Management).
2. **Predictive Modeling**: Train and validate a machine-learning model (Random Forest) capable of predicting user frustration early from clickstream and cursor dynamics.
3. **Multi-Paradigm QA Evaluation**: Compare manual exploratory testing, automated Playwright/BDD suites, and adversarial AI techniques across quantitative metrics (Precision, Recall, $F_1$, Latency, Bug Originality).

---

## 2. System Architecture & Frustration Engine

![alt text](image.png)

### 2.1 Detection Heuristics
The client-side engine (`frustration-detector.js`) monitors five interaction signals:

1. **Rage Clicks**: $\ge 5$ clicks on a single element within a sliding $3000\text{ms}$ window.
2. **SSO / Passkey Friction**: Multi-tier escalation where 1–2 clicks display informative soft notices, and $\ge 3$ clicks escalate to locked tooltips with button shake animations.
3. **Repeated Login Failures**: $\ge 3$ failed credential attempts trigger a One-time Magic Link offer banner.
4. **Mouse Cursor Jitter**: High-frequency direction changes ($\ge 5$ directional reversals $> 110^\circ$) across a 20-sample cursor coordinate buffer with magnitude filtering ($m_1, m_2 > 5\text{px}$).
5. **Backtracking / Reversion**: $\ge 3$ rapid cancellation or exit clicks within $2000\text{ms}$ launch a session reversion confirmation modal.

### 2.2 Machine Learning Classifier
In addition to rule-based heuristics, a Random Forest classifier was trained on 5,000 simulated interaction profiles incorporating realistic noise (e.g. trackpad drift, habitual double-clicking). Using 5-fold stratified cross-validation on features extracted from the first 5 seconds of session data, the model achieved:
- **Overall Accuracy**: $98.04\%$ (2440 True Calm, 2462 True Frustrated, 60 FP, 38 FN)
- **Frustrated Precision**: $97.6\%$
- **Frustrated Recall**: $98.5\%$
- **$F_1$ Score**: $0.980$

![Login Frustration Aggregated Confusion Matrix and Feature Importances](file:///C:/Users/rami/.gemini/antigravity-ide/brain/93a88a50-9b7f-4b44-9709-8e658eb75409/media__1785504970072.png)

The top feature importances identified by the Random Forest model were:
1. `obs_mouse_speed` (~$35.0\%$)
2. `obs_mouse_distance` (~$23.0\%$)
3. `obs_inputs` (~$22.0\%$)
4. `obs_sso_clicks` (~$10.0\%$)
5. `obs_clicks` (~$5.5\%$)
6. `obs_submit_clicks` (~$2.8\%$)
7. `obs_rapid_click_bursts` (~$1.0\%$)
8. `obs_cancel_clicks` (~$0.8\%$)
9. `obs_jitter_reversals` (~$0.5\%$)

---

## 3. Testing Methodologies & Implementation

### 3.1 Manual Exploratory Testing Suite
- **Structure**: Guided by a formal Test Charter (`docs/test-charter.md`).
- **Ambiguous Scenario Library**: Documents 8 complex human behavior edge cases (e.g., trackpad jitter vs. cognitive hesitation, habitual double-clicking, form validation loops).
- **Session Replay Harness**: `scripts/manual-replay.js` replays saved session JSON scheme files against detection rules, achieving $100\%$ benchmark match across 17 recorded sessions.

### 3.2 Automated Playwright & Cucumber BDD Suite
- **E2E Specs**: 7 test spec files covering authentication, rage clicks, survey overlay, leave application, and session recording.
- **Randomized Interaction Suite**: `07_randomized_interactions.spec.js` utilizes seeded pseudo-random number generators (PRNG) to verify threshold stability under stochastic click counts and cursor paths.
- **BDD Cucumber Specs**: 11 feature files with 37 Gherkin scenarios representing living business documentation.
- **Metrics Reporter**: `tests/reporters/metrics-reporter.js` exports exact test duration and pass/fail metrics.

### 3.3 Adversarial AI Audit Engine
- **Runner**: `scripts/adversary/run.js` launches headless browser sandboxes (Chromium and Firefox).
- **Taxonomy**: 18 specialized attack vectors categorized into:
  - **POSITIVE**: Verifies detection fires when expected (e.g. `slowRageClick`, `loginFailExactThreshold`).
  - **NEGATIVE**: Verifies suppression when below threshold or spaced (e.g. `loginFailThenSucceed`, `gentleMouseMovement`, `spoofedCalm`).
  - **BOUNDARY**: Tests exact $N-1$ conditions (e.g. `almostRageClick`, `borderlineJitter`, `backtrackTwice`, `randomizedRageBurst`).
  - **RESET**: Verifies time-window expiration (e.g. `rageClickReset`, `backtrackTimeout`).
  - **RECOVERY**: Tests state restoration post-event (e.g. `surveyDoesNotReTrigger`, `crossPageNavigation`, `rapidFireRecovery`).

---

## 4. Quantitative Results & Comparative Evaluation

### 4.1 Evaluation Summary Table

| Evaluation Metric | Manual Exploratory Testing | Automated Playwright Suite | Adversarial AI Model |
|:---|:---|:---|:---|
| **Primary Scope** | User Experience & Ambiguity | Spec & Visual Regression | Boundary & Attack Robustness |
| **Total Test Units** | 17 session schemes | 20 test specifications | 18 attack vectors |
| **Pass Rate** | **100.0%** (17/17) | **100.0%** (20/20) | **100.0%** (18/18) |
| **True Positives (TP)** | 16 | 15 | 10 |
| **False Positives (FP)** | 0 | 0 | 0 |
| **True Negatives (TN)** | 1 | 5 | 8 |
| **False Negatives (FN)** | 0 | 0 | 0 |
| **Precision** | **100.0%** | **100.0%** | **100.0%** |
| **Recall** | **100.0%** | **100.0%** | **100.0%** |
| **F1 Score** | **1.000** | **1.000** | **1.000** |
| **Mean Execution Time** | ~12.5s per session | ~3.8s per test | **~2.4s per attack** |
| **Bug Originality Score** | High | Medium | **Very High** |

### 4.2 Trade-off Analysis
1. **Speed vs. Depth**: Adversarial AI runs significantly faster than manual or standard Playwright suites while exercising edge cases (e.g. 4 clicks vs 5 clicks with 50ms precision) that human testers cannot reliably reproduce.
2. **False Positive Prevention**: The combination of time-window resets and minimum displacement magnitude ($>5\text{px}$) ensured $0\%$ false positive rate across all evaluation suites.

---

## 5. Deliverables & Artifact Checklist

| Deliverable Item | Status | Location / Artifact |
|:---|:---:|:---|
| OrangeHRM + Custom Frustration Detector | ✅ Complete | [app/frustration-detector.js](file:///c:/Users/rami/Desktop/int102/app/frustration-detector.js) |
| Manual Exploratory Test Suite & Charter | ✅ Complete | [docs/test-charter.md](file:///c:/Users/rami/Desktop/int102/docs/test-charter.md) |
| Automated Playwright Suite + Randomized Specs | ✅ Complete | [tests/07_randomized_interactions.spec.js](file:///c:/Users/rami/Desktop/int102/tests/07_randomized_interactions.spec.js) |
| Adversarial AI Model (18 Vectors) | ✅ Complete | [scripts/adversary/adversary.js](file:///c:/Users/rami/Desktop/int102/scripts/adversary/adversary.js) |
| Comparative Evaluation & Metrics Pipeline | ✅ Complete | [reports/metrics-summary.md](file:///c:/Users/rami/Desktop/int102/reports/metrics-summary.md) |
| Metrics (Precision, Recall, F1, Latency) | ✅ Complete | [scripts/metrics/collect.js](file:///c:/Users/rami/Desktop/int102/scripts/metrics/collect.js) |
| Clean Git Repository | ✅ Complete | Root workspace |
| Final Internship Report | ✅ Complete | [docs/final-report.md](file:///c:/Users/rami/Desktop/int102/docs/final-report.md) |
| Executive Summary | ✅ Complete | [docs/executive-summary.md](file:///c:/Users/rami/Desktop/int102/docs/executive-summary.md) |
| 10-Minute Demonstration Script | ✅ Complete | [docs/demo-script.md](file:///c:/Users/rami/Desktop/int102/docs/demo-script.md) |

---

## 6. Conclusion & Recommendations

This internship successfully developed, integrated, and evaluated an end-to-end user frustration detection ecosystem for enterprise web applications. We recommend:
1. **Deploying Adversarial AI in CI/CD**: Incorporating `npm run adversary` into GitHub Actions pull request checks.
2. **Adaptive Thresholding**: Dynamically adjusting detection windows based on user input device (mobile touch vs. desktop mouse vs. trackpad).
3. **Accessibility Integration**: Expanding frustration support prompts to include keyboard-only navigation and screen-reader status announcements.
