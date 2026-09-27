"""
retraining_decision.py — Decides whether to retrain based on drift report + metrics.
Run:  python src/retraining_decision.py
"""
import os, json
import pandas as pd

SRC_DIR     = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.abspath(os.path.join(SRC_DIR, ".."))
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# Thresholds
MIN_F1       = 0.92
MIN_ACCURACY = 0.95
MIN_RECALL   = 0.90


def decide():
    drift_path   = os.path.join(REPORTS_DIR, "drift_report.json")
    metrics_path = os.path.join(REPORTS_DIR, "metrics.json")

    reasons  = []
    triggers = []

    # ── Check drift ────────────────────────────────────────────────────────────
    drift = {}
    if os.path.exists(drift_path):
        with open(drift_path) as f:
            drift = json.load(f)
        if drift.get("overall_drift_detected"):
            n = drift.get("n_features_drifted", 0)
            sev = drift.get("drift_severity", "low")
            reasons.append(f"Data drift detected in {n} features (severity: {sev})")
            triggers.append("data_drift")
    else:
        reasons.append("No drift report found — assume stale.")
        triggers.append("missing_drift_report")

    # ── Check performance metrics ──────────────────────────────────────────────
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)
        if float(metrics.get("f1", 1.0)) < MIN_F1:
            reasons.append(f"F1 score {metrics['f1']:.4f} below threshold {MIN_F1}")
            triggers.append("low_f1")
        if float(metrics.get("accuracy", 1.0)) < MIN_ACCURACY:
            reasons.append(f"Accuracy {metrics['accuracy']:.4f} below threshold {MIN_ACCURACY}")
            triggers.append("low_accuracy")
        if float(metrics.get("recall", 1.0)) < MIN_RECALL:
            reasons.append(f"Recall {metrics['recall']:.4f} below threshold {MIN_RECALL}")
            triggers.append("low_recall")
    else:
        reasons.append("No metrics report found — initial training required.")
        triggers.append("no_model")

    should_retrain = len(triggers) > 0

    decision = {
        "timestamp":         pd.Timestamp.now().isoformat(),
        "should_retrain":    should_retrain,
        "triggers":          triggers,
        "reasons":           reasons,
        "thresholds": {
            "min_f1":       MIN_F1,
            "min_accuracy": MIN_ACCURACY,
            "min_recall":   MIN_RECALL,
        },
        "current_metrics": {
            k: metrics.get(k)
            for k in ["accuracy", "precision", "recall", "f1", "roc_auc"]
        },
        "drift_summary": {
            "overall": drift.get("overall_drift_detected"),
            "severity": drift.get("drift_severity"),
            "n_drifted": drift.get("n_features_drifted"),
        } if drift else {},
    }

    with open(os.path.join(REPORTS_DIR, "retraining_decision.json"), "w") as f:
        json.dump(decision, f, indent=2)

    print(f"\n[Decision] Retrain: {'YES [RETRAIN]' if should_retrain else 'NO [OK]'}")
    for r in reasons:
        print(f"  * {r}")
    print(f"[Decision] Saved -> reports/retraining_decision.json")
    return decision


if __name__ == "__main__":
    decide()
