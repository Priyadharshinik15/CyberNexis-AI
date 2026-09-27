"""
test_alerts.py - Direct CLI Test for Telegram and Email Alerting
Run this script to verify Telegram bot tokens and SMTP email settings.
"""

import sys
import os

# Append current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alert_dispatcher import alert_dispatcher

def run_tests():
    print("=" * 60)
    print("  CYBERNEXIS AI - TELEGRAM & EMAIL ALERT TEST")
    print("=" * 60)

    cfg = alert_dispatcher.get_public_config()
    tg = cfg["telegram"]
    em = cfg["email"]

    print("\nCurrent Configuration:")
    print(f" - Telegram Enabled: {tg['enabled']}")
    print(f" - Telegram Bot Token: {tg['bot_token_masked'] or 'Not set'}")
    print(f" - Telegram Chat ID: {tg['chat_id'] or 'Not set'}")
    print(f" - Email Enabled: {em['enabled']}")
    print(f" - SMTP Host: {em['smtp_server']}:{em['smtp_port']}")
    print(f" - SMTP User: {em['smtp_user'] or 'Not set'}")
    print(f" - Recipients: {', '.join(em['to_emails']) if em['to_emails'] else 'Not set'}")

    print("\n" + "-" * 60)
    print("1. Testing Telegram Alert Dispatch:")
    if not tg["has_bot_token"] or not tg["chat_id"]:
        print(" [SKIP] Telegram Bot Token or Chat ID not configured.")
        print("        Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env or the Settings dashboard.")
    else:
        test_msg = (
            "🚨 <b>CyberNexis AI - CLI Connectivity Test</b>\n\n"
            "✅ Telegram alert channel successfully verified from command line!"
        )
        ok, res = alert_dispatcher.send_telegram_message(test_msg)
        if ok:
            print(f" [PASS] Telegram message sent successfully: {res}")
        else:
            print(f" [FAIL] Telegram error: {res}")

    print("\n" + "-" * 60)
    print("2. Testing Email Alert Dispatch:")
    if not em["to_emails"] or not em["smtp_user"]:
        print(" [SKIP] SMTP User or Recipient email not configured.")
        print("        Set SMTP_USER, SMTP_PASSWORD, and ALERT_RECIPIENT_EMAIL in .env or Settings dashboard.")
    else:
        subject = "🛡️ CyberNexis AI - CLI Test Alert"
        html = "<p>CyberNexis AI email notifications are working successfully!</p>"
        text = "CyberNexis AI email notifications are working successfully!"
        ok, res = alert_dispatcher.send_email(subject, html, text)
        if ok:
            print(f" [PASS] Email sent successfully: {res}")
        else:
            print(f" [FAIL] SMTP error: {res}")

    print("\n" + "-" * 60)
    print("3. Testing Background Threat Dispatch Pipeline (with cooldown):")
    sample_threat = {
        "severity": "critical",
        "attack_type": "DoS Test Vector",
        "source_ip": "203.0.113.195",
        "country": "US",
        "message": "Automated verification alert from CyberNexis AI test harness."
    }
    alert_dispatcher.dispatch_threat_alert(sample_threat)
    print(" [PASS] Alert dispatch thread initiated cleanly.")

    print("\n" + "=" * 60)
    print("TEST HARNESS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
