<div align="center">

# 🛡️ CyberNexis AI

### AI-Powered Network Traffic Anomaly Detection & Threat Prediction System

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML-FF6600?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.ai)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> Detect, predict, and respond to cyber attacks in real time using AI — before damage occurs.

[Live Demo](#-quick-start) · [API Docs](#-api-reference) · [Attack Demo](#-demo-attack-simulator) · [Report Bug](../../issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Demo Attack Simulator](#-demo-attack-simulator)
- [API Reference](#-api-reference)
- [MLOps Pipeline](#-mlops-pipeline)
- [Alert Notifications](#-alert-notifications)
- [Dashboard Pages](#-dashboard-pages)
- [SDG Impact](#-sdg-impact)

---

## 🔍 Overview

**CyberNexis AI** is a full-stack, enterprise-grade cybersecurity platform that monitors live network traffic, classifies threats using a trained XGBoost model, predicts future attacks using LSTM, and instantly dispatches alerts via **Telegram** and **Email**.

Unlike traditional rule-based firewalls that react after a breach, CyberNexis AI detects suspicious activity **before** damage occurs.

```
Traditional Approach          CyberNexis AI Approach
─────────────────────         ──────────────────────────────
Attack Starts          →      Attack Starts
     ↓                              ↓
System Compromised     →      AI Detects Anomaly (real-time)
     ↓                              ↓
Service Down           →      Threat Predicted (LSTM)
     ↓                              ↓
Manual Investigation   →      Auto Firewall Block
                                    ↓
                               Telegram + Email Alert
                                    ↓
                               Services Remain Online ✅
```

---

## 🏗️ System Architecture

```
                         INTERNET
                             │
                             ▼
               Live Network Traffic (Scapy)
                             │
                             ▼
              ┌──────────────────────────────┐
              │    Feature Extraction         │
              │    sniffer.py                 │
              └──────────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │  XGBoost Model  │  ← Classifies Attack Type
                    │  model_inference│    (UNSW-NB15 trained)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  LSTM Predictor │  ← Forecasts Future Risk
                    │  lstm_prediction│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  SHAP Explainer │  ← Why did AI flag this?
                    └────────┬────────┘
                             │
               ┌─────────────▼──────────────┐
               │     alert_dispatcher.py     │
               │   (Rate-limited, threaded)  │
               └──────┬──────────┬───────────┘
                      │          │
               ┌──────▼──┐  ┌───▼──────┐
               │ Telegram │  │  Email   │
               │   Bot    │  │  (SMTP)  │
               └──────────┘  └──────────┘
                      │          │
               ┌──────▼──────────▼────────┐
               │  FastAPI Backend (REST +  │
               │  WebSocket)  app.py       │
               └──────────────┬────────────┘
                              │
               ┌──────────────▼────────────┐
               │  React Dashboard (Vite)   │
               │  Live charts, map, alerts │
               └───────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔴 **Live Packet Capture** | Real-time network monitoring using Scapy (falls back to simulation) |
| 🤖 **AI Attack Detection** | XGBoost model trained on UNSW-NB15 dataset — 99%+ accuracy |
| 🔮 **Threat Prediction** | LSTM sequence model forecasts upcoming attack probability |
| 🧠 **Explainable AI** | SHAP feature attributions explain every AI decision |
| 🌍 **GeoIP Mapping** | MaxMind GeoLite2 maps attacker IPs to countries on a live world map |
| 🚨 **Telegram Alerts** | Instant bot notifications on attack detection |
| 📧 **Email Alerts** | HTML-styled SOC-grade email reports per threat |
| 🔥 **Auto Firewall** | Automatically blocks attacker IPs via Windows Firewall (`netsh`) |
| 📊 **Live Dashboard** | WebSocket-powered React dashboard with real-time charts |
| 🔄 **MLOps Pipeline** | Drift monitoring, automated retraining, model registry |
| 🔐 **Auth + Profiles** | Supabase-backed JWT authentication, user settings, profiles |

### Detected Attack Types

`DoS` · `DDoS Flood` · `Reconnaissance` · `Port Scan` · `Botnet` · `Exploit` · `Backdoor` · `Shellcode` · `Generic Anomaly` · `Ping of Death` · `DNS Tunnelling`

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI 0.110 + Uvicorn |
| ML Detection | XGBoost + scikit-learn |
| Threat Prediction | LSTM (custom) |
| Packet Capture | Scapy 2.5 |
| Explainability | SHAP feature attribution |
| Database | Supabase (PostgreSQL) |
| Real-time | WebSockets |
| Alerting | Telegram Bot API + SMTP (Gmail) |
| GeoIP | MaxMind GeoLite2 |
| Config | python-dotenv |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Router | TanStack Router |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Maps | React Leaflet |
| Forms | React Hook Form + Zod |
| Auth | Supabase Auth |

### MLOps
| Layer | Technology |
|---|---|
| Training | XGBoost + scikit-learn |
| Drift Detection | Statistical drift monitor |
| Model Registry | JSON-based versioned registry |
| Retraining | Automated pipeline trigger |
| Data | UNSW-NB15 (Parquet format) |

---

## 📁 Project Structure

```
cyberNexis-ai/
│
├── backend/                        # FastAPI Python backend
│   ├── app.py                      # Main API server (REST + WebSocket)
│   ├── sniffer.py                  # Scapy packet capture + flow analysis
│   ├── model_inference.py          # XGBoost prediction + SHAP
│   ├── lstm_prediction.py          # LSTM threat forecasting
│   ├── alert_dispatcher.py         # Telegram + Email alert engine
│   ├── geoip_resolver.py           # MaxMind GeoIP lookup
│   ├── supabase_client.py          # Supabase DB integration
│   ├── config.py                   # Environment + path config
│   ├── alert_config.json           # Persisted alert settings
│   ├── demo_attack.py              # 🎮 Demo attack simulator
│   ├── test_alerts.py              # Alert pipeline test script
│   ├── test_backend.py             # Backend validation suite
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment variable template
│   ├── start_backend.bat           # Windows backend launcher
│   └── cyber/                      # Python virtual environment
│
├── frontend/                       # React + Vite dashboard
│   ├── src/
│   │   ├── routes/                 # Page components (TanStack Router)
│   │   │   ├── index.tsx           # Landing page
│   │   │   ├── login.tsx           # Authentication
│   │   │   ├── register.tsx        # Registration
│   │   │   ├── dashboard.tsx       # Dashboard shell + sidebar
│   │   │   ├── dashboard.index.tsx # Overview cards + charts
│   │   │   ├── dashboard.monitoring.tsx  # Live traffic monitor
│   │   │   ├── dashboard.detection.tsx   # Threat detection table
│   │   │   ├── dashboard.prediction.tsx  # LSTM risk prediction
│   │   │   ├── dashboard.alerts.tsx      # Alert center
│   │   │   ├── dashboard.analytics.tsx   # Analytics charts
│   │   │   ├── dashboard.geo.tsx         # GeoIP attack map
│   │   │   ├── dashboard.capture.tsx     # Raw packet capture
│   │   │   ├── dashboard.features.tsx    # Feature extraction view
│   │   │   ├── dashboard.mlops.tsx       # MLOps control panel
│   │   │   └── dashboard.settings.tsx    # Alert + profile settings
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   └── styles.css              # Global styles
│   └── package.json
│
├── cybersecurity-mlops/            # MLOps training pipeline
│   ├── src/
│   │   ├── train.py                # Model training script
│   │   ├── evaluate.py             # Evaluation + metrics
│   │   ├── drift_monitor.py        # Data drift detection
│   │   ├── retraining_decision.py  # Auto-retraining logic
│   │   ├── retrain_pipeline.py     # Full retrain pipeline
│   │   └── data_generator.py      # Synthetic data generation
│   ├── models/                     # Trained model artifacts
│   │   ├── xgboost_model.pkl
│   │   ├── encoder.pkl
│   │   ├── feature_columns.pkl
│   │   ├── threshold.txt
│   │   └── registry/               # Versioned model registry
│   │       ├── model_v1/
│   │       └── model_v2/
│   ├── data/                       # Training data (Parquet)
│   │   ├── train.parquet
│   │   └── test.parquet
│   └── reports/                    # MLOps reports (JSON)
│
├── start_all.bat                   # 🚀 One-click full stack launcher
├── start_frontend.bat              # Frontend-only launcher
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ / npm
- Windows (for Scapy + netsh firewall features)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cyberNexis-ai.git
cd cyberNexis-ai
```

### 2. One-Click Launch (Windows)

Double-click or run:
```powershell
.\start_all.bat
```

This starts both backend and frontend automatically.

---

### Manual Setup

#### Backend

```powershell
cd backend

# Activate virtual environment
.\cyber\Scripts\Activate.ps1

# If blocked by execution policy, run once:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Start the API server
python app.py
```

Backend runs at → **http://127.0.0.1:8000**  
API Docs (Swagger) → **http://127.0.0.1:8000/docs**

#### Frontend

Open a **separate terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:5173**

---

## ⚙️ Configuration

Copy the example env file and fill in your credentials:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `.env`:

```env
# ── Telegram Bot ──────────────────────────────
# 1. Message @BotFather on Telegram → create bot → copy token
# 2. Message @userinfobot to get your Chat ID
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_ALERTS_ENABLED=true

# ── Email (Gmail SMTP) ────────────────────────
# Use a Gmail App Password (not your regular password)
# Google Account → Security → 2-Step Verification → App Passwords
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
ALERT_RECIPIENT_EMAIL=alerts@yourcompany.com
EMAIL_ALERTS_ENABLED=true

# ── Supabase ──────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **Gmail App Password**: Go to [myaccount.google.com](https://myaccount.google.com) → Security → 2-Step Verification → App Passwords → Generate for "Mail".

---

## 🎮 Demo Attack Simulator

Test the full detection + notification pipeline without real network traffic:

```powershell
cd backend
.\cyber\Scripts\Activate.ps1
python demo_attack.py
```

### Commands

```powershell
# Interactive menu — pick attack type
python demo_attack.py

# Fire a specific attack type
python demo_attack.py --type dos         # DoS / DDoS Flood (CRITICAL)
python demo_attack.py --type recon       # Reconnaissance / Port Scan (WARNING)
python demo_attack.py --type botnet      # Botnet C2 Communication (CRITICAL)
python demo_attack.py --type exploit     # CVE Exploit / Buffer Overflow (CRITICAL)
python demo_attack.py --type backdoor    # Reverse Shell / Backdoor (CRITICAL)
python demo_attack.py --type shellcode   # Shellcode / DNS Tunnelling (CRITICAL)
python demo_attack.py --type generic     # Generic AI Anomaly (WARNING)

# Fire ALL attacks back-to-back (best for live demo)
python demo_attack.py --all

# List all available attack types
python demo_attack.py --list
```

Each attack immediately sends a **Telegram message** and **HTML Email** to your configured recipients.

### Sample Telegram Alert

```
🚨 CYBERNEXIS AI THREAT ALERT

⚠️ Severity: CRITICAL
🎯 Attack Type: DoS Flood
🌐 Attacker IP: 185.220.101.45
📍 Location: Russia
🕒 Timestamp: 2026-09-26 10:45:00 UTC

📝 Details: High-volume SYN flood detected.
50,000 packets/sec saturating port 80.
Automatic firewall rule applied.

🛡️ CyberNexis AI Defense Active
```

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/status` | Sniffer + system status |
| `POST` | `/api/status` | Start / pause / stop sniffer |
| `GET` | `/api/packets` | Live packet stream |
| `GET` | `/api/features` | Live extracted features |
| `GET` | `/api/monitoring` | Network stats + flow stream |
| `GET` | `/api/detection` | AI detection results + SHAP |
| `GET` | `/api/prediction` | LSTM threat prediction |
| `GET` | `/api/analytics` | Aggregated analytics |
| `GET` | `/api/geo` | GeoIP attack events |

### Firewall

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/firewall` | Firewall status + blocked IPs |
| `POST` | `/api/firewall/block` | Block an IP address |
| `POST` | `/api/firewall/unblock` | Unblock an IP address |

### Alerts (Auth Required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts` | Fetch all alerts |
| `POST` | `/api/alerts` | Create alert |
| `PATCH` | `/api/alerts/{id}/acknowledge` | Acknowledge alert |
| `POST` | `/api/alerts/acknowledge-all` | Acknowledge all alerts |
| `DELETE` | `/api/alerts/{id}` | Delete alert |
| `GET` | `/api/alerts/stats` | Alert counts by severity |

### Notification Testing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/alerts/test-telegram` | Send Telegram test message |
| `POST` | `/api/alerts/test-email` | Send Email test message |

### MLOps

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/mlops/run-drift` | Run drift detection |
| `POST` | `/api/mlops/retrain` | Trigger model retraining |
| `POST` | `/api/mlops/reload` | Reload model artifacts |
| `GET` | `/api/mlops/summary` | MLOps reports summary |

### WebSocket

```
WS  /ws    Real-time stream — packets, detections, alerts
```

---

## 🔄 MLOps Pipeline

The `cybersecurity-mlops/` module handles the full model lifecycle:

```powershell
cd cybersecurity-mlops

# Train the XGBoost model
python src/train.py

# Evaluate model performance
python src/evaluate.py

# Check for data drift
python src/drift_monitor.py

# Trigger retraining if drift detected
python src/retrain_pipeline.py
```

### Model Registry

Trained models are stored in `models/registry/` with versioning:

```
models/registry/
├── model_v1/
│   ├── xgboost_model.pkl
│   └── metadata.json
└── model_v2/
    ├── xgboost_model.pkl
    └── metadata.json
```

Switch models live via the `/api/mlops/reload` endpoint without restarting the server.

---

## 🔔 Alert Notifications

### Telegram Setup

1. Open Telegram → search **@BotFather**
2. Send `/newbot` → follow prompts → copy the **bot token**
3. Start a chat with your new bot (press **Start**)
4. Message **@userinfobot** to get your **Chat ID**
5. Add both to `.env` or the Settings dashboard

### Gmail SMTP Setup

1. Enable **2-Step Verification** on your Google Account
2. Go to **Security → App Passwords**
3. Generate a password for "Mail" → copy the 16-character password
4. Use this as `SMTP_PASSWORD` (not your regular Gmail password)

### Test Alerts (CLI)

```powershell
python test_alerts.py
```

Output:
```
============================================================
  CYBERNEXIS AI - TELEGRAM & EMAIL ALERT TEST
============================================================
1. Testing Telegram ...  [PASS] Telegram message sent successfully
2. Testing Email    ...  [PASS] Email sent successfully
3. Testing Pipeline ...  [PASS] Alert dispatch thread initiated
```

---

## 📊 Dashboard Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Product overview + feature showcase |
| Login | `/login` | Email/password authentication |
| Register | `/register` | Create account |
| Onboarding | `/onboarding` | First-time setup wizard |
| Overview | `/dashboard` | Live cards, charts, recent alerts |
| Monitoring | `/dashboard/monitoring` | Live network traffic stream |
| Detection | `/dashboard/detection` | AI threat classification table |
| Prediction | `/dashboard/prediction` | LSTM future risk forecast |
| Geo Map | `/dashboard/geo` | World map of attacker origins |
| Alerts | `/dashboard/alerts` | Alert center with acknowledge/delete |
| Analytics | `/dashboard/analytics` | Trend charts + statistics |
| Capture | `/dashboard/capture` | Raw packet capture viewer |
| Features | `/dashboard/features` | Extracted ML feature viewer |
| MLOps | `/dashboard/mlops` | Model management + drift reports |
| Settings | `/dashboard/settings` | Telegram, Email, Firewall config |

---

## 🌍 SDG Impact

**SDG 9 — Industry, Innovation and Infrastructure**

CyberNexis AI contributes to building secure, resilient digital infrastructure by providing AI-driven threat detection for organizations of all sizes.

**Real-world benefits:**
- ✅ Prevents website downtime from DDoS attacks
- ✅ Detects unauthorized access attempts before breach
- ✅ Reduces manual monitoring burden on security teams
- ✅ Provides affordable enterprise-grade security for small organizations
- ✅ Enables proactive defense instead of reactive recovery

> *"CyberNexis AI strengthens cybersecurity by detecting and predicting network threats in real time, enabling organizations to prevent cyber attacks, protect critical digital infrastructure, and ensure uninterrupted online services."*

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

Author:Priyadharshini K
**CyberNexis AI** — Detect. Predict. Protect.

</div>
