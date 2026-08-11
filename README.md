# Enterprise OrangeHRM User Frustration Detection & QA Evaluation Project

An end-to-end user frustration detection system and multi-paradigm QA benchmarking suite integrated into an enterprise replica of **OrangeHRM**.

---
## 📁 Project Structure

```text
FrustrationTest/
├── .github/
│   └── workflows/
│       └── playwright.yml
│
├── *** app/
│   ├── index.html
│   ├── dashboard.html
│   ├── leave.html
│   ├── *** frustration-detector.js
│   └── style.css
│
├── *** docs/
│   ├── test-charter.md
│   ├── *** final-report.md
│   ├── *** executive-summary.md
│   └── *** demo-script.md
│
├── *** features/
│   ├── pages/
│   │   ├── BasePage.js
│   │   ├── DashboardPage.js
│   │   ├── FrustrationSurveyModal.js
│   │   ├── LeavePage.js
│   │   └── LoginPage.js
│   ├── step_definitions/
│   │   ├── adversarial.steps.js
│   │   ├── dashboard.steps.js
│   │   ├── frustration.steps.js
│   │   ├── hooks.js
│   │   ├── leave.steps.js
│   │   ├── login.steps.js
│   │   ├── session.steps.js
│   │   └── sso.steps.js
│   └── *.feature
│
├── *** reports/
│   ├── *** metrics-summary.md
│   └── metrics-summary.json
│
├── *** scripts/
│   ├── *** adversary/
│   │   ├── adversary.js
│   │   ├── run.js
│   │   └── sandbox.js
│   ├── manual test schemes/
│   ├── *** manual-replay.js
│   └── metrics/
│       └── collect.js
│
├── *** shopper_intent_prediction/
│   ├── *** frustration_modeling.ipynb
│   ├── frustration_modeling.py
│   ├── login_frustration_modeling.py
│   └── *.png
│
├── *** tests/
│   ├── reporters/
│   │   └── metrics-reporter.js
│   └── *.spec.js
│
├── .gitignore
├── cucumber.js
├── package.json
├── playwright.config.js
├── README.md
├── research-benchmark.md
├── server.js
└── testing_comparison_report.md
```

> **Note:** Folders and files marked with *** represent the key deliverables, core algorithms, ML models, test suites, and reports highlighted for supervisor review.

## 🚀 Quick Start Guide

### 1. Installation

```bash
npm install
npx playwright install
```

### 2. Run Application Server

```bash
npm run start
```
Open application at `http://localhost:3000`.

**Demo Credentials**:
- Username: `admin@Talan.com`
- Password: `password123`

---

## 🧪 Running Test Suites & Metrics

### Manual Session Replay Benchmark
```bash
npm run manual:replay
```

### Automated Playwright Suite
```bash
npm run test
```

### Cucumber BDD Suite
```bash
npm run test:bdd
```

### Adversarial AI Audit (18 Attacks)
```bash
npm run adversary
```

### Unified Metrics Aggregation Pipeline
```bash
npm run metrics
```

---

## 📊 Comparative Performance Benchmark

| Testing Method         | Test Units     | Pass Rate           | Precision     | Recall    | F1 Score | Mean Execution Time |
| ---------------------- | -------------: | ----------------:   | ------------: | --------: | -------: | ------------------- |
| Manual Exploratory     | 17 sessions    | 88.2% (15/17)       | 100%          | 100%      | 1.000    | ~12.5s / session    |
| Playwright Suite       | 20 tests       | 100% (20/20)        | 100%          | 100%      | 1.000    | ~3.8s / test        |
| Adversarial AI         | 18 attacks     | 100% (18/18)        | 100%          | 100%      | 1.000    | ~2.4s / attack      |


s