# Manual Exploratory Test Charter & Ambiguous Scenarios

## 1. Charter Metadata

| Property | Value |
|:---|:---|
| **Project** | OrangeHRM Frustration Detection System |
| **Author** | QA / AI Testing Team |
| **Target Application** | OrangeHRM Web Replica (`http://localhost:3000`) |
| **Test Strategy** | Session-based Exploratory Testing (SBET) |
| **Session Duration** | 20-30 minutes per charter |
| **Tools Used** | Built-in Session Recorder (`/api/record`), Chrome DevTools |

---

## 2. Mission Statement

> **Explore** the OrangeHRM user interface across Authentication, Dashboard, and Leave Management modules by simulating diverse human interaction patterns (calm, hasty, erratic, hesitant, confused) to **evaluate** the sensitivity, precision, and user experience of the real-time frustration detection engine.

---

## 3. Scope & Target Components

1. **Authentication Module (`/index.html`)**:
   - Rage clicking on `#loginSubmit`
   - Repeated interaction with disabled SSO/Passkey button (`#ssoSubmit`)
   - Repeated invalid credential entries (triggering Magic Link proposal)
   - Mouse jitter inside `#loginCard`
   - Reversion / backtracking via `#cancelButton`

2. **Dashboard Module (`/dashboard.html`)**:
   - Punch button toggling (`#punchBtn`) rapid clicking
   - Navigation panel hovering and mouse erratic jitter across widgets
   - Logout cancel reversion checks

3. **Leave Management Module (`/leave.html`)**:
   - Rapid application submit clicks (`#applyLeaveBtn`)
   - Date range validation errors vs. user frustration escalation
   - Leave balance boundary friction

---

## 4. Test Oracles & Detection Thresholds

| Frustration Heuristic | Trigger Target | Threshold Criterion | Reset Window | Expected UI Action |
|:---|:---|:---|:---|:---|
| **Rage Click** | `#loginSubmit`, `#punchBtn`, `#applyLeaveBtn` | $\ge 5$ clicks in $3000\text{ms}$ | 3000 ms sliding window | Show Rage Banner + AI survey |
| **SSO Friction** | `#ssoSubmit` | 1-2 clicks: notice; $\ge 3$ clicks: lock | 5000 ms timeout | Shake button + tooltip lock message |
| **Failed Logins** | Login form submit | $\ge 3$ invalid attempts | Session-scoped | Show Magic Link banner |
| **Mouse Jitter** | Card containers / context | $\ge 5$ direction changes $> 110^\circ$ in 20 samples | Buffer sliding | Show Jitter Help Banner |
| **Backtracking** | `#cancelButton`, `#logoutBtn` | $\ge 3$ clicks within $2000\text{ms}$ | 2000 ms timeout | Reversion confirm modal |

---

## 5. Ambiguous & Complex Edge Scenarios

The following 8 scenarios document edge cases where real-world human intent is ambiguous, creating potential tension between False Positives (over-flagging calm users) and False Negatives (missing frustrated users).

### Scenario AMB-01: Rapid Double-Clicking out of Habit
- **Behavior**: User double-clicks or triple-clicks buttons purely out of desktop habit (e.g. double-clicking `#loginSubmit` or `#applyLeaveBtn`).
- **Ambiguity**: Is this user frustration or muscle memory?
- **Expected Heuristic Outcome**: 2-3 clicks within 500ms must NOT trigger the rage click banner (threshold $\ge 5$).
- **Risk**: Low threshold ($\le 3$) would cause unacceptable False Positives for habitual double-clickers.

### Scenario AMB-02: Touchpad / Trackpad High-Frequency Jitter
- **Behavior**: Laptop touchpad users resting fingers on pad cause micro direction changes without moving the cursor across screen distance.
- **Ambiguity**: Hardware signal noise vs. genuine cognitive hesitation / stuckness.
- **Expected Heuristic Outcome**: Magnitude check ($m_1 > 5\text{px}$ AND $m_2 > 5\text{px}$) suppresses micro-jitters under 5 pixels.
- **Risk**: Omitting magnitude filtering causes ~30% False Positive rate on trackpad devices.

### Scenario AMB-03: Form Validation Loop (End Date < Start Date)
- **Behavior**: User repeatedly clicks "Apply Leave" with an invalid date range, fixing one field at a time while getting inline validation errors.
- **Ambiguity**: Is the user frustrated at the system, or methodically filling a complex form?
- **Expected Heuristic Outcome**: Inline errors appear; if click rate on `#applyLeaveBtn` exceeds 5 in 3s, friction banner fires.
- **Risk**: User may become frustrated by validation messages themselves; flagging provides helpful support.

### Scenario AMB-04: SSO Discovery vs. Access Insistence
- **Behavior**: First-time enterprise user clicks SSO once, reads tooltip, clicks again 2 seconds later to check if active.
- **Ambiguity**: Curiosity/Exploration vs. Frustrated insistence.
- **Expected Heuristic Outcome**: 2 clicks show soft notice ("Passkey disabled"); 3rd rapid click escalates to locked state.
- **Risk**: Hard locking on 2nd click alienates curious standard users.

### Scenario AMB-05: Intermittent Network Lag / Latency Burst
- **Behavior**: Server latency spikes; user clicks button, sees no immediate visual state change for 1.5 seconds, and clicks 3 more times.
- **Ambiguity**: System responsiveness failure causing user frustration.
- **Expected Heuristic Outcome**: 4 total clicks during pending request. Detects frustration, but UI banner should acknowledge network delay ("Processing your request...").

### Scenario AMB-06: Backtracking after Mistaken Navigation
- **Behavior**: User lands on Leave page by accident, clicks "Cancel" twice, pauses to inspect menu, clicks "Cancel" again.
- **Ambiguity**: deliberate navigation vs. panicked backtracking.
- **Expected Heuristic Outcome**: If total duration between clicks $> 2000\text{ms}$, reset window clears counter; no modal shown.

### Scenario AMB-07: Survey Dismissal and Immediate Re-triggering
- **Behavior**: User triggers frustration survey via rage clicks, clicks "Dismiss", then rage clicks again 5 seconds later.
- **Ambiguity**: Should the survey bother the user a second time in the same session?
- **Expected Heuristic Outcome**: Survey displays ONCE per session (`surveySeen = true`). Subsequent rage clicks show notification banner only, suppressing modal overlay.

### Scenario AMB-08: Mixed Low-Intensity Signals across Multiple Features
- **Behavior**: 2 failed logins + 2 cancel clicks + 4 mouse reversals. No single trigger crosses threshold.
- **Ambiguity**: Cumulative frustration across features vs. normal usage.
- **Expected Heuristic Outcome**: Standard rule-based triggers stay silent; AI Classifier (`/api/predict_frustration`) evaluates feature vector and correctly flags session probability $\ge 0.50$.

---

## 6. Execution & Logging Protocol

1. Open `http://localhost:3000`.
2. Click **Start** on the floating Session Recorder widget.
3. Execute the planned exploratory scenario path.
4. Note whether frustration banners/surveys appeared as expected.
5. Click **Stop**, name the session (e.g. `amb_01_habitual_double_click`), and click **Save to Test Schemes**.
6. Run `node scripts/manual-replay.js` to benchmark replay metrics against ground truth.
