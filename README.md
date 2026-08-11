# Enterprise OrangeHRM User Frustration Detection & QA Evaluation Project

An end-to-end user frustration detection system and multi-paradigm QA benchmarking suite integrated into an enterprise replica of **OrangeHRM**.

---

## 🎯 Deliverables Summary

- ✅ **OrangeHRM + Frustration Detector**: Shared real-time detection module (`app/frustration-detector.js`) integrated across Login, Dashboard, and Leave pages.
- ✅ **Manual Exploratory Test Suite**: Session recorder + formal charter with 8+ ambiguous scenarios ([docs/test-charter.md](file:///c:/Users/rami/Desktop/int102/docs/test-charter.md)) + replay harness (`scripts/manual-replay.js`).
- ✅ **Automated Playwright Suite**: 20 tests including deterministic E2E, Cucumber BDD features, and stochastic randomized tests (`tests/07_randomized_interactions.spec.js`).
- ✅ **Adversarial AI Audit Model**: 18 attack vectors across POSITIVE, NEGATIVE, BOUNDARY, RESET, and RECOVERY categories (`scripts/adversary/adversary.js`).
- ✅ **Comparative Evaluation & Pipeline**: Unified metrics pipeline (`scripts/metrics/collect.js`) generating precision, recall, F1 score, and latency benchmarks ([reports/metrics-summary.md](file:///c:/Users/rami/Desktop/int102/reports/metrics-summary.md)).
- ✅ **Final Internship Report**: Comprehensive technical document ([docs/final-report.md](file:///c:/Users/rami/Desktop/int102/docs/final-report.md)).
- ✅ **Executive Summary**: 2-page executive summary ([docs/executive-summary.md](file:///c:/Users/rami/Desktop/int102/docs/executive-summary.md)).
- ✅ **10-Minute Demonstration Script**: Step-by-step presentation script ([docs/demo-script.md](file:///c:/Users/rami/Desktop/int102/docs/demo-script.md)).

---

## 📁 Project Structure

```text
.
├── app/
│   ├── index.html              # OrangeHRM Login Page & Detector
│   ├── dashboard.html          # OrangeHRM Dashboard Page & Detector
│   ├── leave.html              # OrangeHRM Leave Application Page & Detector
│   ├── frustration-detector.js # Shared Real-time Frustration Detection Engine
│   └── style.css               # OrangeHRM Design System Styling
├── docs/
│   ├── test-charter.md         # Manual Exploratory Charter & Ambiguous Scenarios
│   ├── final-report.md         # Complete Internship Final Report
│   ├── executive-summary.md    # 2-Page Executive Summary
│   └── demo-script.md          # 10-Minute Technical Demonstration Script
├── features/                   # Cucumber BDD Features & Step Definitions
├── reports/
│   ├── metrics-summary.md      # Comparative Performance Matrix (Markdown)
│   └── metrics-summary.json    # Aggregated Benchmark Metrics (JSON)
├── scripts/
│   ├── adversary/              # Adversarial AI Attack Library & CLI Runner
│   ├── manual test schemes/    # Saved Session Recorder JSON Recordings
│   ├── manual-replay.js        # Manual Session Replay Benchmark Harness
│   └── metrics/collect.js      # Unified Metrics Aggregation Pipeline
├── shopper_intent_prediction/  # Random Forest ML Training Notebooks & Models
├── tests/                      # Playwright End-to-End & Stochastic Tests
├── server.js                   # Static Server & Frustration Predictor API
├── playwright.config.js        # Playwright Configuration
└── package.json
```

---

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
- Username: `Admin` or `admin@Talan.com`
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

| Testing Approach | Total Units | Pass Rate | Precision | Recall | F1 Score | Avg Execution Time |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Manual Exploratory** | 17 sessions | **100%** | **100%** | **100%** | **1.000** | ~12.5s / session |
| **Playwright Suite** | 20 specs | **100%** | **100%** | **100%** | **1.000** | ~3.8s / test |
| **Adversarial AI** | 18 attacks | **100%** | **100%** | **100%** | **1.000** | **~2.4s / attack** |
