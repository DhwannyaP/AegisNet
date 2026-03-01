/**
 * LivePacketService — WebSocket client for the AegisNet Agent
 * Connects to ws://localhost:3001 and streams real packets.
 * Falls back gracefully if agent is not running.
 */

type PacketCallback = (packet: Record<string, unknown>) => void;
type StatusCallback = (status: 'connected' | 'connecting' | 'disconnected') => void;

const AGENT_WS_URL = 'ws://localhost:3001';
const AGENT_HTTP_URL = 'http://localhost:3001';
const RECONNECT_DELAY_MS = 3000;

class LivePacketService {
  private ws: WebSocket | null = null;
  private packetCallbacks: Set<PacketCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManuallyDisconnected = false;
  private _status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

  get status() { return this._status; }

  private setStatus(s: 'connected' | 'connecting' | 'disconnected') {
    this._status = s;
    this.statusCallbacks.forEach(cb => cb(s));
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.isManuallyDisconnected = false;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(AGENT_WS_URL);

      this.ws.onopen = () => {
        console.log('[AegisNet] Live agent connected');
        this.setStatus('connected');
        if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === 'packet' && msg.payload) {
            this.packetCallbacks.forEach(cb => cb(msg.payload));
          }
        } catch { /* ignore malformed */ }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        if (!this.isManuallyDisconnected) {
          console.log(`[AegisNet] Agent disconnected. Retrying in ${RECONNECT_DELAY_MS / 1000}s...`);
          this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
        }
      };

      this.ws.onerror = () => {
        // Error will be followed by onclose — we handle reconnect there
      };
    } catch (err) {
      this.setStatus('disconnected');
    }
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.ws?.close();
    this.ws = null;
    this.setStatus('disconnected');
  }

  onPacket(cb: PacketCallback): () => void {
    this.packetCallbacks.add(cb);
    return () => { this.packetCallbacks.delete(cb); };
  }

  onStatusChange(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => { this.statusCallbacks.delete(cb); };
  }

  // ── Firewall REST API ───────────────────────────────────────────────────────
  async blockIP(ip: string): Promise<{ success: boolean; error?: string; ruleName?: string }> {
    try {
      const res = await fetch(`${AGENT_HTTP_URL}/api/firewall/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      return res.json();
    } catch {
      return { success: false, error: 'Agent not reachable. Is it running as Administrator?' };
    }
  }

  async unblockIP(ip: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${AGENT_HTTP_URL}/api/firewall/unblock`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      return res.json();
    } catch {
      return { success: false, error: 'Agent not reachable.' };
    }
  }

  async getFirewallRules(): Promise<{ ip: string; rule: string }[]> {
    try {
      const res = await fetch(`${AGENT_HTTP_URL}/api/firewall/rules`);
      const data = await res.json();
      return data.rules || [];
    } catch {
      return [];
    }
  }

  async getHealth(): Promise<{ status: string; blocked: number; packets: number } | null> {
    try {
      const res = await fetch(`${AGENT_HTTP_URL}/health`, { signal: AbortSignal.timeout(1500) });
      return res.json();
    } catch {
      return null;
    }
  }
}

export const livePacketService = new LivePacketService();
