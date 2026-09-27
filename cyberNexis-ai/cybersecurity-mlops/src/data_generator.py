"""
data_generator.py
Generates synthetic UNSW-NB15-style network flow data for training and drift simulation.
Run directly to regenerate datasets:  python src/data_generator.py
"""
import os
import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)

# Feature columns matching UNSW-NB15 subset used by model_inference.py
FEATURE_COLS = [
    "proto", "service", "state",
    "dur", "spkts", "dpkts", "sbytes", "dbytes",
    "rate", "sload", "dload", "sloss", "dloss",
    "sinpkt", "dinpkt", "sjit", "djit",
    "swin", "stcpb", "dtcpb", "dwin",
    "tcprtt", "synack", "ackdat",
    "smean", "dmean", "trans_depth", "response_body_len",
    "ct_src_dport_ltm", "ct_dst_sport_ltm",
    "is_ftp_login", "ct_ftp_cmd", "ct_flw_http_mthd", "is_sm_ips_ports",
]

CAT_FEATURES = ["proto", "service", "state"]
NUM_FEATURES = [c for c in FEATURE_COLS if c not in CAT_FEATURES]

PROTOS   = ["tcp", "udp", "icmp", "ospf", "arp"]
SERVICES = ["-", "http", "ftp", "smtp", "dns", "ssh", "pop3", "snmp", "ssl"]
STATES   = ["CON", "INT", "FIN", "REQ", "RST", "ECO", "PAR", "URH", "CLO"]
LABELS   = [0, 1]  # 0 = normal, 1 = attack

ATTACK_TYPES = ["Normal", "DoS", "Reconnaissance", "Backdoor", "Exploit",
                "Worm", "Shellcode", "Generic", "Analysis", "Botnet"]


def _make_normal_row(rng):
    dur   = rng.uniform(0.0, 10.0)
    spkts = int(rng.integers(1, 80))
    dpkts = int(rng.integers(0, 60))
    sbytes = spkts * int(rng.integers(40, 600))
    dbytes = dpkts * int(rng.integers(0, 800))
    rate   = (spkts + dpkts) / max(dur, 0.001)
    sload  = sbytes * 8 / max(dur, 0.001)
    dload  = dbytes * 8 / max(dur, 0.001)
    smean  = sbytes // max(spkts, 1)
    dmean  = dbytes // max(dpkts, 1)
    return {
        "proto":   rng.choice(["tcp", "udp"]),
        "service": rng.choice(["-", "http", "dns", "ssl"]),
        "state":   rng.choice(["CON", "FIN", "INT"]),
        "dur": round(dur, 4),
        "spkts": spkts, "dpkts": dpkts,
        "sbytes": sbytes, "dbytes": dbytes,
        "rate": round(rate, 4),
        "sload": round(sload, 2), "dload": round(dload, 2),
        "sloss": max(0, spkts - dpkts - int(rng.integers(0, 3))),
        "dloss": max(0, dpkts - spkts - int(rng.integers(0, 3))),
        "sinpkt": round(dur / max(spkts, 1), 4),
        "dinpkt": round(dur / max(dpkts, 1), 4),
        "sjit": round(rng.uniform(0, 0.02), 4),
        "djit": round(rng.uniform(0, 0.02), 4),
        "swin": int(rng.integers(0, 65535)),
        "stcpb": int(rng.integers(100000, 9999999)),
        "dtcpb": int(rng.integers(100000, 9999999)),
        "dwin": int(rng.integers(0, 65535)),
        "tcprtt": round(rng.uniform(0, 0.3), 4),
        "synack": round(rng.uniform(0, 0.1), 4),
        "ackdat": round(rng.uniform(0, 0.1), 4),
        "smean": smean, "dmean": dmean,
        "trans_depth": int(rng.integers(0, 3)),
        "response_body_len": int(rng.integers(0, 5000)),
        "ct_src_dport_ltm": int(rng.integers(1, 5)),
        "ct_dst_sport_ltm": int(rng.integers(1, 5)),
        "is_ftp_login": 0, "ct_ftp_cmd": 0,
        "ct_flw_http_mthd": int(rng.integers(0, 2)),
        "is_sm_ips_ports": 0,
        "label": 0,
        "attack_cat": "Normal",
    }


def _make_attack_row(rng, attack_type=None):
    if attack_type is None:
        attack_type = rng.choice(ATTACK_TYPES[1:])
    dur = rng.uniform(0.001, 1.5)
    spkts = int(rng.integers(50, 800))
    dpkts = int(rng.integers(0, 30))
    sbytes = spkts * int(rng.integers(40, 200))
    dbytes = dpkts * int(rng.integers(0, 100))
    rate   = (spkts + dpkts) / max(dur, 0.001)
    sload  = sbytes * 8 / max(dur, 0.001)
    dload  = dbytes * 8 / max(dur, 0.001)
    smean  = sbytes // max(spkts, 1)
    dmean  = dbytes // max(dpkts, 1)
    return {
        "proto":   rng.choice(["tcp", "udp", "icmp"]),
        "service": rng.choice(["-", "http", "ftp", "ssh"]),
        "state":   rng.choice(["REQ", "INT", "RST", "CON"]),
        "dur": round(dur, 4),
        "spkts": spkts, "dpkts": dpkts,
        "sbytes": sbytes, "dbytes": dbytes,
        "rate": round(rate, 4),
        "sload": round(sload, 2), "dload": round(dload, 2),
        "sloss": int(rng.integers(0, 50)),
        "dloss": int(rng.integers(0, 10)),
        "sinpkt": round(dur / max(spkts, 1), 6),
        "dinpkt": round(dur / max(dpkts, 1), 6),
        "sjit": round(rng.uniform(0.02, 0.5), 4),
        "djit": round(rng.uniform(0, 0.1), 4),
        "swin": int(rng.integers(0, 4096)),
        "stcpb": int(rng.integers(0, 999)),
        "dtcpb": int(rng.integers(0, 999)),
        "dwin": int(rng.integers(0, 4096)),
        "tcprtt": round(rng.uniform(0, 0.01), 6),
        "synack": round(rng.uniform(0, 0.005), 6),
        "ackdat": round(rng.uniform(0, 0.005), 6),
        "smean": smean, "dmean": dmean,
        "trans_depth": int(rng.integers(0, 2)),
        "response_body_len": int(rng.integers(0, 200)),
        "ct_src_dport_ltm": int(rng.integers(20, 100)),
        "ct_dst_sport_ltm": int(rng.integers(10, 80)),
        "is_ftp_login": int(rng.integers(0, 2)) if attack_type == "Backdoor" else 0,
        "ct_ftp_cmd": int(rng.integers(0, 5)) if attack_type == "Backdoor" else 0,
        "ct_flw_http_mthd": int(rng.integers(0, 10)),
        "is_sm_ips_ports": int(rng.integers(0, 2)),
        "label": 1,
        "attack_cat": attack_type,
    }


def generate_dataset(n_normal: int = 40000, n_attack: int = 20000, seed: int = SEED) -> pd.DataFrame:
    rng_local = np.random.default_rng(seed)
    rows = []
    for _ in range(n_normal):
        rows.append(_make_normal_row(rng_local))
    for _ in range(n_attack):
        rows.append(_make_attack_row(rng_local))
    df = pd.DataFrame(rows)
    return df.sample(frac=1, random_state=seed).reset_index(drop=True)


def generate_drift_dataset(n: int = 5000, drift_factor: float = 0.3, seed: int = 99) -> pd.DataFrame:
    """Generate data with statistical drift — higher attack rate + shifted distributions."""
    rng_local = np.random.default_rng(seed)
    rows = []
    n_attack = int(n * (0.15 + drift_factor * 0.4))
    n_normal = n - n_attack
    for _ in range(n_normal):
        r = _make_normal_row(rng_local)
        # Drift: shift rate upward
        r["rate"] = r["rate"] * (1 + drift_factor * 2)
        r["sbytes"] = int(r["sbytes"] * (1 + drift_factor))
        rows.append(r)
    for _ in range(n_attack):
        rows.append(_make_attack_row(rng_local))
    df = pd.DataFrame(rows)
    return df.sample(frac=1, random_state=seed).reset_index(drop=True)


if __name__ == "__main__":
    import os
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)

    print("[DataGen] Generating training dataset (60,000 rows)...")
    train_df = generate_dataset(40000, 20000, seed=42)
    train_df.to_csv(os.path.join(data_dir, "train.csv"), index=False)
    print(f"  -> data/train.csv  ({len(train_df)} rows)")

    print("[DataGen] Generating reference dataset (10,000 rows)...")
    ref_df = generate_dataset(6667, 3333, seed=100)
    ref_df.to_csv(os.path.join(data_dir, "reference.csv"), index=False)
    print(f"  -> data/reference.csv  ({len(ref_df)} rows)")

    print("[DataGen] Generating current/production dataset with drift (5,000 rows)...")
    cur_df = generate_drift_dataset(5000, drift_factor=0.25, seed=200)
    cur_df.to_csv(os.path.join(data_dir, "current.csv"), index=False)
    print(f"  -> data/current.csv  ({len(cur_df)} rows)")

    print("[DataGen] Done.")
