import React, { useState, useMemo } from 'react';
import { usePackets } from "../context/PacketContext";
import { Packet } from "../core/types";
import { Search, AlertTriangle, CheckCircle, X, ExternalLink, Shield, Download } from "lucide-react";
import { cn } from '../utils/cn';

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  UDP: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ICMP: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const ATTACK_BADGE_COLORS: Record<string, string> = {
  DoS: "text-red-400",
  Probe: "text-orange-400",
  Exploits: "text-yellow-400",
  R2L: "text-purple-400",
  U2R: "text-pink-400",
  Fuzzers: "text-amber-400",
  Backdoor: "text-cyan-400",
  Normal: "text-green-400",
};

export const ForensicsPanel: React.FC = () => {
  const { packets, setSelectedAlert, alerts } = usePackets();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ANOMALY" | "NORMAL">("ALL");
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  const filteredPackets = useMemo(() => {
    return packets.filter(p => {
      const matchesSearch =
        p.src_ip.includes(searchTerm) ||
        p.dst_ip.includes(searchTerm) ||
        p.protocol.includes(searchTerm.toUpperCase()) ||
        p.attack_type.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filterType === "ANOMALY") return p.is_anomaly;
      if (filterType === "NORMAL") return !p.is_anomaly;
      return true;
    });
  }, [packets, searchTerm, filterType]);

  const handleExportCSV = () => {
    const header = "Timestamp,Source IP,Source Port,Dest IP,Dest Port,Protocol,Flags,TTL,Attack Type,Anomaly Score,Is Anomaly";
    const rows = filteredPackets.map(p =>
      `${new Date(p.timestamp).toISOString()},${p.src_ip},${p.src_port},${p.dst_ip},${p.dst_port},${p.protocol},${p.flags},${p.ttl},${p.attack_type},${(p.anomaly_score || 0).toFixed(4)},${p.is_anomaly}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aegisnet_packets_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const openAlertForPacket = (pkt: Packet) => {
    if (!pkt.is_anomaly) return;
    const alert = alerts.find(a => a.packetId === pkt.id);
    if (alert) setSelectedAlert(alert);
  };

  return (
    <div className="h-[calc(100vh-148px)] flex gap-4">
      {/* Left: Packet List */}
      <div className="flex-1 flex flex-col bg-card/50 rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-border bg-muted/20 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search IP, Protocol, Type..."
              className="w-full bg-background border border-input rounded-lg pl-8 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-background rounded-lg border border-input p-1">
            {(["ALL", "ANOMALY", "NORMAL"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  "px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1",
                  filterType === f
                    ? f === "ANOMALY" ? "bg-red-500 text-white" : f === "NORMAL" ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                {f === "ANOMALY" && <AlertTriangle size={10} />}
                {f === "NORMAL" && <CheckCircle size={10} />}
                {f === "ALL" ? "All" : f === "ANOMALY" ? "Threats" : "Normal"}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-background border border-input rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Source IP</div>
          <div className="col-span-2">Dest IP</div>
          <div className="col-span-1">Proto</div>
          <div className="col-span-1">TTL</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-1 text-right">View</div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredPackets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Shield className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No packets match your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredPackets.map((pkt) => (
                <div
                  key={pkt.id}
                  className={cn(
                    "grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer text-xs",
                    selectedPacket?.id === pkt.id && "bg-primary/5",
                    pkt.is_anomaly && "bg-red-500/5 border-l-2 border-l-red-500/60"
                  )}
                  onClick={() => setSelectedPacket(pkt === selectedPacket ? null : pkt)}
                >
                  <div className="col-span-2 font-mono text-muted-foreground text-[10px]">
                    {new Date(pkt.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="col-span-2 font-mono text-[11px] truncate">{pkt.src_ip}</div>
                  <div className="col-span-2 font-mono text-[11px] truncate">{pkt.dst_ip}</div>
                  <div className="col-span-1">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", PROTOCOL_COLORS[pkt.protocol])}>
                      {pkt.protocol}
                    </span>
                  </div>
                  <div className="col-span-1 font-mono text-[10px] text-muted-foreground">{pkt.ttl}</div>
                  <div className="col-span-2">
                    <span className={cn("font-semibold", ATTACK_BADGE_COLORS[pkt.attack_type])}>
                      {pkt.attack_type === "Normal" ? "Benign" : pkt.attack_type}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", pkt.is_anomaly ? "bg-red-500" : "bg-green-500")}
                        style={{ width: `${Math.min((pkt.anomaly_score || 0) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">{(pkt.anomaly_score || 0).toFixed(3)}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {pkt.is_anomaly && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openAlertForPacket(pkt); }}
                        className="p-1 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                        title="Open forensics"
                      >
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-border text-[10px] text-muted-foreground bg-muted/20 flex items-center justify-between px-4">
          <span>Showing {filteredPackets.length} of {packets.length} packets</span>
          <span>{filteredPackets.filter(p => p.is_anomaly).length} threats</span>
        </div>
      </div>

      {/* Right: Detail View */}
      {selectedPacket && (
        <div className="w-72 bg-card rounded-xl border border-border flex flex-col shadow-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Packet Details</h3>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{selectedPacket.id}</p>
            </div>
            <button onClick={() => setSelectedPacket(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {[
              { label: "Source", value: `${selectedPacket.src_ip}:${selectedPacket.src_port}` },
              { label: "Destination", value: `${selectedPacket.dst_ip}:${selectedPacket.dst_port}` },
              { label: "Protocol", value: selectedPacket.protocol },
              { label: "Flags", value: selectedPacket.flags },
              { label: "TTL", value: selectedPacket.ttl.toString() },
              { label: "Connections", value: selectedPacket.num_connections.toString() },
              { label: "Error Rate", value: `${(selectedPacket.error_rate * 100).toFixed(1)}%` },
              { label: "Duration", value: `${selectedPacket.duration.toFixed(3)}s` },
              { label: "Src Bytes", value: `${selectedPacket.src_bytes.toFixed(0)} B` },
              { label: "Dst Bytes", value: `${selectedPacket.dst_bytes.toFixed(0)} B` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs py-1 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-medium">{value}</span>
              </div>
            ))}

            <div className={cn(
              "p-3 rounded-lg border text-xs",
              selectedPacket.is_anomaly
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-green-500/10 border-green-500/20 text-green-400"
            )}>
              <div className="flex items-center gap-2 mb-1">
                {selectedPacket.is_anomaly ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                <span className="font-bold">{selectedPacket.is_anomaly ? "ANOMALY DETECTED" : "BENIGN TRAFFIC"}</span>
              </div>
              <div>Score: <span className="font-mono font-bold">{(selectedPacket.anomaly_score || 0).toFixed(4)}</span></div>
              {selectedPacket.is_anomaly && (
                <div className="mt-1">Type: <span className="font-bold">{selectedPacket.attack_type}</span></div>
              )}
            </div>

            {/* XAI mini */}
            {selectedPacket.feature_importance && selectedPacket.feature_importance.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Feature Importance (XAI)</p>
                {selectedPacket.feature_importance.slice(0, 3).map(f => (
                  <div key={f.feature} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{f.feature}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", f.z_score > 0 ? "bg-red-500" : "bg-blue-500")}
                        style={{ width: `${Math.min(Math.abs(f.z_score) * 15, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono w-10 text-right text-muted-foreground">{f.deviation_pct}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedPacket.is_anomaly && (
              <button
                onClick={() => openAlertForPacket(selectedPacket)}
                className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-primary/20"
              >
                <ExternalLink size={12} /> Full Forensics Report
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
