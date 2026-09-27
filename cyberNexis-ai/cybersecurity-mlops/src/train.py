"""
train.py — Train XGBoost classifier on UNSW-NB15 style data.
Saves model artifacts to models/ directory.
Run:  python src/train.py
"""
import os, sys, json, time, joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
)
from xgboost import XGBClassifier

# Paths
SRC_DIR     = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.abspath(os.path.join(SRC_DIR, ".."))
DATA_DIR    = os.path.join(ROOT_DIR, "data")
MODELS_DIR  = os.path.join(ROOT_DIR, "models")
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")

for d in [DATA_DIR, MODELS_DIR, REPORTS_DIR]:
    os.makedirs(d, exist_ok=True)

# ── Feature definitions ────────────────────────────────────────────────────────
CAT_FEATURES = ["proto", "service", "state"]
NUM_FEATURES = [
    "dur", "spkts", "dpkts", "sbytes", "dbytes",
    "rate", "sload", "dload", "sloss", "dloss",
    "sinpkt", "dinpkt", "sjit", "djit",
    "swin", "stcpb", "dtcpb", "dwin",
    "tcprtt", "synack", "ackdat",
    "smean", "dmean", "trans_depth", "response_body_len",
    "ct_src_dport_ltm", "ct_dst_sport_ltm",
    "is_ftp_login", "ct_ftp_cmd", "ct_flw_http_mthd", "is_sm_ips_ports",
]
FEATURE_COLS = CAT_FEATURES + NUM_FEATURES
TARGET       = "label"


def load_or_generate_data():
    train_path = os.path.join(DATA_DIR, "train.csv")
    if not os.path.exists(train_path):
        print("[Train] train.csv not found - generating synthetic dataset...")
        sys.path.insert(0, SRC_DIR)
        from data_generator import generate_dataset
        df = generate_dataset(40000, 20000, seed=42)
        df.to_csv(train_path, index=False)
        print(f"[Train] Generated {len(df)} rows -> data/train.csv")
    return pd.read_csv(train_path)


def preprocess(df: pd.DataFrame, encoder=None):
    X = df[FEATURE_COLS].copy()
    y = df[TARGET].values

    for col in CAT_FEATURES:
        if col not in X.columns:
            X[col] = "tcp" if col == "proto" else "-" if col == "service" else "CON"

    for col in NUM_FEATURES:
        if col not in X.columns:
            X[col] = 0.0
        X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0.0)

    if encoder is None:
        encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        X_cat = encoder.fit_transform(X[CAT_FEATURES])
    else:
        X_cat = encoder.transform(X[CAT_FEATURES])

    X_num  = X[NUM_FEATURES].to_numpy()
    X_enc  = np.hstack([X_num, X_cat])
    return X_enc, y, encoder


def compute_threshold(model, X_val, y_val) -> float:
    """Pick threshold that maximises F1 on validation set."""
    probs = model.predict_proba(X_val)[:, 1]
    best_f1, best_t = 0, 0.5
    for t in np.arange(0.1, 0.95, 0.05):
        preds = (probs >= t).astype(int)
        f1 = f1_score(y_val, preds, zero_division=0)
        if f1 > best_f1:
            best_f1, best_t = f1, t
    return round(best_t, 2)


def train():
    print("=" * 60)
    print("  CyberNexis AI - Model Training")
    print("=" * 60)
    t0 = time.time()

    df = load_or_generate_data()
    print(f"[Train] Loaded {len(df)} rows | attack ratio: {df[TARGET].mean():.2%}")

    X, y, encoder = preprocess(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    X_train, X_val,  y_train, y_val  = train_test_split(X_train, y_train, test_size=0.15, random_state=42)

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        early_stopping_rounds=20,
        random_state=42,
        n_jobs=-1,
    )

    print("[Train] Fitting XGBoost...")
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=50)

    threshold = compute_threshold(model, X_val, y_val)
    print(f"[Train] Optimal decision threshold: {threshold}")

    # -- Evaluate --------------------------------------------------------------
    probs_test = model.predict_proba(X_test)[:, 1]
    y_pred     = (probs_test >= threshold).astype(int)

    metrics = {
        "accuracy":            round(float(accuracy_score(y_test, y_pred)), 6),
        "precision":           round(float(precision_score(y_test, y_pred, zero_division=0)), 6),
        "recall":              round(float(recall_score(y_test, y_pred, zero_division=0)), 6),
        "f1":                  round(float(f1_score(y_test, y_pred, zero_division=0)), 6),
        "roc_auc":             round(float(roc_auc_score(y_test, probs_test)), 6),
        "threshold":           threshold,
        "train_samples":       int(len(X_train)),
        "test_samples":        int(len(X_test)),
        "attack_ratio_train":  round(float(y_train.mean()), 4),
        "attack_ratio_test":   round(float(y_test.mean()), 4),
        "train_duration_s":    round(time.time() - t0, 2),
        "timestamp":           pd.Timestamp.now().isoformat(),
    }
    cm = confusion_matrix(y_test, y_pred).tolist()
    metrics["confusion_matrix"] = cm

    print("\n-- Metrics " + "-" * 33)
    for k, v in metrics.items():
        if k not in ("confusion_matrix", "timestamp"):
            print(f"  {k:<28} {v}")
    print("-" * 44)

    # ── Save artifacts ─────────────────────────────────────────────────────────
    joblib.dump(model,        os.path.join(MODELS_DIR, "xgboost_model.pkl"))
    joblib.dump(encoder,      os.path.join(MODELS_DIR, "encoder.pkl"))
    joblib.dump(FEATURE_COLS, os.path.join(MODELS_DIR, "feature_columns.pkl"))
    joblib.dump(CAT_FEATURES, os.path.join(MODELS_DIR, "categorical_features.pkl"))
    joblib.dump(NUM_FEATURES, os.path.join(MODELS_DIR, "numerical_features.pkl"))
    with open(os.path.join(MODELS_DIR, "threshold.txt"), "w") as f:
        f.write(str(threshold))

    with open(os.path.join(REPORTS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    # Save test predictions for drift baseline
    pd.DataFrame({"y_true": y_test, "y_prob": probs_test}).to_csv(
        os.path.join(MODELS_DIR, "test_predictions.csv"), index=False
    )

    print(f"\n[Train] All artifacts saved to models/")
    print(f"[Train] Report saved to reports/metrics.json")
    print(f"[Train] Total time: {metrics['train_duration_s']}s")
    return metrics


if __name__ == "__main__":
    train()
