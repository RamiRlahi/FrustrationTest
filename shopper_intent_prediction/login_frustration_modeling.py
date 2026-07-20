"""
Login Frustration Forecasting Model  — Large-Scale Evaluation
==============================================================
5,000 sessions with realistic overlapping noise.
5-fold stratified cross-validation aggregates confusion matrix counts
across all folds so the final heatmap reflects the full dataset.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import classification_report, confusion_matrix
import os

np.random.seed(42)

# ===========================================================================
# 1. HELPERS
# ===========================================================================

def mouse_segment(t_start, x0, y0, x1, y1, steps, interval_ms,
                  jittery=False, jitter_amp=40):
    xs = np.linspace(x0, x1, steps)
    ys = np.linspace(y0, y1, steps)
    t, events = t_start, []
    for i in range(steps):
        x = xs[i] + (np.random.choice([-jitter_amp, jitter_amp])
                     if jittery and 0 < i < steps - 1 else 0)
        y = ys[i] + (np.random.choice([-jitter_amp, jitter_amp])
                     if jittery and 0 < i < steps - 1 else 0)
        t += int(np.random.randint(max(1, interval_ms - 15), interval_ms + 15))
        events.append({"type": "mousemove", "time": int(t),
                        "x": float(x), "y": float(y)})
    return events, t


def click(t, target, x, y):
    return {"type": "click", "time": int(t),
            "target": target, "x": float(x), "y": float(y)}


def trigger(t, trigger_type):
    return {"type": "trigger", "time": int(t), "triggerType": trigger_type}


def type_field(t, text_len, target, wpm_range=(40, 80)):
    events, cpm = [], np.random.uniform(*wpm_range) / 60000
    for length in range(1, text_len + 1):
        t += int(1 / cpm)
        events.append({"type": "input", "time": int(t),
                        "target": target, "valueLength": int(length)})
    return events, t


# ===========================================================================
# 2. SESSION PROFILES
# ===========================================================================

def calm_session(noise_level):
    events, t = [], int(np.random.randint(300, 900))
    triggers = dict(rageClick=False, ssoLocked=False, magicLink=False,
                    mouseJitter=False, backtrack=False)

    seg, t = mouse_segment(t, 100, 100, 960, 400, 12, np.random.randint(40, 60))
    events += seg

    # NOISE: SSO curiosity (1-2 clicks, never reaches threshold 3)
    if np.random.rand() < noise_level * 0.6:
        seg, t = mouse_segment(t, 960, 400, 963, 750, 8, 45)
        events += seg
        for _ in range(np.random.randint(1, 3)):
            t += int(np.random.randint(200, 500))
            events.append(click(t, "#ssoSubmit", 963, 750))
        seg, t = mouse_segment(t, 963, 750, 960, 400, 8, 45)
        events += seg

    # NOISE: 1 failed submit attempt (well below magic-link threshold 3)
    if np.random.rand() < noise_level * 0.5:
        events.append(click(t + 200, "#username", 960, 400))
        t += 200
        evts, t = type_field(t, np.random.randint(5, 12), "#username")
        events += evts
        events.append(click(t + 150, "#password", 960, 480))
        t += 150
        evts, t = type_field(t, np.random.randint(5, 10), "#password")
        events += evts
        t += 150
        events.append(click(t, "#loginSubmit", 965, 560))

    # NOISE: brief jitter (below the 5-reversal threshold)
    if np.random.rand() < noise_level * 0.4:
        seg, t = mouse_segment(t, 960, 400, 800, 460, 15, 25,
                                jittery=True, jitter_amp=25)
        events += seg

    # Normal successful login
    events.append(click(t + 100, "#username", 960, 400))
    t += 100
    evts, t = type_field(t, len("Admin"), "#username")
    events += evts
    seg, t = mouse_segment(t, 960, 400, 960, 480, 6, 45)
    events += seg
    events.append(click(t + 100, "#password", 960, 480))
    t += 100
    evts, t = type_field(t, len("admin123"), "#password")
    events += evts
    seg, t = mouse_segment(t, 960, 480, 965, 560, 6, 45)
    events += seg
    t += int(np.random.randint(100, 200))
    events.append(click(t, "#loginSubmit", 965, 560))

    return {"durationMs": int(t + 300), "frustrationDetected": triggers,
            "events": events}


def recovered_session():
    """Strong early signals, but user calms down — no trigger fires. Label = 0."""
    events, t = [], int(np.random.randint(200, 600))
    triggers = dict(rageClick=False, ssoLocked=False, magicLink=False,
                    mouseJitter=False, backtrack=False)

    seg, t = mouse_segment(t, 100, 100, 960, 400, 18, 30, jittery=True, jitter_amp=55)
    events += seg

    # 4 rapid submit clicks (just below threshold of 5)
    seg, t = mouse_segment(t, 960, 400, 965, 560, 6, 35)
    events += seg
    for _ in range(4):
        t += int(np.random.randint(250, 500))
        events.append(click(t, "#loginSubmit", 965, 560))

    # 2 SSO clicks (below threshold of 3)
    seg, t = mouse_segment(t, 965, 560, 963, 750, 6, 40)
    events += seg
    for _ in range(2):
        t += int(np.random.randint(200, 400))
        events.append(click(t, "#ssoSubmit", 963, 750))

    # Recover after 5 s window — successful login, no trigger
    t = max(t, 5500)
    events.append(click(t + 300, "#username", 960, 400))
    t += 300
    evts, t = type_field(t, len("Admin"), "#username")
    events += evts
    events.append(click(t + 150, "#password", 960, 480))
    t += 150
    evts, t = type_field(t, len("admin123"), "#password")
    events += evts
    t += 200
    events.append(click(t, "#loginSubmit", 965, 560))

    return {"durationMs": int(t + 300), "frustrationDetected": triggers,
            "events": events}


def frustrated_session_late(profile=None):
    """Completely calm first 5 s — frustration erupts only after the window. Label = 1."""
    events, t = [], int(np.random.randint(300, 800))
    triggers = dict(rageClick=False, ssoLocked=False, magicLink=False,
                    mouseJitter=False, backtrack=False)
    if profile is None:
        profile = np.random.choice(["rage", "sso", "magic", "backtrack", "jitter"])

    # Calm observation window
    seg, t = mouse_segment(t, 100, 100, 960, 400, 14, 55)
    events += seg
    events.append(click(t + 150, "#username", 960, 400))
    t += 150
    evts, t = type_field(t, len("Admin"), "#username", (35, 55))
    events += evts
    seg, t = mouse_segment(t, 960, 400, 960, 480, 7, 55)
    events += seg
    events.append(click(t + 150, "#password", 960, 480))
    t += 150
    evts, t = type_field(t, len("admin123"), "#password", (35, 55))
    events += evts

    t = max(t, 5200) + int(np.random.randint(300, 1000))

    if profile == "rage":
        for _ in range(5):
            events.append(click(t, "#loginSubmit", 965, 560))
            t += int(np.random.randint(150, 350))
        events.append(trigger(t, "rageClick")); triggers["rageClick"] = True

    elif profile == "sso":
        for _ in range(3):
            events.append(click(t, "#ssoSubmit", 963, 750))
            t += int(np.random.randint(100, 200))
        events.append(trigger(t, "ssoLocked")); triggers["ssoLocked"] = True

    elif profile == "magic":
        for _ in range(3):
            events.append(click(t, "#loginSubmit", 965, 560))
            t += int(np.random.randint(600, 1200))
        events.append(trigger(t, "magicLink")); triggers["magicLink"] = True

    elif profile == "backtrack":
        for _ in range(3):
            events.append(click(t, "#cancelButton", 962, 850))
            t += int(np.random.randint(100, 250))
        events.append(trigger(t, "backtrack")); triggers["backtrack"] = True

    elif profile == "jitter":
        seg, t = mouse_segment(t, 960, 480, 800, 500, 22, 28, jittery=True, jitter_amp=65)
        events += seg
        events.append(trigger(t, "mouseJitter")); triggers["mouseJitter"] = True

    return {"durationMs": int(t + 300), "frustrationDetected": triggers,
            "events": events}


def frustrated_session_early(profile=None):
    """Partial early signals in first 5 s, trigger fires later. Label = 1."""
    events, t = [], int(np.random.randint(200, 700))
    triggers = dict(rageClick=False, ssoLocked=False, magicLink=False,
                    mouseJitter=False, backtrack=False)
    if profile is None:
        profile = np.random.choice(["rage", "sso", "magic", "backtrack", "jitter"])

    if profile == "rage":
        seg, t = mouse_segment(t, 100, 100, 965, 560, 10, 40, jittery=True, jitter_amp=20)
        events += seg
        early = int(np.random.randint(2, 4))
        for _ in range(early):
            t += int(np.random.randint(200, 500))
            events.append(click(t, "#loginSubmit", 965, 560))
        t = max(t, 5100) + int(np.random.randint(200, 800))
        for _ in range(5 - early):
            events.append(click(t, "#loginSubmit", 965, 560))
            t += int(np.random.randint(150, 300))
        events.append(trigger(t, "rageClick")); triggers["rageClick"] = True

    elif profile == "sso":
        seg, t = mouse_segment(t, 100, 100, 963, 750, 12, 42, jittery=True, jitter_amp=15)
        events += seg
        t += int(np.random.randint(300, 600))
        events.append(click(t, "#ssoSubmit", 963, 750))
        t = max(t, 5100) + int(np.random.randint(300, 800))
        for _ in range(2):
            events.append(click(t, "#ssoSubmit", 963, 750))
            t += int(np.random.randint(100, 200))
        events.append(trigger(t, "ssoLocked")); triggers["ssoLocked"] = True

    elif profile == "magic":
        events.append(click(t + 200, "#username", 960, 400)); t += 200
        evts, t = type_field(t, 5, "#username", (55, 80)); events += evts
        events.append(click(t + 150, "#password", 960, 480)); t += 150
        evts, t = type_field(t, 8, "#password", (55, 80)); events += evts
        t += 150; events.append(click(t, "#loginSubmit", 965, 560))
        t = max(t, 5100) + int(np.random.randint(400, 900))
        for _ in range(2):
            events.append(click(t, "#loginSubmit", 965, 560))
            t += int(np.random.randint(800, 1500))
        events.append(trigger(t, "magicLink")); triggers["magicLink"] = True

    elif profile == "backtrack":
        seg, t = mouse_segment(t, 100, 100, 962, 850, 12, 45)
        events += seg; t += int(np.random.randint(300, 700))
        events.append(click(t, "#cancelButton", 962, 850))
        t = max(t, 5100) + int(np.random.randint(200, 600))
        for _ in range(2):
            events.append(click(t, "#cancelButton", 962, 850))
            t += int(np.random.randint(150, 300))
        events.append(trigger(t, "backtrack")); triggers["backtrack"] = True

    elif profile == "jitter":
        seg, t = mouse_segment(t, 100, 100, 960, 400, 16, 32, jittery=True, jitter_amp=38)
        events += seg
        t = max(t, 5100) + int(np.random.randint(200, 700))
        seg, t = mouse_segment(t, 960, 400, 800, 500, 24, 28, jittery=True, jitter_amp=65)
        events += seg
        events.append(trigger(t, "mouseJitter")); triggers["mouseJitter"] = True

    return {"durationMs": int(t + 300), "frustrationDetected": triggers,
            "events": events}


# ===========================================================================
# 3. GENERATE 5,000 SESSIONS
# ===========================================================================

N = 5000
print(f"Generating {N} sessions with realistic noise...")

sessions, labels = [], []

ratios = {
    "calm_easy":         int(N * 0.28),   # 1400
    "calm_hard":         int(N * 0.14),   # 700
    "recovered":         int(N * 0.08),   # 400
    "frustrated_late":   int(N * 0.18),   # 900
    "frustrated_early":  int(N * 0.32),   # 1600
}

for _ in range(ratios["calm_easy"]):
    sessions.append(calm_session(noise_level=0.1));  labels.append(0)
for _ in range(ratios["calm_hard"]):
    sessions.append(calm_session(noise_level=0.85)); labels.append(0)
for _ in range(ratios["recovered"]):
    sessions.append(recovered_session());            labels.append(0)
for _ in range(ratios["frustrated_late"]):
    sessions.append(frustrated_session_late());      labels.append(1)
for _ in range(ratios["frustrated_early"]):
    sessions.append(frustrated_session_early());     labels.append(1)

y = np.array(labels)
print(f"Total: {len(sessions)}  calm={int((y==0).sum())}  frustrated={int((y==1).sum())}")


# ===========================================================================
# 4. FEATURE EXTRACTION
# ===========================================================================

OBS_MS = 5000

def extract_features(session):
    evts = [e for e in session["events"] if e["time"] <= OBS_MS]
    clicks = [e for e in evts if e["type"] == "click"]
    moves  = [e for e in evts if e["type"] == "mousemove"]
    inputs = [e for e in evts if e["type"] == "input"]

    obs_clicks        = len(clicks)
    obs_submit_clicks = sum(1 for c in clicks if c.get("target") == "#loginSubmit")
    obs_sso_clicks    = sum(1 for c in clicks if c.get("target") == "#ssoSubmit")
    obs_cancel_clicks = sum(1 for c in clicks if c.get("target") == "#cancelButton")
    obs_inputs        = len(inputs)

    dist, speeds = 0.0, []
    for i in range(1, len(moves)):
        p1, p2 = moves[i-1], moves[i]
        d = np.hypot(p2["x"] - p1["x"], p2["y"] - p1["y"])
        dist += d
        dt = p2["time"] - p1["time"]
        if dt > 0: speeds.append(d / dt)

    obs_mouse_distance = dist
    obs_mouse_speed    = float(np.mean(speeds)) if speeds else 0.0

    reversals = 0
    for i in range(2, len(moves)):
        p1, p2, p3 = moves[i-2], moves[i-1], moves[i]
        v1 = (p2["x"]-p1["x"], p2["y"]-p1["y"])
        v2 = (p3["x"]-p2["x"], p3["y"]-p2["y"])
        m1, m2 = np.hypot(*v1), np.hypot(*v2)
        if m1 > 5 and m2 > 5:
            cos_t = np.clip((v1[0]*v2[0]+v1[1]*v2[1])/(m1*m2), -1.0, 1.0)
            if np.degrees(np.arccos(cos_t)) > 110:
                reversals += 1

    ctimes = sorted(c["time"] for c in clicks)
    bursts, last_end = 0, -1
    for i in range(len(ctimes)):
        if i <= last_end: continue
        window_end = i
        for j in range(i+1, len(ctimes)):
            if ctimes[j] - ctimes[i] <= 2000: window_end = j
            else: break
        if window_end - i + 1 >= 3:
            bursts += 1; last_end = window_end

    return {
        "obs_clicks":             obs_clicks,
        "obs_submit_clicks":      obs_submit_clicks,
        "obs_sso_clicks":         obs_sso_clicks,
        "obs_cancel_clicks":      obs_cancel_clicks,
        "obs_inputs":             obs_inputs,
        "obs_mouse_distance":     obs_mouse_distance,
        "obs_mouse_speed":        obs_mouse_speed,
        "obs_jitter_reversals":   reversals,
        "obs_rapid_click_bursts": bursts,
    }

print("Extracting features from the first 5 seconds of each session...")
X = pd.DataFrame([extract_features(s) for s in sessions])
y = pd.Series(labels)

print("\nClass balance:")
print(y.value_counts(normalize=True).round(3))


# ===========================================================================
# 5. 5-FOLD CROSS-VALIDATION → AGGREGATED CONFUSION MATRIX
# ===========================================================================

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

agg_cm        = np.zeros((2, 2), dtype=int)
agg_cm_base   = np.zeros((2, 2), dtype=int)
fold_reports  = []

print("\nRunning 5-fold stratified cross-validation...\n")

for fold, (train_idx, test_idx) in enumerate(skf.split(X, y), 1):
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    # Baseline
    base = DummyClassifier(strategy="stratified", random_state=42)
    base.fit(X_train, y_train)
    base_pred = base.predict(X_test)
    agg_cm_base += confusion_matrix(y_test, base_pred, labels=[0, 1])

    # Model
    model = RandomForestClassifier(
        n_estimators=200, max_depth=5, min_samples_leaf=8,
        class_weight="balanced", random_state=42, n_jobs=-1
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    cm_fold = confusion_matrix(y_test, y_pred, labels=[0, 1])
    agg_cm += cm_fold

    tn, fp, fn, tp = cm_fold.ravel()
    prec = tp / (tp + fp) if (tp + fp) else 0
    rec  = tp / (tp + fn) if (tp + fn) else 0
    f1   = 2 * prec * rec / (prec + rec) if (prec + rec) else 0
    acc  = (tn + tp) / len(y_test)
    print(f"  Fold {fold}:  acc={acc:.3f}  prec_frust={prec:.3f}  "
          f"rec_frust={rec:.3f}  F1_frust={f1:.3f}"
          f"  FP={fp}  FN={fn}")
    fold_reports.append({"acc": acc, "prec": prec, "rec": rec, "f1": f1})


# ===========================================================================
# 6. AGGREGATE REPORT
# ===========================================================================

print("\n" + "="*60)
print("AGGREGATED 5-FOLD CONFUSION MATRIX")
print("="*60)

cm_df = pd.DataFrame(
    agg_cm,
    index=["actual_calm", "actual_frustrated"],
    columns=["pred_calm", "pred_frustrated"]
)
print(cm_df)

tn, fp, fn, tp = agg_cm.ravel()
total = agg_cm.sum()
print(f"\nTotal sessions evaluated: {total}")
print(f"  True Positives  (correctly caught frustrated): {tp}")
print(f"  True Negatives  (correctly cleared calm):      {tn}")
print(f"  False Positives (calm user wrongly flagged):   {fp}")
print(f"  False Negatives (frustrated user missed):      {fn}")
print(f"\n  Overall accuracy:  {(tn+tp)/total:.3f}")
print(f"  Frustrated precision: {tp/(tp+fp):.3f}")
print(f"  Frustrated recall:    {tp/(tp+fn):.3f}")

avg = pd.DataFrame(fold_reports).mean()
print(f"\n  Mean across folds — acc={avg.acc:.3f}  "
      f"prec={avg.prec:.3f}  rec={avg.rec:.3f}  F1={avg.f1:.3f}")

# Baseline comparison
b_tn, b_fp, b_fn, b_tp = agg_cm_base.ravel()
print(f"\nBaseline (stratified random):")
print(f"  Accuracy: {(b_tn+b_tp)/total:.3f}")
print(f"  Frustrated precision: {b_tp/(b_tp+b_fp):.3f}")
print(f"  Frustrated recall:    {b_tp/(b_tp+b_fn):.3f}")


# ===========================================================================
# 7. FEATURE IMPORTANCE (on full training set)
# ===========================================================================

final_model = RandomForestClassifier(
    n_estimators=200, max_depth=5, min_samples_leaf=8,
    class_weight="balanced", random_state=42, n_jobs=-1
)
final_model.fit(X, y)

imp = pd.DataFrame({"feature": X.columns,
                     "importance": final_model.feature_importances_})
imp = imp.sort_values("importance", ascending=False)
print("\n--- Feature Importances (full dataset) ---")
print(imp.to_string(index=False))


# ===========================================================================
# 8. PLOTS
# ===========================================================================

fig, axes = plt.subplots(1, 2, figsize=(13, 5))

# Aggregated model confusion matrix
sns.heatmap(cm_df, annot=True, fmt="d", cmap="Blues", ax=axes[0])
axes[0].set_title(
    f"Login Frustration — Aggregated Confusion Matrix\n"
    f"5-fold CV  |  {total} sessions  |  acc={((tn+tp)/total):.2%}"
)
axes[0].set_ylabel("Actual")
axes[0].set_xlabel("Predicted")

# Feature importance bar chart
axes[1].barh(imp["feature"][::-1], imp["importance"][::-1], color="#4C8BF5")
axes[1].set_xlabel("Importance")
axes[1].set_title("Feature Importances\n(trained on full dataset)")
axes[1].spines[["top", "right"]].set_visible(False)

plt.tight_layout()

out = os.path.join("shopper_intent_prediction", "login_confusion_matrix.png") \
      if os.path.isdir("shopper_intent_prediction") else "login_confusion_matrix.png"
plt.savefig(out, dpi=150)
print(f"\nSaved plot to {out}")
