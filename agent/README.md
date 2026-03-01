# AegisNet AI — Capture Agent

Zero-dependency local agent for real packet capture. Requires only Node.js 18+.

## Quick Start

```bash
cd agent
npm install
```

### Windows (Run as Administrator)
```powershell
# Right-click PowerShell → "Run as Administrator"
node agent.mjs
```

### Linux
```bash
sudo node agent.mjs
```

### macOS
```bash
sudo node agent.mjs
```

Expected output:
```
 AegisNet AI Capture Agent
    Platform : Windows
    Node.js  : v20.x.x
    WebSocket: ws://localhost:3001

 AegisNet Agent listening on ws://localhost:3001
   Dashboard: Open http://localhost:5173 and toggle Live Mode ON
```

## How It Works

The agent reads your OS connection table every 600ms:
- **Windows**: `netstat -n -o`
- **Linux**: `ss -tunp` (falls back to `netstat -n`)
- **macOS**: `netstat -n`

No Wireshark, no libpcap, no raw socket access needed.

## Firewall Mitigation

When you click "Execute" in the dashboard:
- **Windows**: Creates a `netsh advfirewall` rule named `AegisNet-Block-<IP>`  
- **Linux**: Adds an `iptables` DROP rule

All rules are cleaned up automatically when the agent exits (`Ctrl+C`).

To manually list AegisNet rules:
```bash
# Windows
netsh advfirewall firewall show rule name="AegisNet*"

# Linux
iptables -L INPUT -n | grep aegisnet
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Agent status |
| GET | `/api/firewall/rules` | List all blocks |
| POST | `/api/firewall/block` | Block an IP |
| DELETE | `/api/firewall/unblock` | Remove a block |
