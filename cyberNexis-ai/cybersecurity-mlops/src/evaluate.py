"""
evaluate.py — Evaluate trained model and produce comparison report.
Run:  python src/evaluate.py
"""
import os, sys, json, joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report, confusion_matrix,
)

SRC_DIR     = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.abspath(os.path.join(SRC_DIR, ".."))
DATA_DIR    = os.path.join(ROOT_DIR, "data")
MODELS_DIR  = os.path.join(ROOT_DIR, "models")
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


def load_artifacts():
    model      = joblib.load(os.path.join(MODELS_DIR, "xgboost_model.pkl"))
    encoder    = joblib.load(os.path.join(MODELS_DIR, "encoder.pkl"))
    feat_cols  = joblib.load(os.path.join(MODELS_DIR, "feature_columns.pkl"))
    cat_feats  = joblib.load(os.path.join(MODELS_DIR, "categorical_features.pkl"))
    num_feats  = joblib.load(os.path.join(MODELS_DIR, "numerical_features.pkl"))
    with open(os.path.join(MODELS_DIR, "threshold.txt")) as f:
        threshold = float(f.read().strip())
    return model, encoder, feat_cols, cat_feats, num_feats, threshold


def preprocess(df, encoder, cat_feats, num_feats):
    for col in cat_feats:
        if col not in df.columns:
            df[col] = "tcp" if col == "proto" else "-" if col == "service" else "CON"
    for col in num_feats:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    X_cat = encoder.transform(df[cat_feats])
    X_num = df[num_feats].to_numpy()
    return np.hstack([X_num, X_cat])


def evaluate():
    print("[Evaluate] Loading artifacts...")
    model, encoder, feat_cols, cat_feats, num_feats, threshold = load_artifacts()

    # Load or generate test data
    test_path = os.path.join(DATA_DIR, "current.csv")
    if not os.path.exists(test_path):
        sys.path.insert(0, SRC_DIR)
        from data_generator import generate_drift_dataset
        df = generate_drift_dataset(5000, drift_factor=0.0, seed=77)
        df.to_csv(test_path, index=False)
    df = pd.read_csv(test_path)
    if "label" not in df.columns:
        print("[Evaluate] No label column - cannot compute metrics.")
        return {}

    X = preprocess(df.copy(), encoder, cat_feats, num_feats)
    y = df["label"].values

    probs  = model.predict_proba(X)[:, 1]
    y_pred = (probs >= threshold).astype(int)

    metrics = {
        "accuracy":   round(float(accuracy_score(y, y_pred)), 6),
        "precision":  round(float(precision_score(y, y_pred, zero_division=0)), 6),
        "recall":     round(float(recall_score(y, y_pred, zero_division=0)), 6),
        "f1":         round(float(f1_score(y, y_pred, zero_division=0)), 6),
        "roc_auc":    round(float(roc_auc_score(y, probs)), 6),
        "threshold":  threshold,
        "n_samples":  int(len(y)),
        "timestamp":  pd.Timestamp.now().isoformat(),
    }
    metrics["confusion_matrix"] = confusion_matrix(y, y_pred).tolist()
    metrics["classification_report"] = classification_report(
        y, y_pred, target_names=["Normal", "Attack"], output_dict=True, zero_division=0
    )

    # ── Load previous metrics to compare ─────────────────────────────────────
    prev_path = os.path.join(REPORTS_DIR, "metrics.json")
    comparison = {"current": metrics}
    if os.path.exists(prev_path):
        with open(prev_path) as f:
            prev = json.load(f)
        comparison["previous"] = {k: prev.get(k) for k in ["accuracy", "precision", "recall", "f1", "roc_auc"]}
        comparison["delta"] = {
            k: round(metrics[k] - float(prev.get(k, metrics[k])), 6)
            for k in ["accuracy", "precision", "recall", "f1", "roc_auc"]
        }
        comparison["improved"] = all(v >= 0 for v in comparison["delta"].values())

    with open(os.path.join(REPORTS_DIR, "model_comparison.json"), "w") as f:
        json.dump(comparison, f, indent=2)

    print("[Evaluate] Metrics on current data:")
    for k, v in metrics.items():
        if k not in ("confusion_matrix", "classification_report", "timestamp"):
            print(f"  {k:<20} {v}")

    print(f"\n[Evaluate] Saved -> reports/model_comparison.json")
    return comparison


if __name__ == "__main__":
    evaluate()
