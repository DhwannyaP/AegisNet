# AegisNet AI — Chrome Extension

Zero-install browser traffic monitor. No npm, no terminal. Works on any platform where Chrome/Edge runs.

## Install (30 seconds)

### Chrome / Edge (Developer Mode)

1. Download or clone this repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `extension/` folder from this project
6. Click the AegisNet icon in your toolbar → the onboarding page opens automatically

### When Published (Chrome Web Store)
Users will simply click **"Add to Chrome"** — no terminal, no npm, nothing else.

---

## Setup Flow (T&C Gate)

```
Install extension
      ↓
Onboarding page opens automatically
      ↓ 
User reads Terms & Conditions
      ↓
User checks agreement checkbox
      ↓
Click "Agree & Activate" 
      ↓ ← Monitoring starts AUTOMATICALLY
Open AegisNet Dashboard → live packets appear
```

**T&C acceptance is stored in `chrome.storage.local`.**  
If you have Supabase configured, it also records the acceptance in the user's account for compliance.

---

## What Gets Captured

The extension captures HTTP/HTTPS **request metadata only**:

| Data | Captured? |
|------|-----------|
| Request URL | ✅ (up to 200 chars) |
| HTTP Method | ✅ |
| Status Code | ✅ |
| Response Size | ✅ (from Content-Length header) |
| Request Timing | ✅ |
| Destination Host | ✅ |
| Request Body/Passwords | ❌ Never |
| Cookie Values | ❌ Never |

---

## How Dashboard Integration Works

The extension communicates with the AegisNet dashboard using **BroadcastChannel** — a zero-latency in-browser API. No localhost server needed.

```
Chrome Extension (background.js)
        ↓  BroadcastChannel('aegisnet-extension-channel')
AegisNet Dashboard (ExtensionBridge.ts)
        ↓
PacketContext → ML Analysis → UI
```

---

## Threat Detection Heuristics

The extension classifies requests in real-time:

| Pattern | Classification |
|---------|---------------|
| Admin panel probes (`/wp-admin`, `/phpmyadmin`) | `Probe` |
| Path traversal (`../`) | `Fuzzers` |
| SQL injection patterns | `Fuzzers` |
| XSS attempts (`<script`) | `Fuzzers` |
| 401 on auth endpoints | `R2L` |
| 403 responses | `Exploits` |

---

## Permissions Explained

| Permission | Why |
|-----------|-----|
| `webRequest` | Read request/response metadata (NOT content) |
| `storage` | Remember T&C acceptance, user preferences |
| `tabs` | Open onboarding on install |
| `alarms` | Periodic stats broadcast to dashboard |
| `notifications` | Alert on critical threat detection |
| `<all_urls>` | Monitor all domains (required for full coverage) |

---

## Files

```
extension/
├── manifest.json          # Chrome Extension Manifest v3
├── background.js          # Service worker — captures traffic, T&C gate
├── popup.html             # Toolbar popup — status + controls  
├── popup.js               # Popup logic
├── onboarding.html        # T&C agreement page (opens on install)
├── generate-icons.mjs     # Script to generate PNG icons
└── icons/                 # Icon files (16, 32, 48, 128px)
```
