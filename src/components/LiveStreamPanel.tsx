import { usePackets } from "../context/PacketContext";
import { CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "../utils/cn";

const PROTOCOL_PILL: Record<string, string> = {
  TCP: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  UDP: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  ICMP: "border-pink-500/30 text-pink-400 bg-pink-500/10",
};

const ATTACK_ROW_BG: Record<string, string> = {
  DoS: "bg-red-500/10 hover:bg-red-500/15",
  Probe: "bg-orange-500/10 hover:bg-orange-500/15",
  Exploits: "bg-yellow-500/10 hover:bg-yellow-500/15",
  R2L: "bg-purple-500/10 hover:bg-purple-500/15",
  U2R: "bg-pink-500/10 hover:bg-pink-500/15",
  Fuzzers: "bg-amber-500/10 hover:bg-amber-500/15",
  Backdoor: "bg-cyan-500/10 hover:bg-cyan-500/15",
};

const ATTACK_TEXT_COLOR: Record<string, string> = {
  DoS: "text-red-400",
  Probe: "text-orange-400",
  Exploits: "text-yellow-400",
  R2L: "text-purple-400",
  U2R: "text-pink-400",
  Fuzzers: "text-amber-400",
  Backdoor: "text-cyan-400",
};

export const LiveStreamPanel: React.FC = () => {
  const { packets, alerts, setSelectedAlert } = usePackets();

  const handleRowClick = (packetId: string) => {
    const alert = alerts.find(a => a.packetId === packetId);
    if (alert) setSelectedAlert(alert);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto relative">
        <table className="w-full text-xs text-left min-w-[900px]">
          <thead className="bg-muted/80 text-muted-foreground sticky top-0 z-10">
            <tr>
              {["Timestamp", "ID", "Source", "Destination", "Proto", "Flags", "TTL", "Size", "Type", "Anomaly Score"].map(h => (
                <th key={h} className="p-3 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {packets.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10 text-center text-muted-foreground">
                  Press <span className="text-green-400 font-bold">▶ Start Monitoring</span> to begin packet capture.
                </td>
              </tr>
            ) : (
              packets.map((pkt, idx) => {
                const isAnomaly = pkt.is_anomaly;
                const isNew = idx < 5;
                return (
                  <tr
                    key={pkt.id}
                    className={cn(
                      "transition-colors cursor-pointer",
                      isNew && isAnomaly && "animate-slide-in-row",
                      isAnomaly
                        ? ATTACK_ROW_BG[pkt.attack_type] || "bg-red-500/10 hover:bg-red-500/15"
                        : "hover:bg-muted/30",
                      isAnomaly && "border-l-2 border-l-red-500/60"
                    )}
                    onClick={() => isAnomaly && handleRowClick(pkt.id)}
                    title={isAnomaly ? "Click to view forensics" : undefined}
                  >
                    <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(pkt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{pkt.id.split('-')[1]}</td>
                    <td className="p-3 font-mono">
                      {pkt.src_ip}:<span className="text-muted-foreground">{pkt.src_port}</span>
                    </td>
                    <td className="p-3 font-mono">
                      {pkt.dst_ip}:<span className="text-muted-foreground">{pkt.dst_port}</span>
                    </td>
                    <td className="p-3">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", PROTOCOL_PILL[pkt.protocol])}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{pkt.flags}</td>
                    <td className="p-3 font-mono text-muted-foreground">{pkt.ttl}</td>
                    <td className="p-3 font-mono text-muted-foreground">{(pkt.src_bytes + pkt.dst_bytes).toFixed(0)}B</td>
                    <td className="p-3">
                      {pkt.attack_type === "Normal" ? (
                        <span className="flex items-center gap-1 text-green-400/80">
                          <CheckCircle size={11} /> Benign
                        </span>
                      ) : (
                        <span className={cn("flex items-center gap-1 font-bold", ATTACK_TEXT_COLOR[pkt.attack_type] || "text-red-400")}>
                          <ShieldAlert size={11} className="animate-pulse" /> {pkt.attack_type}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              (pkt.anomaly_score || 0) > 0.8 ? "bg-red-500" :
                              (pkt.anomaly_score || 0) > 0.6 ? "bg-orange-500" : "bg-green-500"
                            )}
                            style={{ width: `${(pkt.anomaly_score || 0) * 100}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-[10px] font-mono w-8 text-right",
                          (pkt.anomaly_score || 0) > 0.8 ? "text-red-400" :
                          (pkt.anomaly_score || 0) > 0.6 ? "text-orange-400" : "text-green-400"
                        )}>
                          {(pkt.anomaly_score || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{packets.length} packets captured</span>
        <span>{packets.filter(p => p.is_anomaly).length} threats detected · Click any threat row to view forensics</span>
      </div>
    </div>
  );
};
