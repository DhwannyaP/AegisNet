# AegisNet AI — Enterprise Intrusion Detection Dashboard

> AI-powered real-time network intrusion detection with ML anomaly scoring, live threat intelligence, attack replay, and automated firewall mitigation.

[![Build](https://img.shields.io/badge/build-passing-22c55e)](.) [![Stack](https://img.shields.io/badge/stack-React%20%2B%20TypeScript%20%2B%20Vite-3b82f6)](.) [![ML](https://img.shields.io/badge/ML-Isolation%20Forest-8b5cf6)](.)

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Detection** | Isolation Forest ML model scores every packet in real-time |
| Live Dashboard | Animated stream, network graph, analysis charts, forensics panel |
| 🔍 **XAI Forensics** | Explainable AI — per-packet feature importance breakdown |
| 🌍 **Threat Intelligence** | MITRE ATT&CK mapping, CVE references, geolocation per alert |
| Attack Replay | Step-by-step simulation of 7 attack types |
| 🔥 **Firewall Mitigation** | One-click block/unblock via Windows Firewall or iptables |
| 🌐 **Chrome Extension** | Capture real browser traffic — no Wireshark, no npm needed |
| 🔐 **Auth + T&C Gate** | Supabase auth, Terms & Conditions agreement, demo mode |

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/aegisnet-ai.git
cd aegisnet-ai
npm install
npm run dev
```
Open http://localhost:5173 — sign in with any email/password (Demo Mode).

---

## Live Capture — No npm Required

**Chrome Extension** (recommended for public/universal use):
1. Open Chrome → `chrome://extensions` → Enable Developer Mode  
2. **Load unpacked** → select the `extension/` folder
3. Click AegisNet toolbar icon → read & agree to T&C → monitoring starts automatically

**Local Agent** (full system-level TCP/UDP):
```powershell
cd agent && npm install && node agent.mjs
```
Then toggle **Live Mode** in the dashboard sidebar.

---

## Authentication

**Demo Mode** *(default, no config needed)*: any email/password logs in.

**Real Supabase Auth**: copy `.env.example` → `.env`, fill in your Supabase project URL and anon key.

---

## Project Structure

```
aegisnet-ai/
├── src/
│   ├── components/     # React UI (Dashboard, Forensics, NetworkGraph, etc.)
│   ├── context/        # PacketContext — global ML + state management
│   ├── core/           # IsolationForest, LivePacketService, ExtensionBridge
│   ├── pages/          # AuthPage, TermsModal
│   └── lib/            # Supabase client
├── extension/          # Chrome Extension (MV3, no npm)
├── agent/              # Node.js local capture agent
└── .env.example        # Supabase env template
```

---

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts · D3 · Supabase · Chrome MV3
