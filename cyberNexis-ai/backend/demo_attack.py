"""
demo_attack.py — CyberNexis AI Live Attack Demo
================================================
Simulates multiple real-world attack scenarios and fires
real-time Telegram + Email notifications through the full
alert pipeline (same path as the live sniffer).

Run:
    python demo_attack.py
    python demo_attack.py --type dos       (single attack type)
    python demo_attack.py --all            (all attacks back-to-back)
"""

import sys
import os
import time
import argparse
import threading

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alert_dispatcher import alert_dispatcher

# ── ANSI colours for terminal output ──────────────────────────────────────────
RED    = "\033[91m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ── Attack scenario definitions ────────────────────────────────────────────────
ATTACK_SCENARIOS = {
    "dos": {
        "label":      "DoS / DDoS Flood",
        "severity":   "critical",
        "attack_type":"DoS Flood",
        "source_ip":  "185.220.101.45",
        "country":    "Russia",
        "message":    (
            "High-volume SYN flood detected. "
            "50,000 packets/sec saturating port 80. "
            "Automatic firewall rule applied. Connection table exhausted."
        ),
    },
    "recon": {
        "label":      "Reconnaissance / Port Scan",
        "severity":   "warning",
        "attack_type":"Reconnaissance",
        "source_ip":  "45.33.32.156",
        "country":    "China",
        "message":    (
            "Systematic port scan detected across 1024 ports. "
            "TCP SYN packets with no SYN-ACK response. "
            "Likely automated scanner probing for open services."
        ),
    },
    "botnet": {
        "label":      "Botnet C2 Communication",
        "severity":   "critical",
        "attack_type":"Botnet",
        "source_ip":  "198.51.100.77",
        "country":    "Iran",
        "message":    (
            "Outbound beaconing to known botnet C2 server detected. "
            "Repeated low-and-slow connections every 30 seconds. "
            "Possible compromised host inside network."
        ),
    },
    "exploit": {
        "label":      "Exploit / Zero-Day Attempt",
        "severity":   "critical",
        "attack_type":"Exploit",
        "source_ip":  "203.0.113.99",
        "country":    "North Korea",
        "message":    (
            "Malformed HTTP payload targeting CVE-2024-1234. "
            "Buffer overflow pattern detected in request body. "
            "Destination: internal web server port 443."
        ),
    },
    "backdoor": {
        "label":      "Backdoor / Reverse Shell",
        "severity":   "critical",
        "attack_type":"Backdoor",
        "source_ip":  "91.108.4.200",
        "country":    "Ukraine",
        "message":    (
            "Suspicious outbound shell session on port 4444. "
            "Reverse TCP shell signature matched. "
            "Attacker may have gained remote code execution."
        ),
    },
    "shellcode": {
        "label":      "Shellcode Injection",
        "severity":   "critical",
        "attack_type":"Shellcode",
        "source_ip":  "77.88.55.77",
        "country":    "Germany",
        "message":    (
            "NOP sled + shellcode pattern found in DNS query payload. "
            "DNS tunnelling exfiltration attempt likely. "
            "Immediate isolation of affected endpoint recommended."
        ),
    },
    "generic": {
        "label":      "Generic Anomaly",
        "severity":   "warning",
        "attack_type":"Generic Anomaly",
        "source_ip":  "104.16.89.20",
        "country":    "USA",
        "message":    (
            "Unusual traffic pattern not matching baseline profile. "
            "AI model confidence 87%. "
            "Further investigation required."
        ),
    },
}

# ── Helpers ────────────────────────────────────────────────────────────────────

def print_banner():
    print(f"\n{BOLD}{CYAN}{'='*60}")
    print("   CYBERNEXIS AI — LIVE ATTACK DEMO SIMULATOR")
    print(f"{'='*60}{RESET}")
    print(f"{YELLOW}  Attacks will fire real Telegram + Email notifications{RESET}")
    print(f"{CYAN}{'='*60}{RESET}\n")


def print_attack_start(scenario: dict):
    label = scenario["label"]
    ip    = scenario["source_ip"]
    ctry  = scenario["country"]
    sev   = scenario["severity"].upper()
    color = RED if sev == "CRITICAL" else YELLOW
    print(f"{color}{'─'*60}")
    print(f"  🚨  {sev}  |  {label}")
    print(f"  🌐  Source IP : {ip}  ({ctry})")
    print(f"{'─'*60}{RESET}")


def dispatch_and_wait(scenario: dict, delay_after: float = 3.0):
    """Send the alert through the full alert_dispatcher pipeline."""
    print_attack_start(scenario)
    print(f"  {CYAN}→ Dispatching Telegram + Email notifications...{RESET}")

    # Use dispatch_threat_alert (background thread, same as sniffer)
    # Bypass cooldown by calling _execute_dispatch directly for demo
    t = threading.Thread(
        target=alert_dispatcher._execute_dispatch,
        args=(scenario,),
        daemon=True
    )
    t.start()
    t.join(timeout=12)   # wait up to 12 sec for both sends to complete

    print(f"  {GREEN}✅ Alert dispatched — check Telegram & Email now!{RESET}\n")
    time.sleep(delay_after)


def run_menu():
    """Interactive menu to pick attack type."""
    print("Pick an attack scenario to simulate:\n")
    keys = list(ATTACK_SCENARIOS.keys())
    for i, k in enumerate(keys, 1):
        label = ATTACK_SCENARIOS[k]["label"]
        sev   = ATTACK_SCENARIOS[k]["severity"].upper()
        color = RED if sev == "CRITICAL" else YELLOW
        print(f"  {color}[{i}]{RESET}  {label}  ({sev})")
    print(f"  {CYAN}[A]{RESET}  Fire ALL attacks back-to-back (5 sec gap)")
    print(f"  {CYAN}[Q]{RESET}  Quit\n")

    choice = input("Enter choice: ").strip().lower()

    if choice == "q":
        print("Exiting demo.")
        sys.exit(0)

    if choice == "a":
        run_all()
        return

    try:
        idx = int(choice) - 1
        key = keys[idx]
        dispatch_and_wait(ATTACK_SCENARIOS[key], delay_after=0)
    except (ValueError, IndexError):
        print(f"{RED}Invalid choice.{RESET}")


def run_single(attack_key: str):
    if attack_key not in ATTACK_SCENARIOS:
        print(f"{RED}Unknown attack type '{attack_key}'. "
              f"Valid: {', '.join(ATTACK_SCENARIOS.keys())}{RESET}")
        sys.exit(1)
    dispatch_and_wait(ATTACK_SCENARIOS[attack_key], delay_after=0)


def run_all():
    total = len(ATTACK_SCENARIOS)
    print(f"\n{BOLD}Firing all {total} attack scenarios with 5-second gaps...{RESET}\n")
    for i, (key, scenario) in enumerate(ATTACK_SCENARIOS.items(), 1):
        print(f"{CYAN}[{i}/{total}]{RESET}", end=" ")
        dispatch_and_wait(scenario, delay_after=5.0 if i < total else 0)
    print(f"\n{GREEN}{BOLD}✅ All {total} attacks simulated. "
          f"Check your Telegram and Email inbox!{RESET}\n")


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    print_banner()

    # Quick config sanity check
    cfg = alert_dispatcher.get_public_config()
    tg  = cfg["telegram"]
    em  = cfg["email"]

    print(f"{BOLD}Alert Configuration Status:{RESET}")
    tg_ok = tg["has_bot_token"] and tg["chat_id"]
    em_ok = bool(em["to_emails"] and em["smtp_user"])
    print(f"  Telegram : {'✅ Ready' if tg_ok else '❌ Not configured'}"
          f"  (token: {tg['bot_token_masked'] or 'missing'}, chat_id: {tg['chat_id'] or 'missing'})")
    print(f"  Email    : {'✅ Ready' if em_ok else '❌ Not configured'}"
          f"  (user: {em['smtp_user'] or 'missing'}, to: {', '.join(em['to_emails']) or 'missing'})\n")

    if not tg_ok and not em_ok:
        print(f"{RED}⚠  Neither Telegram nor Email is configured. "
              f"Set credentials in alert_config.json or .env{RESET}\n")
        sys.exit(1)

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--type",  default=None, help="Attack type key")
    parser.add_argument("--all",   action="store_true")
    parser.add_argument("--list",  action="store_true")
    args, _ = parser.parse_known_args()

    if args.list:
        print("Available attack types:")
        for k, v in ATTACK_SCENARIOS.items():
            print(f"  --type {k:<12}  {v['label']}")
        sys.exit(0)

    if args.all:
        run_all()
    elif args.type:
        run_single(args.type)
    else:
        run_menu()


if __name__ == "__main__":
    main()
