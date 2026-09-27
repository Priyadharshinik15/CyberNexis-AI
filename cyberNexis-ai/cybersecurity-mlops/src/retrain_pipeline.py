"""
retrain_pipeline.py — Full MLOps pipeline: drift → decide → retrain → evaluate → validate.
Run:  python src/retrain_pipeline.py
"""
import os, sys, json, time
import pandas as pd

SRC_DIR     = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.abspath(os.path.join(SRC_DIR, ".."))
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
MODELS_DIR  = os.path.join(ROOT_DIR, "models")
os.makedirs(REPORTS_DIR, exist_ok=True)
sys.path.insert(0, SRC_DIR)


def run_pipeline():
    t0 = time.time()
    print("=" * 60)
    print("  CyberNexis AI - MLOps Retraining Pipeline")
    print("=" * 60)

    report = {
        "pipeline_start": pd.Timestamp.now().isoformat(),
        "stages": {},
        "status": "RUNNING",
    }

    # -- Stage 1: Drift Detection -----------------------------------------------
    print("\n[Stage 1/4] Running drift monitor...")
    from drift_monitor import detect_drift
    drift = detect_drift()
    report["stages"]["drift"] = {
        "status": "OK",
        "overall_drift": drift.get("overall_drift_detected"),
        "severity": drift.get("drift_severity"),
        "n_drifted": drift.get("n_features_drifted"),
    }

    # -- Stage 2: Retraining Decision ------------------------------------------
    print("\n[Stage 2/4] Making retraining decision...")
    from retraining_decision import decide
    decision = decide()
    report["stages"]["decision"] = {
        "status": "OK",
        "should_retrain": decision.get("should_retrain"),
        "triggers": decision.get("triggers"),
    }

    if not decision.get("should_retrain"):
        report["status"] = "SKIPPED"
        report["message"] = "No retraining needed - model is healthy."
        report["pipeline_end"] = pd.Timestamp.now().isoformat()
        report["duration_s"] = round(time.time() - t0, 2)
        _save_report(report)
        print("\n[Pipeline] Retraining SKIPPED - model is healthy [OK]")
        return report

    # ── Stage 3: Retrain ──────────────────────────────────────────────────────
    print("\n[Stage 3/4] Retraining model...")
    from train import train
    metrics = train()
    report["stages"]["training"] = {
        "status": "OK",
        "accuracy": metrics.get("accuracy"),
        "f1": metrics.get("f1"),
        "roc_auc": metrics.get("roc_auc"),
        "duration_s": metrics.get("train_duration_s"),
    }

    # ── Stage 4: Evaluate + Validate ─────────────────────────────────────────
    print("\n[Stage 4/4] Evaluating new model...")
    from evaluate import evaluate
    comparison = evaluate()

    passed_validation = True
    val_notes = []
    if comparison and "current" in comparison:
        cur = comparison["current"]
        if float(cur.get("f1", 0)) < 0.90:
            passed_validation = False
            val_notes.append(f"F1 {cur['f1']} too low")
        if float(cur.get("accuracy", 0)) < 0.93:
            passed_validation = False
            val_notes.append(f"Accuracy {cur['accuracy']} too low")

    report["stages"]["evaluation"] = {
        "status": "OK" if passed_validation else "FAILED",
        "passed": passed_validation,
        "notes": val_notes,
        "metrics": comparison.get("current", {}),
        "delta": comparison.get("delta", {}),
    }

    # Reproducibility manifest
    manifest = {
        "timestamp": pd.Timestamp.now().isoformat(),
        "model_type": "XGBClassifier",
        "random_seed": 42,
        "data_files": ["data/train.csv"],
        "artifacts": [
            "models/xgboost_model.pkl",
            "models/encoder.pkl",
            "models/feature_columns.pkl",
            "models/categorical_features.pkl",
            "models/numerical_features.pkl",
            "models/threshold.txt",
        ],
        "metrics": metrics,
    }
    with open(os.path.join(REPORTS_DIR, "reproducibility_manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    # MLOps validation summary
    validation_report = {
        "timestamp": pd.Timestamp.now().isoformat(),
        "passed": passed_validation,
        "checks": {
            "drift_monitored": True,
            "retraining_triggered": True,
            "model_trained": True,
            "model_evaluated": True,
            "performance_thresholds_met": passed_validation,
        },
        "notes": val_notes,
    }
    with open(os.path.join(REPORTS_DIR, "mlops_validation.json"), "w") as f:
        json.dump(validation_report, f, indent=2)

    report["status"] = "SUCCESS" if passed_validation else "FAILED_VALIDATION"
    report["pipeline_end"] = pd.Timestamp.now().isoformat()
    report["duration_s"] = round(time.time() - t0, 2)
    _save_report(report)

    print(f"\n{'='*60}")
    print(f"  Pipeline {'SUCCESS [OK]' if passed_validation else 'FAILED [X]'}")
    print(f"  Duration: {report['duration_s']}s")
    print(f"{'='*60}")
    return report


def _save_report(report):
    with open(os.path.join(REPORTS_DIR, "retraining_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n[Pipeline] Full report -> reports/retraining_report.json")


if __name__ == "__main__":
    run_pipeline()
