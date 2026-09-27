"""
drift_monitor.py — Statistical drift detection between reference and current data.
Uses PSI (Population Stability Index) + KS-test + chi-squared for categories.
Run:  python src/drift_monitor.py
"""
import os, sys, json
import numpy as np
import pandas as pd
from scipy import stats

SRC_DIR     = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.abspath(os.path.join(SRC_DIR, ".."))
DATA_DIR    = os.path.join(ROOT_DIR, "data")
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

CAT_FEATURES = ["proto", "service", "state"]
NUM_FEATURES = [
    "dur", "spkts", "dpkts", "sbytes", "dbytes",
    "rate", "sload", "dload", "sloss", "dloss",
    "sinpkt", "sjit", "smean", "dmean",
    "ct_src_dport_ltm", "ct_dst_sport_ltm",
]

PSI_THRESHOLD = 0.2   # >0.2 = significant drift
KS_ALPHA      = 0.05  # p-value threshold for KS test


def compute_psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
    """Population Stability Index — measures distribution shift."""
    min_val = min(expected.min(), actual.min())
    max_val = max(expected.max(), actual.max())
    if max_val == min_val:
        return 0.0
    buckets = np.linspace(min_val, max_val, bins + 1)
    exp_counts, _ = np.histogram(expected, bins=buckets)
    act_counts, _ = np.histogram(actual,   bins=buckets)
    exp_pct = np.where(exp_counts == 0, 1e-4, exp_counts / len(expected))
    act_pct = np.where(act_counts == 0, 1e-4, act_counts / len(actual))
    psi = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return float(round(psi, 6))


def compute_ks(ref: np.ndarray, cur: np.ndarray):
    stat, p_value = stats.ks_2samp(ref, cur)
    return float(round(stat, 6)), float(round(p_value, 6))


def compute_chi2(ref_series: pd.Series, cur_series: pd.Series):
    cats = sorted(set(ref_series.unique()) | set(cur_series.unique()))
    ref_counts = [ref_series.value_counts().get(c, 0) for c in cats]
    cur_counts = [cur_series.value_counts().get(c, 0) for c in cats]
    if sum(ref_counts) == 0 or sum(cur_counts) == 0:
        return 0.0, 1.0
    ref_arr = np.array(ref_counts, dtype=float)
    cur_arr = np.array(cur_counts, dtype=float)
    # Normalise to same scale
    cur_expected = ref_arr / ref_arr.sum() * cur_arr.sum()
    cur_expected = np.where(cur_expected < 1, 1, cur_expected)
    stat, p = stats.chisquare(cur_arr, cur_expected)
    return float(round(stat, 4)), float(round(p, 6))


def detect_drift():
    print("[DriftMonitor] Loading datasets...")

    ref_path = os.path.join(DATA_DIR, "reference.csv")
    cur_path = os.path.join(DATA_DIR, "current.csv")

    if not os.path.exists(ref_path) or not os.path.exists(cur_path):
        sys.path.insert(0, SRC_DIR)
        from data_generator import generate_dataset, generate_drift_dataset
        if not os.path.exists(ref_path):
            print("[DriftMonitor] Generating reference dataset...")
            generate_dataset(6667, 3333, seed=100).to_csv(ref_path, index=False)
        if not os.path.exists(cur_path):
            print("[DriftMonitor] Generating current dataset with drift...")
            generate_drift_dataset(5000, drift_factor=0.25, seed=200).to_csv(cur_path, index=False)

    ref = pd.read_csv(ref_path)
    cur = pd.read_csv(cur_path)
    print(f"[DriftMonitor] Reference: {len(ref)} rows | Current: {len(cur)} rows")

    feature_reports = {}
    drift_detected_features = []

    # ── Numerical features ─────────────────────────────────────────────────────
    for feat in NUM_FEATURES:
        if feat not in ref.columns or feat not in cur.columns:
            continue
        ref_vals = ref[feat].dropna().to_numpy().astype(float)
        cur_vals = cur[feat].dropna().to_numpy().astype(float)
        psi = compute_psi(ref_vals, cur_vals)
        ks_stat, ks_p = compute_ks(ref_vals, cur_vals)
        drifted = psi > PSI_THRESHOLD or ks_p < KS_ALPHA
        feature_reports[feat] = {
            "type":      "numerical",
            "psi":       psi,
            "ks_stat":   ks_stat,
            "ks_pvalue": ks_p,
            "drift_detected": drifted,
            "ref_mean":  round(float(ref_vals.mean()), 4),
            "cur_mean":  round(float(cur_vals.mean()), 4),
            "ref_std":   round(float(ref_vals.std()),  4),
            "cur_std":   round(float(cur_vals.std()),  4),
        }
        if drifted:
            drift_detected_features.append(feat)

    # ── Categorical features ───────────────────────────────────────────────────
    for feat in CAT_FEATURES:
        if feat not in ref.columns or feat not in cur.columns:
            continue
        chi2_stat, chi2_p = compute_chi2(ref[feat], cur[feat])
        drifted = chi2_p < KS_ALPHA
        feature_reports[feat] = {
            "type":         "categorical",
            "chi2_stat":    chi2_stat,
            "chi2_pvalue":  chi2_p,
            "drift_detected": drifted,
            "ref_distribution": ref[feat].value_counts(normalize=True).round(4).to_dict(),
            "cur_distribution": cur[feat].value_counts(normalize=True).round(4).to_dict(),
        }
        if drifted:
            drift_detected_features.append(feat)

    # ── Label drift ────────────────────────────────────────────────────────────
    label_drift = False
    if "label" in ref.columns and "label" in cur.columns:
        ref_attack_rate = float(ref["label"].mean())
        cur_attack_rate = float(cur["label"].mean())
        label_drift = abs(cur_attack_rate - ref_attack_rate) > 0.05
        feature_reports["label"] = {
            "type": "target",
            "ref_attack_rate": round(ref_attack_rate, 4),
            "cur_attack_rate": round(cur_attack_rate, 4),
            "drift_detected":  label_drift,
        }
        if label_drift:
            drift_detected_features.append("label")

    # ── Summary ────────────────────────────────────────────────────────────────
    n_drifted = len(drift_detected_features)
    n_total   = len(feature_reports)
    overall_drift = n_drifted >= 3 or label_drift

    report = {
        "timestamp":               pd.Timestamp.now().isoformat(),
        "n_reference_samples":     int(len(ref)),
        "n_current_samples":       int(len(cur)),
        "n_features_checked":      n_total,
        "n_features_drifted":      n_drifted,
        "drifted_features":        drift_detected_features,
        "overall_drift_detected":  overall_drift,
        "drift_severity":          "high" if n_drifted >= 5 else "medium" if n_drifted >= 2 else "low",
        "psi_threshold":           PSI_THRESHOLD,
        "ks_alpha":                KS_ALPHA,
        "features": feature_reports,
    }

    with open(os.path.join(REPORTS_DIR, "drift_report.json"), "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n[DriftMonitor] Features drifted: {n_drifted}/{n_total}")
    print(f"[DriftMonitor] Overall drift: {'YES [DRIFT]' if overall_drift else 'NO [OK]'}")
    print(f"[DriftMonitor] Severity: {report['drift_severity'].upper()}")
    print(f"[DriftMonitor] Report -> reports/drift_report.json")
    return report


if __name__ == "__main__":
    detect_drift()
