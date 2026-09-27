import os
from dotenv import load_dotenv

# Base Directories
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
# PROJECT_ROOT is the sentinel-ai root (parent of backend/)
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))

# cybersecurity-mlops lives inside sentinel-ai/
MLOPS_DIR  = os.path.join(PROJECT_ROOT, "cybersecurity-mlops")
MODEL_DIR  = os.path.join(MLOPS_DIR, "models")
REPORTS_DIR = os.path.join(MLOPS_DIR, "reports")

# Load environment variables from frontend and backend .env files
BACKEND_ENV_PATH = os.path.join(BACKEND_DIR, ".env")
if os.path.exists(BACKEND_ENV_PATH):
    load_dotenv(dotenv_path=BACKEND_ENV_PATH)

FRONTEND_ENV_PATH = os.path.join(BACKEND_DIR, "..", "frontend", ".env")
if os.path.exists(FRONTEND_ENV_PATH):
    load_dotenv(dotenv_path=FRONTEND_ENV_PATH)
else:
    load_dotenv()  # fallback to standard system env/local dotenv

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Application Settings
API_HOST = "127.0.0.1"
API_PORT = 8000
DEFAULT_INTERFACE = "eth0"

# Telegram Alert Settings
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_ALERTS_ENABLED = os.getenv("TELEGRAM_ALERTS_ENABLED", "true").lower() in ("true", "1", "yes")

# Email (SMTP) Alert Settings
EMAIL_ALERTS_ENABLED = os.getenv("EMAIL_ALERTS_ENABLED", "true").lower() in ("true", "1", "yes")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "") or SMTP_USER
ALERT_RECIPIENT_EMAIL = os.getenv("ALERT_RECIPIENT_EMAIL", "")

print(f"[Config] Backend Directory  : {BACKEND_DIR}")
print(f"[Config] Project Root       : {PROJECT_ROOT}")
print(f"[Config] MLOps Directory    : {MLOPS_DIR}")
print(f"[Config] Model Directory    : {MODEL_DIR}")
print(f"[Config] Supabase URL       : {SUPABASE_URL}")
print(f"[Config] Service Role Key   : {'Loaded' if SUPABASE_SERVICE_ROLE_KEY else 'Not loaded'}")
print(f"[Config] Telegram Alerts    : {'Enabled' if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID else 'Configured (no token set)' if TELEGRAM_ALERTS_ENABLED else 'Disabled'}")
print(f"[Config] Email Alerts       : {'Enabled' if SMTP_USER and ALERT_RECIPIENT_EMAIL else 'Configured (no recipient set)' if EMAIL_ALERTS_ENABLED else 'Disabled'}")
