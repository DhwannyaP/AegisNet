/**
 * AegisNet AI — Dashboard Extension Bridge
 * ==========================================
 * Receives packets from the Chrome Extension via BroadcastChannel
 * and pipes them into the PacketContext as if they came from the sim.
 *
 * Usage: import and call startExtensionBridge(cb) from PacketContext.
 * The callback receives a packet in the AegisNet Packet format.
 */

const CHANNEL_NAME = 'aegisnet-extension-channel';

type ExtPacketCallback = (packet: Record<string, unknown>) => void;
type ExtStatusCallback = (status: { isActive: boolean; capturedCount: number; threatCount: number }) => void;

class ExtensionBridge {
  private channel: BroadcastChannel | null = null;
  private packetCallbacks = new Set<ExtPacketCallback>();
  private statusCallbacks = new Set<ExtStatusCallback>();
  private _isExtensionActive = false;

  get isExtensionActive() { return this._isExtensionActive; }

  start() {
    if (this.channel) return; // already started
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
      console.log('[AegisNet] Extension bridge started — listening for packets');
    } catch (err) {
      console.warn('[AegisNet] BroadcastChannel not available:', err);
    }
  }

  stop() {
    this.channel?.close();
    this.channel = null;
    this._isExtensionActive = false;
  }

  private handleMessage(data: Record<string, unknown>) {
    switch (data.type) {
      case 'packet':
        if (data.payload) {
          this.packetCallbacks.forEach(cb => cb(data.payload as Record<string, unknown>));
        }
        break;

      case 'extension_status':
        this._isExtensionActive = !!(data as { isActive: boolean }).isActive;
        this.statusCallbacks.forEach(cb => cb({
          isActive: this._isExtensionActive,
          capturedCount: 0,
          threatCount: 0,
        }));
        break;

      case 'extension_stats':
        this.statusCallbacks.forEach(cb => cb({
          isActive: !!(data as { isActive: boolean }).isActive,
          capturedCount: (data as { capturedCount: number }).capturedCount || 0,
          threatCount: (data as { threatCount: number }).threatCount || 0,
        }));
        break;
    }
  }

  onPacket(cb: ExtPacketCallback): () => void {
    this.packetCallbacks.add(cb);
    return () => { this.packetCallbacks.delete(cb); };
  }

  onStatusChange(cb: ExtStatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => { this.statusCallbacks.delete(cb); };
  }
}

export const extensionBridge = new ExtensionBridge();
