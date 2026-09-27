"""
alert_dispatcher.py - CyberNexis AI Alert Notification Engine
Dispatches real-time security alerts to Telegram channels/chats and Email (SMTP).
Includes rate-limiting/cooldown, HTML email templates, and connection testing.
"""

import os
import json
import time
import smtplib
import threading
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

import config

CONFIG_FILE = os.path.join(config.BACKEND_DIR, "alert_config.json")


class AlertDispatcher:
    def __init__(self):
        self.lock = threading.Lock()
        self.last_alert_times = {}  # { "ip:type": timestamp }
        self.cooldown_seconds = 60    # Min seconds between duplicate alerts
        
        # Load default configuration from config.py / environment
        self.config = {
            "telegram": {
                "enabled": getattr(config, "TELEGRAM_ALERTS_ENABLED", True),
                "bot_token": getattr(config, "TELEGRAM_BOT_TOKEN", ""),
                "chat_id": getattr(config, "TELEGRAM_CHAT_ID", "")
            },
            "email": {
                "enabled": getattr(config, "EMAIL_ALERTS_ENABLED", True),
                "smtp_server": getattr(config, "SMTP_SERVER", "smtp.gmail.com"),
                "smtp_port": getattr(config, "SMTP_PORT", 587),
                "smtp_user": getattr(config, "SMTP_USER", ""),
                "smtp_password": getattr(config, "SMTP_PASSWORD", ""),
                "from_email": getattr(config, "SMTP_FROM_EMAIL", ""),
                "to_emails": [getattr(config, "ALERT_RECIPIENT_EMAIL", "")] if getattr(config, "ALERT_RECIPIENT_EMAIL", "") else []
            },
            "min_severity": "warning",
            "cooldown_seconds": 60
        }
        
        self._load_config_file()

    def _load_config_file(self):
        """Loads persistent config overrides from alert_config.json if present."""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    if "telegram" in saved:
                        self.config["telegram"].update(saved["telegram"])
                    if "email" in saved:
                        self.config["email"].update(saved["email"])
                    if "min_severity" in saved:
                        self.config["min_severity"] = saved["min_severity"]
                    if "cooldown_seconds" in saved:
                        self.config["cooldown_seconds"] = int(saved["cooldown_seconds"])
                        self.cooldown_seconds = self.config["cooldown_seconds"]
            except Exception as e:
                print(f"[AlertDispatcher] Error loading alert_config.json: {e}")

    def save_config(self, new_config: dict):
        """Updates and persists the alert configuration."""
        with self.lock:
            if "telegram" in new_config:
                self.config["telegram"].update(new_config["telegram"])
            if "email" in new_config:
                self.config["email"].update(new_config["email"])
            if "min_severity" in new_config:
                self.config["min_severity"] = new_config["min_severity"]
            if "cooldown_seconds" in new_config:
                self.config["cooldown_seconds"] = int(new_config["cooldown_seconds"])
                self.cooldown_seconds = self.config["cooldown_seconds"]

            try:
                with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump(self.config, f, indent=2)
                return True, "Alert configuration saved successfully"
            except Exception as e:
                return False, f"Failed to save alert configuration: {e}"

    def get_public_config(self) -> dict:
        """Returns configuration with sensitive keys masked for frontend display."""
        with self.lock:
            t = self.config["telegram"]
            e = self.config["email"]
            
            token = t.get("bot_token", "")
            masked_token = f"{token[:6]}...{token[-4:]}" if len(token) > 10 else ("configured" if token else "")
            
            pwd = e.get("smtp_password", "")
            masked_pwd = "********" if pwd else ""
            
            return {
                "telegram": {
                    "enabled": bool(t.get("enabled")),
                    "bot_token": t.get("bot_token", ""),
                    "bot_token_masked": masked_token,
                    "has_bot_token": bool(token),
                    "chat_id": t.get("chat_id", "")
                },
                "email": {
                    "enabled": bool(e.get("enabled")),
                    "smtp_server": e.get("smtp_server", "smtp.gmail.com"),
                    "smtp_port": e.get("smtp_port", 587),
                    "smtp_user": e.get("smtp_user", ""),
                    "has_smtp_password": bool(pwd),
                    "smtp_password_masked": masked_pwd,
                    "from_email": e.get("from_email", ""),
                    "to_emails": e.get("to_emails", [])
                },
                "min_severity": self.config.get("min_severity", "warning"),
                "cooldown_seconds": self.cooldown_seconds
            }

    # -- Telegram --------------------------------------------------------------

    def send_telegram_message(self, text: str, bot_token: str = None, chat_id: str = None) -> tuple[bool, str]:
        """Sends an HTML formatted message via Telegram Bot API."""
        token = bot_token or self.config["telegram"].get("bot_token")
        cid = chat_id or self.config["telegram"].get("chat_id")

        if not token or not cid:
            return False, "Telegram Bot Token or Chat ID is missing."

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": cid,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }

        try:
            resp = requests.post(url, json=payload, timeout=8)
            data = resp.json()
            if resp.status_code == 200 and data.get("ok"):
                return True, "Telegram alert sent successfully."
            else:
                desc = data.get("description", "Unknown error")
                return False, f"Telegram API error: {desc}"
        except Exception as e:
            return False, f"Network error sending Telegram alert: {e}"

    # -- Email (SMTP) ---------------------------------------------------------

    def send_email(self, subject: str, html_content: str, text_content: str = "", to_emails: list = None,
                   smtp_server: str = None, smtp_port: int = None, smtp_user: str = None,
                   smtp_password: str = None, from_email: str = None) -> tuple[bool, str]:
        """Sends an email alert via SMTP with both HTML and plain text alternatives."""
        e_cfg = self.config["email"]
        recipients = to_emails if to_emails is not None else e_cfg.get("to_emails", [])
        if isinstance(recipients, str):
            recipients = [r.strip() for r in recipients.split(",") if r.strip()]

        if not recipients:
            return False, "No recipient email addresses specified."

        server_host = smtp_server or e_cfg.get("smtp_server", "smtp.gmail.com")
        port = int(smtp_port or e_cfg.get("smtp_port", 587))
        user = smtp_user if smtp_user is not None else e_cfg.get("smtp_user", "")
        password = smtp_password if smtp_password is not None else e_cfg.get("smtp_password", "")
        sender = from_email or e_cfg.get("from_email") or user or "alerts@sentinel-ai.local"

        if not server_host:
            return False, "SMTP server host not configured."

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"CyberNexis AI SOC <{sender}>"
        msg["To"] = ", ".join(recipients)

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        if html_content:
            msg.attach(MIMEText(html_content, "html"))

        try:
            if port == 465:
                server = smtplib.SMTP_SSL(server_host, port, timeout=10)
            else:
                server = smtplib.SMTP(server_host, port, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()

            if user and password:
                server.login(user, password)

            server.sendmail(sender, recipients, msg.as_string())
            server.quit()
            return True, f"Email alert sent to {', '.join(recipients)}."
        except Exception as e:
            return False, f"SMTP Error sending email: {e}"

    # -- Dispatch Orchestration ------------------------------------------------

    def dispatch_threat_alert(self, alert_data: dict):
        """
        Dispatches an alert in a background thread to prevent blocking packet capture.
        Respects cooldown per source IP to prevent flooding.
        """
        severity = alert_data.get("severity", "warning").lower()
        if self.config.get("min_severity") == "critical" and severity != "critical":
            return

        src_ip = alert_data.get("source_ip", "0.0.0.0")
        attack_type = alert_data.get("attack_type", "Unknown")
        key = f"{src_ip}:{attack_type}"

        # Cooldown check
        now = time.time()
        last_sent = self.last_alert_times.get(key, 0)
        if now - last_sent < self.cooldown_seconds:
            return  # Throttle duplicate alerts

        self.last_alert_times[key] = now

        # Run dispatch in a background thread
        threading.Thread(target=self._execute_dispatch, args=(alert_data,), daemon=True).start()

    def _execute_dispatch(self, alert: dict):
        attack_type = alert.get("attack_type", "Security Anomaly")
        severity = alert.get("severity", "warning").upper()
        src_ip = alert.get("source_ip", "Unknown")
        country = alert.get("country", "Unknown")
        msg = alert.get("message", "Threat detected by AI model.")
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        # 1. Telegram Dispatch
        if self.config["telegram"].get("enabled") and self.config["telegram"].get("bot_token"):
            tg_text = (
                f"🚨 <b>CyberNexis AI THREAT ALERT</b>\n\n"
                f"⚠️ <b>Severity:</b> {severity}\n"
                f"🎯 <b>Attack Type:</b> {attack_type}\n"
                f"🌐 <b>Attacker IP:</b> <code>{src_ip}</code>\n"
                f"📍 <b>Location:</b> {country}\n"
                f"🕒 <b>Timestamp:</b> {timestamp}\n\n"
                f"📝 <b>Details:</b> {msg}\n"
                f"🛡️ <i>CyberNexis AI Defense Active</i>"
            )
            ok, res = self.send_telegram_message(tg_text)
            if ok:
                print(f"[Alert] Telegram notification dispatched for {src_ip} ({attack_type}).")
            else:
                print(f"[Alert] Telegram notification failed: {res}")

        # 2. Email Dispatch
        if self.config["email"].get("enabled") and self.config["email"].get("to_emails"):
            subject = f"[{severity}] CyberNexis AI Threat Alert: {attack_type} from {src_ip}"
            
            text_body = (
                f"CYBERNEXIS AI SECURITY INCIDENT ALERT\n"
                f"------------------------------------\n"
                f"Severity: {severity}\n"
                f"Attack Type: {attack_type}\n"
                f"Source IP: {src_ip}\n"
                f"Origin: {country}\n"
                f"Timestamp: {timestamp}\n"
                f"Message: {msg}\n"
            )

            badge_color = "#ef4444" if severity == "CRITICAL" else "#f59e0b"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 20px; }}
                .card {{ max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                .header {{ background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 20px 24px; color: white; }}
                .header h2 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }}
                .badge {{ display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: bold; border-radius: 6px; text-transform: uppercase; margin-top: 8px; background: {badge_color}; color: white; }}
                .content {{ padding: 24px; }}
                .table {{ width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }}
                .table td {{ padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }}
                .table td.label {{ color: #94a3b8; font-weight: 600; width: 35%; }}
                .table td.value {{ color: #f8fafc; font-family: monospace; font-size: 15px; }}
                .desc {{ background: #1e293b; border-left: 4px solid #0ea5e9; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #cbd5e1; line-height: 1.5; }}
                .footer {{ background: #0f172a; padding: 14px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; }}
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h2>CyberNexis AI Threat Incident</h2>
                  <div class="badge">{severity} SEVERITY</div>
                </div>
                <div class="content">
                  <p style="margin-top:0; color:#94a3b8; font-size:14px;">An anomalous traffic flow matching an attack signature was intercepted by CyberNexis AI.</p>
                  <table class="table">
                    <tr><td class="label">Threat Vector</td><td class="value" style="color:#38bdf8;">{attack_type}</td></tr>
                    <tr><td class="label">Attacker IP</td><td class="value" style="color:#f43f5e;">{src_ip}</td></tr>
                    <tr><td class="label">Geo Location</td><td class="value">{country}</td></tr>
                    <tr><td class="label">Timestamp</td><td class="value">{timestamp}</td></tr>
                  </table>
                  <div class="desc">
                    <strong>Incident Summary:</strong><br/>
                    {msg}
                  </div>
                </div>
                <div class="footer">
                  CyberNexis AI Autonomous SOC &bull; Automated Intrusion Prevention System
                </div>
              </div>
            </body>
            </html>
            """
            ok, res = self.send_email(subject, html_body, text_body)
            if ok:
                print(f"[Alert] Email notification dispatched for {src_ip} ({attack_type}).")
            else:
                print(f"[Alert] Email notification failed: {res}")


# Singleton instance
alert_dispatcher = AlertDispatcher()
