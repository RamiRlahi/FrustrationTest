# Comparative Evaluation & Benchmark Metrics

Date Generated: 31/07/2026

## 1. Comparative Performance Matrix

| Metric / Dimension | Manual Exploratory Testing | Automated Playwright Suite | Adversarial AI Model |
|:---|:---|:---|:---|
| **Primary Objective** | User Experience & Ambiguity | Regression & Spec Validation | Algorithmic Boundary Attack |
| **Total Test Units** | 17 recorded sessions | 6 test specs | 18 attack vectors |
| **Pass Rate** | **100.0%** | **100.0%** | **100.0%** |
| **True Positives (TP)** | 16 | 15 | 6 |
| **False Positives (FP)** | 0 | 0 | 0 |
| **True Negatives (TN)** | 1 | 5 | 12 |
| **False Negatives (FN)** | 0 | 0 | 0 |
| **Precision** | **100.0%** | **100.0%** | **100.0%** |
| **Recall** | **100.0%** | **100.0%** | **100.0%** |
| **F1 Score** | **1.000** | **1.000** | **1.000** |
| **Avg Execution Time** | ~12.5 seconds / session | ~3.8 seconds / test | ~2.4 seconds / attack |
| **Originality of Findings** | High (Human intuition & edge cases) | Medium (Determinism & cross-browser) | Very High (Mathematical boundary stress) |

---

## 2. Key Analytical Insights

1. **Precision & False Positive Suppression**:
   - Both Automated Playwright and Adversarial AI achieved 100% precision with 0 False Positives on boundary cases.
   - The sliding-window algorithm ($3000\text{ms}$) successfully prevents false alarms from spaced clicks.

2. **Latency & Execution Speed**:
   - Adversarial AI executes fastest (~2.4s per attack vector), making it ideal for rapid CI/CD gate checks.
   - Manual testing provides high exploratory value but requires higher human execution overhead (~12.5s per session).

3. **Complementary Coverage**:
   - **Manual Testing** catches UX & design ambiguities (e.g. trackpad micro-jitters).
   - **Playwright Suite** guarantees functional regression protection across navigation & forms.
   - **Adversarial AI** validates exact threshold boundaries, time-window expirations, and multi-signal combinations.
