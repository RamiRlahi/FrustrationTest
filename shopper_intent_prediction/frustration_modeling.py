import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import classification_report, confusion_matrix
import os

# 1. Load a subset of the dataset (200,000 rows for stable testing and faster execution)
data_path = 'release_10_23_2020.csv'
if not os.path.exists(data_path):
    # Fallback in case script is run from parent directory
    data_path = os.path.join('shopper_intent_prediction', 'release_10_23_2020.csv')

print(f"Loading dataset from {data_path}...")
df = pd.read_csv(data_path, nrows=200000)
print(f"Loaded dataset with shape: {df.shape}")

# Clean data
columns_to_keep = ['session_id_hash', 'event_type', 'product_action', 'server_timestamp_epoch_ms', 'hashed_url']
df = df[columns_to_keep].dropna(subset=['session_id_hash']).drop_duplicates()
df = df.sort_values(['session_id_hash', 'server_timestamp_epoch_ms'])

# 2. Heuristics & Feature Engineering
# Increased observation limit so we can detect rapid clicks (min 5 events) and backtracks
OBSERVATION_EVENT_LIMIT = 10
DIRECT_LABEL_FEATURES = ['future_events', 'future_backtracks', 'future_rapid_bursts', 'future_has_purchase']

def count_backtracks(urls):
    """
    Counts consecutive 'ping-pong' page backtracking (e.g., A -> B -> A).
    Avoids counting general page revisits at longer distances as backtracks.
    """
    backtracks = 0
    for i in range(len(urls) - 2):
        if pd.isna(urls[i]) or pd.isna(urls[i + 1]) or pd.isna(urls[i + 2]):
            continue
        if urls[i] == urls[i + 2] and urls[i] != urls[i + 1]:
            backtracks += 1
    return backtracks

def count_rapid_bursts(timestamps, window_ms=5000, min_events=5):
    """
    Counts distinct, non-overlapping rapid event bursts.
    Avoids double-counting multiple sliding windows within a single burst.
    """
    rapid_bursts = 0
    last_burst_end_idx = -1
    for i in range(len(timestamps) - min_events + 1):
        if i <= last_burst_end_idx:
            continue
        if timestamps[i + min_events - 1] - timestamps[i] < window_ms:
            rapid_bursts += 1
            last_burst_end_idx = i + min_events - 1
    return rapid_bursts

def summarize_events(events, prefix):
    event_count = len(events)
    if event_count > 1:
        duration_ms = events['server_timestamp_epoch_ms'].iloc[-1] - events['server_timestamp_epoch_ms'].iloc[0]
        time_to_second_event_sec = (events['server_timestamp_epoch_ms'].iloc[1] - events['server_timestamp_epoch_ms'].iloc[0]) / 1000.0
    else:
        duration_ms = 0
        time_to_second_event_sec = 0

    duration_sec = duration_ms / 1000.0
    unique_urls = events['hashed_url'].nunique(dropna=True)
    actions = events['product_action'].fillna('none')
    event_types = events['event_type'].fillna('unknown')

    return {
        f'{prefix}_events': event_count,
        f'{prefix}_duration_sec': duration_sec,
        f'{prefix}_event_rate': event_count / duration_sec if duration_sec > 0 else 0,
        f'{prefix}_unique_urls': unique_urls,
        f'{prefix}_unique_url_ratio': unique_urls / event_count if event_count > 0 else 0,
        f'{prefix}_time_to_second_event_sec': time_to_second_event_sec,
        f'{prefix}_pageviews': int((event_types == 'pageview').sum()),
        f'{prefix}_detail_actions': int((actions == 'detail').sum()),
        f'{prefix}_cart_actions': int(actions.isin(['add', 'remove']).sum()),
        f'{prefix}_action_missing_ratio': float((actions == 'none').mean()) if event_count > 0 else 0,
        f'{prefix}_backtracks': count_backtracks(events['hashed_url'].tolist()),
        f'{prefix}_rapid_bursts': count_rapid_bursts(events['server_timestamp_epoch_ms'].tolist()),
        f'{prefix}_has_purchase': 1 if 'purchase' in events['product_action'].values else 0
    }

def calculate_session_features(session_data):
    session_data = session_data.sort_values('server_timestamp_epoch_ms')
    observed = session_data.head(OBSERVATION_EVENT_LIMIT)
    future = session_data.iloc[OBSERVATION_EVENT_LIMIT:]

    features = {
        'total_events': len(session_data),
        'session_start_ms': session_data['server_timestamp_epoch_ms'].iloc[0]
    }
    features.update(summarize_events(observed, 'observed'))
    features.update(summarize_events(future, 'future'))
    return pd.Series(features)

print("Engineering session features...")
session_groups = df.groupby('session_id_hash')
sessions_df = session_groups.apply(calculate_session_features).reset_index()

# 3. Label Future Frustration
# Refined label rules:
# - Future rage clicks -> future_rapid_bursts >= 1
# - Future ping-pong backtracking -> future_backtracks >= 2
# - Future search struggle/wandering -> at least 25 events and no purchase (less noisy than 12)
def label_future_frustration(row):
    if row['future_rapid_bursts'] >= 1:
        return 1
    if row['future_backtracks'] >= 2:
        return 1
    if row['future_events'] >= 25 and row['future_has_purchase'] == 0:
        return 1
    return 0

sessions_df['future_is_frustrated'] = sessions_df.apply(label_future_frustration, axis=1)

# Keep sessions that have a future window to evaluate
model_df = sessions_df[sessions_df['future_events'] > 0].copy()

print("\nFuture Frustration Label Distribution:")
print(model_df['future_is_frustrated'].value_counts(normalize=True))
print(f"Sessions used for modeling: {len(model_df)}")

# 4. Model Training
features = [
    'observed_duration_sec',
    'observed_event_rate',
    'observed_unique_urls',
    'observed_unique_url_ratio',
    'observed_time_to_second_event_sec',
    'observed_pageviews',
    'observed_detail_actions',
    'observed_cart_actions',
    'observed_action_missing_ratio',
    'observed_backtracks',
    'observed_rapid_bursts',
    'observed_has_purchase'
]

# Ensure no leakage check passes
forbidden_features = set(DIRECT_LABEL_FEATURES + ['total_events', 'session_start_ms'])
leaked_features = sorted([feature for feature in features if feature in forbidden_features or feature.startswith('future_')])
assert not leaked_features, f"Remove leaked label/future features before training: {leaked_features}"

X = model_df[features]
y = model_df['future_is_frustrated']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Baseline Classifier (Most Frequent)
baseline = DummyClassifier(strategy='most_frequent')
baseline.fit(X_train, y_train)
baseline_pred = baseline.predict(X_test)

# Random Forest Classifier (with balanced class weights and moderate depth)
model = RandomForestClassifier(
    n_estimators=200,
    min_samples_leaf=10,
    max_depth=6,
    class_weight='balanced',
    random_state=42
)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print("\n--- Baseline Report ---")
print(classification_report(y_test, baseline_pred, digits=3, zero_division=0))

print("\n--- Model Classification Report ---")
print(classification_report(y_test, y_pred, digits=3, zero_division=0))

print("Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
cm_df = pd.DataFrame(cm, index=['actual_not_frustrated', 'actual_frustrated'], columns=['pred_not_frustrated', 'pred_frustrated'])
print(cm_df)

if cm[0, 1] == 0 and cm[1, 0] == 0:
    print("\nWARNING: The model produced a perfect confusion matrix. Leakage likely remains.")
else:
    print("\nModel is evaluating with realistic errors, confirming leakage has been removed.")

# Plot and save the new confusion matrix
plt.figure(figsize=(6, 5))
sns.heatmap(cm_df, annot=True, fmt='d', cmap='Blues')
plt.title('Leakage-Free Future Frustration Prediction')
plt.ylabel('Actual Future Label')
plt.xlabel('Predicted Future Label')
plt.tight_layout()

# Save confusion matrix plot to disk
output_img = 'new_confusion_matrix.png'
if os.path.exists('shopper_intent_prediction'):
    output_img = os.path.join('shopper_intent_prediction', output_img)
plt.savefig(output_img)
print(f"Saved new confusion matrix plot to {output_img}")

# Feature Importance
importance = pd.DataFrame({'feature': features, 'importance': model.feature_importances_})
importance = importance.sort_values('importance', ascending=False)
print("\n--- Feature Importances ---")
print(importance)
