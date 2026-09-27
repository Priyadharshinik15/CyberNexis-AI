# Sentinel AI

AI-Powered Network Traffic Anomaly Detection and Threat Prediction System – Working Flow

Step 1: Live Network Traffic Capture

The system continuously monitors incoming and outgoing network packets from a computer or network.

Tool Used: Scapy

Input:

TCP packets

UDP packets

ICMP packets

HTTP/HTTPS traffic

DNS traffic

Internet
│
▼
Live Network Traffic
│
▼
Scapy Packet Sniffer

Step 2: Packet Preprocessing

Raw packets cannot be directly used by AI models.

The preprocessing module extracts useful features such as:

Source IP

Destination IP

Source Port

Destination Port

Protocol

Packet Length

Connection Duration

Bytes Sent

Bytes Received

TCP Flags

Example

Raw Packet

↓

Src IP : 192.168.1.10
Dst IP : 8.8.8.8
Protocol : TCP
Packet Size : 520 Bytes

↓

Feature Vector

[520, TCP, 443, 80, Duration, Bytes, Flags...]

Step 3: Feature Engineering

The extracted packet features are converted into the same format used in the UNSW-NB15 dataset.

Operations performed:

Remove unnecessary fields

Handle missing values

Encode categorical variables

Normalize numerical features

Arrange features according to model input

Packet Features

↓

Cleaning

↓

Encoding

↓

Normalization

↓

ML Ready Features

Step 4: Attack Detection using XGBoost

The processed features are given to the trained XGBoost model.

The model classifies traffic into

Normal

Attack

If attack,

it also predicts the attack category.

Example

Input Features

↓

XGBoost

↓

Prediction

Attack

↓

Class

Reconnaissance

Confidence = 98%

Step 5: Threat Prediction using LSTM

The system stores previous traffic data.

Instead of looking at a single packet, the LSTM observes the sequence of packets.

It predicts whether the traffic trend indicates an upcoming cyber attack.

Example

Traffic Timeline

Packet 1

Packet 2

Packet 3

Packet 4

Packet 5

↓

LSTM

↓

Future Risk

High Probability of DoS Attack

This enables proactive defense rather than reacting after an attack.

Step 6: Explainable AI (SHAP)

Security analysts need to know why the model predicted an attack.

SHAP identifies the most influential features.

Example

Prediction

↓

Reconnaissance

↓

Important Features

Protocol = TCP

Connection Count = High

Packet Size = Small

Duration = Low

Confidence = 97%

This improves trust and helps analysts validate AI decisions.

Step 7: GeoIP Location Detection

If an attack is detected, the source IP address is passed to the MaxMind GeoLite2 database.

The system identifies:

Country

State

City

Latitude

Longitude

Example

Attack IP

185.xxx.xxx.xxx

↓

GeoLite2

↓

Russia

Moscow

The dashboard displays the attack source on a world map.

Step 8: Automatic Response

Once malicious traffic is confirmed:

Firewall

Block attacker IP

Attack IP

↓

Firewall Rule

↓

IP Blocked

Telegram Alert

A Telegram bot instantly notifies the administrator.

Example

🚨 ALERT

Attack Detected

Attack Type : DoS

Source : Russia

Confidence : 99%

IP Blocked Successfully

Email Alert

The system also sends an email containing

Attack type

Time

Source IP

Country

Confidence score

Recommended action

Step 9: Dashboard Update

The dashboard updates automatically.

Displayed information includes:

Live traffic count

Number of attacks

Attack categories

Top attacker IPs

Risk score

Prediction confidence

World map of attacks

Blocked IP list

Alert history

Dashboard

Live Packets

↓

Attack Count

↓

Attack Types

↓

Geo Map

↓

Alerts

↓

Blocked IPs

Step 10: Continuous Monitoring

The process repeats continuously.

Capture Traffic

↓

Preprocess

↓

Feature Extraction

↓

XGBoost Detection

↓

LSTM Prediction

↓

Explainable AI

↓

GeoIP

↓

Alert

↓

Auto Block

↓

Dashboard

↓

Capture Next Packet...

The system runs 24×7, ensuring real-time network protection.

Complete Workflow Diagram

                      INTERNET
                          │
                          ▼
              Live Network Traffic
                          │
                          ▼
               Scapy Packet Capture
                          │
                          ▼
             Feature Extraction Module
                          │
                          ▼
             Data Preprocessing & Encoding
                          │
                          ▼
                XGBoost Attack Detection
                  ┌─────────┴─────────┐
                  │                   │
              Normal             Attack Detected
                  │                   │
                  │                   ▼
                  │          Attack Classification
                  │                   │
                  │                   ▼
                  │         LSTM Threat Prediction
                  │                   │
                  │                   ▼
                  │          SHAP Explainable AI
                  │                   │
                  │                   ▼
                  │        GeoIP (MaxMind GeoLite2)
                  │                   │
                  │                   ▼
                  │       Automatic Response Engine
                  │      ┌───────┼─────────┐
                  │      │       │         │
                  │      ▼       ▼         ▼
                  │   Block IP  Email  Telegram
                  │
                  └──────────────► Live Dashboard
                                      │
                                      ▼
                            Continuous MonitoringComplete Website Structure

AI Cyber Shield
│
├── Landing Website
│
├── Authentication
│
├── User Dashboard
│
├── Threat Monitoring
│
├── AI Prediction
│
├── Incident Management
│
├── Reports
│
├── Analytics
│
├── Team Management
│
├── Settings
│
└── Profile

This gives you 15–20 professional pages, making the project look like a commercial cybersecurity product.

1. Landing Page

Hero Section

---

Logo Login Register

Protect Your Network
with Artificial Intelligence

Detect • Predict • Respond

[ Start Monitoring ]
[ Live Demo ]

## Animated Cyber Globe

Sections

Hero

Trusted By Companies

Features

Architecture Animation

AI Workflow

Product Screenshots

Testimonials

Pricing (Free / Enterprise)

FAQ

Footer

Animations

Moving cyber particles

Animated globe

Floating shields

Neon glowing buttons

Background grid

2. About Us

Contains

Company Story

Vision

Mission

Team

Technologies

SDG Contribution

Contact

3. Features Page

Cards like

AI Detection

Threat Prediction

Real-time Monitoring

Geo Mapping

Explainable AI

Auto Firewall

Email Alerts

Telegram Alerts

Docker Deployment

Each opens a detailed page.

4. Authentication

Login

Email

Password

Remember Me

Forgot Password

Login

Login with Google

Register

Full Name

Email

Organization

Role

Password

Confirm Password

Create Account

Forgot Password

OTP

Email Verification

Reset Password

5. Dashboard

After login

---

Sidebar

Dashboard

Monitoring

Prediction

Analytics

Reports

Settings

---

Top Navbar

Search

Notifications

Dark Mode

Profile

---

Cards

Total Packets

Threats

Blocked IP

AI Accuracy

---

Charts

Map

Recent Alerts

6. Profile Page

Top-right avatar.

Dropdown

My Profile

Edit Profile

Notifications

Security

API Keys

Logout

Inside Profile

Photo

Name

Organization

Email

Phone

Role

Experience

Change Password

2FA

Activity

Download Certificates

Delete Account

7. Live Monitoring

Packets Table

Search

Filter

Protocol

IP

Attack

Country

Status

Export CSV

8. Threat Detection

Cards

DoS

Recon

Botnet

Malware

Shellcode

Backdoor

Generic

Analysis

Click card

↓

Threat Details Page

9. AI Prediction

Risk Score

Prediction Timeline

Future Threats

Confidence

Recommendation

Charts

Probability Graph

LSTM Output

10. Incident Management

Professional SOC page.

Open Incidents

Resolved

Pending

Critical

Assigned Engineer

Priority

Comments

Close Incident

11. Geo Attack Map

Fullscreen page

World Map

Pins

Attack Animation

Heatmap

Timeline

Country Ranking

12. Explainable AI

SHAP Values

Feature Importance

Prediction Confidence

Model Decision

Decision Tree

Explanation

13. Reports

Generate

Daily Report

Weekly Report

Monthly Report

Attack Summary

Export PDF

Export Excel

Email Report

14. Analytics

Professional graphs

Packets

Bandwidth

Threat Trends

CPU

Memory

Top Countries

Detection Accuracy

False Positives

Response Time

15. Alert Center

Unread Alerts

Critical

Warning

Information

Search

Mark as Read

Delete

Archive

16. Team Management

Admin only

Users

Roles

Permissions

Invite Member

Remove Member

Audit Logs

17. Settings

Tabs

General

Email

Telegram

Firewall

Model

API

Theme

Language

18. Documentation

Contains

API Docs

Installation

Docker Guide

User Manual

FAQ

Developer Guide

19. Contact Page

Form

Map

Email

Phone

Support

LinkedIn

GitHub

20. Admin Panel

Separate portal

Users

Models

Datasets

Logs

Alerts

Traffic

Reports

Settings

Navbar

Logo

Dashboard

Threats

Analytics

Reports

Documentation

Search

🔔 Notification

🌙 Theme

👤 Profile

Profile Dropdown

👤 My Profile

⚙ Account Settings

🔐 Security

📜 Activity

🚪 Logout

Sidebar

🏠 Dashboard

📡 Live Monitoring

🧠 AI Prediction

🚨 Threat Detection

🌍 Attack Map

📈 Analytics

📄 Reports

👥 Team

⚙ Settings

📚 Documentation

Footer

Company

Privacy

Terms

Support

Blog

GitHub

LinkedIn

Twitter

Version 1.0.0

UI Theme

Think of a blend between:

Microsoft Defender

CrowdStrike Falcon

Darktrace

Cisco SecureX

Splunk

GitHub Dark

Color palette:

Background: #0B1120

Cards: #131B2E

Accent: #00E5FF

Success: #22C55E

Warning: #F59E0B

Danger: #EF4444

Text: #F8FAFC

Recommended Tech Stack

LayerTechnologyFrontendNext.js 15 + React 19 + TypeScriptStylingTailwind CSS + shadcn/uiChartsRechartsMapsMapLibre GL JSTablesTanStack TableAnimationsFramer MotionIconsLucide ReactAuthenticationClerk or Auth.js (NextAuth)State ManagementZustandFormsReact Hook Form + ZodBackendFastAPIDatabasePostgreSQLReal-timeWebSocketsDeploymentDocker + Nginx

Suggested Folder Structure

src/
├── app/
│ ├── (marketing)/
│ │ ├── page.tsx # Landing
│ │ ├── about/
│ │ ├── features/
│ │ ├── pricing/
│ │ ├── contact/
│ │ └── docs/
│ ├── (auth)/
│ │ ├── login/
│ │ ├── register/
│ │ ├── forgot-password/
│ │ └── verify-email/
│ ├── dashboard/
│ │ ├── overview/
│ │ ├── monitoring/
│ │ ├── threats/
│ │ ├── ai-prediction/
│ │ ├── incidents/
│ │ ├── attack-map/
│ │ ├── analytics/
│ │ ├── reports/
│ │ ├── alerts/
│ │ ├── team/
│ │ ├── settings/
│ │ └── profile/
├── components/
├── hooks/
├── lib/
├── services/
└── types/

This structure gives you a polished, enterprise-style application with 20+ pages, role-based access, and a user experience that closely resembles a real commercial cybersecurity platform rather than a single-page academic dashboard.

This is a copy of a shared ChatGPT conversation Report conversation Fri, Jun 19 at 6:07 PM For AI-Powered Network Traffic Anomaly Detection and Threat Prediction System, the main impact is: 🛡️ Prevent Cyber Attacks Before Damage Occurs Instead of detecting attacks after a system is hacked, your AI detects suspicious activity early and alerts administrators. Real-World Impact ✅ Protects websites, college portals, and company networks ✅ Reduces downtime caused by DDoS attacks ✅ Prevents data breaches and unauthorized access ✅ Reduces manual monitoring effort for security teams ✅ Improves cybersecurity for organizations with limited security staff Example Without your system: Attack Starts ↓ Website Crashes ↓ Users Cannot Access Services With your system: Attack Starts ↓ AI Detects Anomaly ↓ Alert Generated ↓ Admin Blocks Attack ↓ Website Remains Available SDG Alignment SDG 9 – Industry, Innovation and Infrastructure Your project helps create secure and resilient digital infrastructure, which is essential for businesses, educational institutions, and government services. One-Line Impact Statement > "The system enhances cybersecurity by detecting network threats in real time, helping organizations prevent cyber attacks, protect digital infrastructure, and ensure uninterrupted online services." This is a strong impact statement to use in a hackathon presentation, project report, or interview. Yes, this is a strong impact statement. For a hackathon, project report, or viva/interview, you can make it even more professional: Project Impact AI-Powered Network Traffic Anomaly Detection and Threat Prediction System enhances cybersecurity by continuously monitoring network traffic and identifying abnormal patterns that may indicate cyber threats. Unlike traditional security systems that react after an attack occurs, this solution uses Artificial Intelligence and Machine Learning to detect suspicious activities early and provide real-time alerts to administrators. Real-World Benefits Protects organizational networks, websites, and online services from cyber attacks. Detects potential threats such as DDoS attacks, unauthorized access attempts, and malicious traffic. Reduces service downtime and improves system availability. Minimizes the risk of data breaches and financial losses. Decreases the workload of cybersecurity teams through automated monitoring. Provides affordable security support for small and medium-sized organizations with limited security resources. Workflow Traditional Approach Attack Begins ↓ System Compromised ↓ Service Disruption ↓ Investigation and Recovery Proposed AI-Based Approach Attack Begins ↓ AI Detects Anomaly ↓ Threat Prediction ↓ Real-Time Alert ↓ Administrator Action ↓ Attack Mitigated ↓ Services Remain Available Sustainable Development Goal (SDG) Alignment SDG 9 – Industry, Innovation and Infrastructure This project contributes to building secure, reliable, and resilient digital infrastructure by leveraging AI-driven cybersecurity solutions. It supports the safe operation of educational institutions, businesses, government services, and critical online platforms. One-Line Impact Statement "The proposed AI-powered system strengthens cybersecurity by detecting and predicting network threats in real time, enabling organizations to prevent cyber attacks, protect critical digital infrastructure, and ensure uninterrupted online services." Short Hackathon Pitch (30 Seconds) "Our AI-powered Network Traffic Anomaly Detection and Threat Prediction System analyzes network traffic in real time to identify suspicious activities before they become serious cyber attacks. By providing early warnings and threat predictions, the system helps organizations prevent downtime, protect sensitive data, and maintain secure digital services with minimal manual intervention." This version is suitable for PPT presentations, project reports, abstracts, hackathons, and final-year project viva examinations.//f4ontent structure layout give me style

If you want your project to look like a startup product instead of a college project, the UI should tell a story from the first page to the dashboard. Think of websites like CrowdStrike, Darktrace, Cloudflare, Palo Alto Networks, Microsoft Defender, or Vercel.

🌐 Complete Website Flow

Visitor
│
▼
Landing Page
│
▼
About Product
│
▼
Features
│
▼
How It Works
│
▼
Technology
│
▼
Pricing (Demo)
│
▼
Contact
│
▼
Login/Register
│
▼
Dashboard

🎨 STYLE GUIDE

Theme

Modern AI + Cyber Security

Dark Background

Glassmorphism

Neon Blue + Purple Glow

Animated Grid

Floating Particles

Cyber Lines

Smooth Animations

Color Palette

Background #050816
Card #101827
Primary #00E5FF
Secondary #7C3AED
Success #22C55E
Warning #F59E0B
Danger #EF4444
White #F8FAFC
Gray #94A3B8

1️⃣ Landing Page

Hero

---

LOGO Login Register

AI Cyber Shield

Protect Your Network
Before Attackers Strike

AI Powered Threat Detection &
Future Attack Prediction

[ Get Started ]

[ Watch Demo ]

Animated 3D Globe

Cyber Background

---

Hero Animation

✔ Floating Globe

✔ Network Lines

✔ Moving Packets

✔ Binary Rain

✔ Neon Glow

Trusted Companies

Microsoft

Cisco

Google

AWS

IBM

Oracle

(Only UI logos for design.)

Live Statistics

99.6%

Detection Accuracy

---

120K+

Packets Analyzed

---

15K+

Threats Prevented

---

24/7

Monitoring

Animated Counter

Feature Cards

AI Detection

Threat Prediction

Geo Mapping

Firewall

Live Dashboard

Email Alerts

Telegram Alerts

Docker Deployment

Hover Effect

Architecture Preview

Traffic

↓

AI Engine

↓

Threat Detection

↓

Prediction

↓

Alert

↓

Dashboard

Glass Card

Screenshots Carousel

Large screenshots

Dashboard

Map

Alerts

Analytics

Testimonials

★★★★★

"This platform reduced our security response time."

Security Engineer

---

★★★★★

"Easy to use and highly accurate."

Network Administrator

FAQ

Accordion

What is AI Detection?

What attacks are supported?

Can it run locally?

Is Docker supported?

Footer

About

Features

Blog

Privacy

Terms

GitHub

LinkedIn

Contact

2️⃣ Login

Background Animation

Centered Glass Card

Logo

Welcome Back

Email

Password

Forgot Password

Remember Me

LOGIN

Continue with Google

Split Screen

Left

Cyber Illustration

Right

Login Form

3️⃣ Register

Create Account

Full Name

Company

Email

Phone

Password

Confirm Password

Organization

Role

Register

4️⃣ Dashboard

---

Sidebar

Dashboard

Threats

Prediction

Map

Reports

Analytics

Settings

---

Top Navbar

Search

Notifications

Theme

Profile

---

Cards

Traffic

Threats

Accuracy

Blocked IPs

---

Charts

---

Map

---

Alerts

---

5️⃣ Top Navbar

LOGO

Search

Notifications

Theme

Language

Profile Image

Profile Dropdown

Profile

Settings

API Keys

Activity

Support

Logout

6️⃣ Sidebar

Dashboard

Live Monitoring

Threat Detection

Threat Prediction

Geo Attack Map

Incident Center

Analytics

Reports

Notifications

Settings

Help

Expandable

7️⃣ Dashboard Home

Cards

Total Packets

Live Connections

Current Risk

Threats Today

Mini Graphs

Network Activity

Large Live Graph

Packets/sec

Threat Distribution

Donut Chart

Normal

Attack

Recon

DoS

Generic

Backdoor

AI Prediction

Risk Level

HIGH

Probability

95%

Predicted Attack

DDoS

Recent Alerts

Timeline

09:25

Recon Attack

Blocked

---

09:27

DoS

Alert Sent

---

09:29

Normal

8️⃣ Threat Details

Table

IP

Country

Attack

Severity

Confidence

Status

Click

↓

Threat Detail Page

9️⃣ Threat Detail

Attack Name

Timeline

Description

Packets

Affected Device

AI Confidence

Recommendations

Block Button

🔟 Geo Map

Fullscreen

Interactive World

Attack Heatmap

Pins

Attack Timeline

11️⃣ Analytics

Beautiful charts

Traffic Trend

Attack Trend

Country Trend

Bandwidth

CPU

RAM

Latency

Model Accuracy

12️⃣ Reports

Daily

Weekly

Monthly

Custom

Download PDF

Download Excel

13️⃣ Incident Center

Like Jira

Open

Resolved

Critical

Assigned

Comments

History

14️⃣ AI Explainability

Prediction

↓

SHAP Graph

↓

Feature Importance

↓

Reason

↓

Confidence

15️⃣ Notifications

Critical

Warnings

Success

Unread

Archived

16️⃣ Settings

Tabs

General

Appearance

Firewall

Alerts

Email

Telegram

API

Models

17️⃣ Profile

Professional Profile

Profile Picture

Name

Role

Organization

Experience

Email

Phone

Password

API Keys

Sessions

Activity

2FA

Delete Account

18️⃣ Help Center

Documentation

FAQ

Tutorials

API Docs

Contact Support

19️⃣ Admin Panel

Only Admin

Users

Roles

Permissions

Logs

Models

Datasets

Audit

System Health

20️⃣ UI Effects

✨ Glassmorphism cards

🌌 Animated star/grid background

🌍 Rotating 3D cyber globe (Three.js)

💡 Neon hover effects

📊 Animated counters and charts

🌊 Smooth page transitions (Framer Motion)

📱 Fully responsive design

🌙 Dark/Light mode

🔔 Toast notifications

🎛️ Slide-in sidebars

📈 Live updating widgets via WebSockets

🗂️ Final Site Map (Enterprise Scale)

AI Cyber Shield
│
├── Public Website
│ ├── Home
│ ├── About
│ ├── Features
│ ├── Architecture
│ ├── Technology
│ ├── Pricing
│ ├── Blog
│ ├── FAQ
│ ├── Contact
│ └── Documentation
│
├── Authentication
│ ├── Login
│ ├── Register
│ ├── Forgot Password
│ ├── Verify Email
│ └── Reset Password
│
├── User Portal
│ ├── Dashboard
│ ├── Live Monitoring
│ ├── Threat Detection
│ ├── Threat Details
│ ├── AI Prediction
│ ├── Geo Attack Map
│ ├── Incident Center
│ ├── Analytics
│ ├── Reports
│ ├── Notifications
│ ├── Team Management
│ ├── Profile
│ ├── Settings
│ └── Help Center
│
└── Admin Portal
├── User Management
├── Role Management
├── Audit Logs
├── Model Management
├── Dataset Management
├── System Monitoring
└── Security Policies

This architecture gives your project the look and feel of a real enterprise cybersecurity SaaS platform, making it much more impressive for a hackathon, final-year project, or portfolio than a simple dashboard.

cyber security theme tat type of images background suitable everuthong

For an AI-Powered Network Traffic Anomaly Detection and Threat Prediction System, don't use random hacker wallpapers (hoodies, skulls, green Matrix code). Those look outdated and unprofessional. Instead, aim for a modern enterprise cybersecurity aesthetic like CrowdStrike, Microsoft Defender, Cloudflare, Palo Alto Networks, or IBM Security.

🎨 Overall Design Style

Theme: AI + Cybersecurity + Enterprise SaaS

Mood:

Premium

Futuristic

Minimal

Professional

High-tech

Visual Style:

Dark theme

Glassmorphism

Neon accents

Animated particles

Abstract network graphics

🏠 Landing Page Hero

7

Use:

Animated 3D globe

Connected network lines

Floating particles

Glowing shield

Digital wave animation

Avoid:

Anonymous hacker

Skull graphics

Matrix green code

Hooded person

🌌 Background

7

This works for:

Landing page

Login

Register

About

Features

🧠 AI Section

6

Perfect for:

AI Prediction

Explainable AI

Model Overview

🛡 Threat Detection

7

🌍 Geo Attack Map

6

📊 Dashboard Background

Use a plain dark background with subtle effects instead of a large image.

Recommended:

Gradient (#050816 → #0F172A)

Very faint grid

Tiny animated particles

Thin glowing lines

Glass cards

Do not place a busy image behind charts and tables.

🔐 Login & Register

7

Layout:

Left: Illustration

Right: Glass login form

📈 Analytics

7

🛰 Live Monitoring

6

⚠ Threat Detection

Use subtle icons rather than photos.

Examples:

Shield

Bug

Warning triangle

Firewall

Lock

Radar

AI chip

🎨 Color Palette

ElementColorBackground#050816Card#111827Secondary Card#1E293BPrimary#00E5FFPurple Accent#7C3AEDSuccess#22C55EWarning#F59E0BDanger#EF4444Text#F8FAFCSecondary Text#94A3B8

✨ UI Effects

Glassmorphism cards (backdrop-blur)

Soft blue glow around cards

Hover lift animations

Animated gradient buttons

Floating particles

Rotating 3D globe (Three.js)

Animated network lines

Smooth page transitions (Framer Motion)

Live counters

Neon borders

Interactive world map

🎯 Best Inspiration Websites

If you're looking for design inspiration, these companies have polished cybersecurity and infrastructure websites:

CrowdStrike

Darktrace

Microsoft Security

Palo Alto Networks

Cloudflare

IBM Security

Cisco Secure

SentinelOne

Vercel (for clean SaaS layout)

Linear (for minimal UI)

🖼️ Design Recommendation

Instead of using different random backgrounds on every page, create a consistent visual identity:

Landing Page: Full-screen animated cyber globe with glowing network connections.

Login/Register: Split layout with a futuristic AI security illustration.

Dashboard: Dark gradient background with glass cards and live charts (no large background image).

Threat & Analytics Pages: Subtle technology grid or particle background.

Geo Map: Full-screen interactive world map with glowing attack markers.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eecfaaf1-b00a-4e17-aa2e-68f11b77645a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
