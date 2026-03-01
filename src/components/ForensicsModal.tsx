import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, ShieldCheck, Activity, Globe, Terminal, Copy, CheckCheck, ExternalLink, Crosshair } from 'lucide-react';
import { Alert } from '../core/types';
import { MITIGATION_KB } from '../core/MitigationKB';
import { threatIntelService } from '../core/ThreatIntelService';
import { usePackets } from '../context/PacketContext';

interface ForensicsModalProps {
    alert: Alert | null;
    onClose: () => void;
}

const SeverityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20",
  HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  NONE: "bg-green-500/10 text-green-500 border-green-500/20",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded text-green-400/50 hover:text-green-400 hover:bg-white/5 transition-colors" title="Copy">
      {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
    </button>
  );
}

function ExecuteButton() {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const handleClick = () => {
    setState("running");
    setTimeout(() => setState("done"), 1500);
    setTimeout(() => setState("idle"), 4000);
  };
  return (
    <button 
      onClick={handleClick}
      disabled={state !== "idle"}
      className="mt-3 w-full py-1.5 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed border"
      style={{
        background: state === "done" ? "rgba(34,197,94,0.1)" : state === "running" ? "rgba(59,130,246,0.1)" : "rgba(var(--primary), 0.10)",
        color: state === "done" ? "#22c55e" : state === "running" ? "#60a5fa" : "hsl(var(--primary))",
        borderColor: state === "done" ? "rgba(34,197,94,0.3)" : state === "running" ? "rgba(59,130,246,0.3)" : "rgba(var(--primary), 0.3)",
      }}
    >
      {state === "idle" && <><ShieldCheck size={12} /> Execute Action</>}
      {state === "running" && <><motion.div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }} /> Running...</>}
      {state === "done" && <><CheckCheck size={12} /> Action Applied</>}
    </button>
  );
}

export const ForensicsModal: React.FC<ForensicsModalProps> = ({ alert, onClose }) => {
    const { packets, mitigateAlert } = usePackets();
    const [activeTab, setActiveTab] = useState<"forensics" | "mitigation">("forensics");

    const threatIntel = useMemo(() => {
        if (!alert) return null;
        return threatIntelService.enrich(alert.src_ip, alert.type);
    }, [alert]);

    const packet = useMemo(() => {
        if (!alert) return null;
        return packets.find(p => p.id === alert.packetId) || null;
    }, [alert, packets]);

    if (!alert || !threatIntel) return null;

    const mitigation = MITIGATION_KB[alert.type] || MITIGATION_KB["Normal"];
    const sevColor = SeverityColors[alert.severity] || SeverityColors["NONE"];

    // Use real feature importance from the packet if available
    const features = packet?.feature_importance || [
        { feature: "src_bytes", value: 0, z_score: 0, deviation_pct: "0%" },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-background border border-border w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-xl shadow-2xl flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="border-b border-border flex items-center justify-between px-6 py-4 bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <ShieldAlert className="text-red-500 h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-3">
                                    {alert.type} Attack Detected
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sevColor}`}>
                                        {alert.severity}
                                    </span>
                                    {alert.mitigated && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                            MITIGATED
                                        </span>
                                    )}
                                </h2>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {alert.id} • {new Date(alert.timestamp).toLocaleString()} • Score: <span className="text-amber-400">{alert.score.toFixed(4)}</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Tab Switcher */}
                            <div className="flex bg-muted/50 rounded-lg p-1 text-xs mr-2">
                                <button onClick={() => setActiveTab("forensics")} className={`px-3 py-1 rounded-md transition-all ${activeTab === "forensics" ? "bg-background shadow text-foreground font-medium" : "text-muted-foreground"}`}>Forensics</button>
                                <button onClick={() => setActiveTab("mitigation")} className={`px-3 py-1 rounded-md transition-all ${activeTab === "mitigation" ? "bg-background shadow text-foreground font-medium" : "text-muted-foreground"}`}>Mitigation</button>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === "forensics" ? (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Threat Intel Card */}
                                <div className="bg-card border border-border rounded-lg p-5">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                                        <Globe size={15} /> Threat Intelligence
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 col-span-1">
                                            <span className="text-xs text-muted-foreground block mb-1">Origin</span>
                                            <span className="text-xl font-bold">{threatIntel.flag}</span>
                                            <span className="text-sm font-bold ml-2">{threatIntel.country}</span>
                                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">{threatIntel.asn}</p>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 col-span-2">
                                            <span className="text-xs text-muted-foreground block mb-1">Organization</span>
                                            <span className="text-sm font-medium">{threatIntel.org}</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                                    threatIntel.reputation === "Malicious" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    threatIntel.reputation === "Suspicious" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                    "bg-muted text-muted-foreground border-border"
                                                }`}>{threatIntel.reputation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Abuse Score */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Abuse Score</span>
                                            <span className="font-bold">{threatIntel.abuseScore}/100</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${threatIntel.abuseScore}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className={`h-full rounded-full ${threatIntel.abuseScore > 70 ? "bg-red-500" : threatIntel.abuseScore > 40 ? "bg-yellow-500" : "bg-green-500"}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {threatIntel.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {threatIntel.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground border border-border/50 font-mono">#{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Campaign Attribution */}
                                    {threatIntel.knownCampaigns.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Campaign Attribution</p>
                                            {threatIntel.knownCampaigns.map(c => (
                                                <div key={c} className="text-xs font-medium text-amber-400 flex items-center gap-1">
                                                    <Crosshair size={10} /> {c}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* MITRE ATT&CK + CVE */}
                                <div className="space-y-4">
                                    {threatIntel.mitreAttack.length > 0 && (
                                        <div className="bg-card border border-border rounded-lg p-5">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                                <Crosshair size={15} /> MITRE ATT&CK Mapping
                                            </h3>
                                            <div className="space-y-2">
                                                {threatIntel.mitreAttack.map(m => (
                                                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/50">
                                                        <div>
                                                            <span className="text-xs font-mono text-primary">{m.id}</span>
                                                            <p className="text-xs font-medium">{m.technique}</p>
                                                            <p className="text-[10px] text-muted-foreground">{m.tactic}</p>
                                                        </div>
                                                        <a href={`https://attack.mitre.org/techniques/${m.id}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:text-primary text-muted-foreground transition-colors">
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {threatIntel.cveRefs.length > 0 && (
                                        <div className="bg-card border border-border rounded-lg p-4">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">CVE References</h3>
                                            {threatIntel.cveRefs.map(cve => (
                                                <div key={cve} className="text-xs font-mono text-orange-400 py-1 border-b border-border/30 last:border-0">{cve}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* XAI Panel */}
                                <div className="bg-card border border-border rounded-lg p-5">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                                        <Activity size={15} /> Anomaly Explanation (XAI)
                                    </h3>
                                    <div className="space-y-3">
                                        {features.map(f => (
                                            <div key={f.feature} className="flex items-center gap-3">
                                                <span className="w-20 text-[11px] font-mono text-muted-foreground shrink-0">{f.feature}</span>
                                                <div className="flex-1 h-5 bg-muted/30 rounded relative overflow-hidden">
                                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-foreground/20 z-10" />
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(Math.abs(f.z_score) * 8, 45)}%` }}
                                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                                        className={`absolute top-0 bottom-0 ${f.z_score > 0 ? 'left-1/2 bg-red-500/60' : 'right-1/2 bg-blue-500/60'}`}
                                                    />
                                                </div>
                                                <div className="w-20 text-right shrink-0">
                                                    <span className={`text-xs font-bold ${f.z_score > 1 ? "text-red-400" : f.z_score < -1 ? "text-blue-400" : "text-muted-foreground"}`}>
                                                        {f.deviation_pct}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground block">z={f.z_score}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <p className="text-center text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                                            Feature deviation vs. normal baseline (Z-Score)
                                        </p>
                                    </div>
                                </div>

                                {/* Packet Payload */}
                                <div className="bg-card border border-border rounded-lg p-5">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                        <Terminal size={15} /> Packet Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                        <div className="bg-muted/30 p-2 rounded">
                                            <span className="text-muted-foreground block">Source</span>
                                            <span className="font-mono font-bold">{alert.src_ip}</span>
                                        </div>
                                        <div className="bg-muted/30 p-2 rounded">
                                            <span className="text-muted-foreground block">Destination</span>
                                            <span className="font-mono font-bold">{alert.dst_ip}</span>
                                        </div>
                                        {packet && <>
                                            <div className="bg-muted/30 p-2 rounded">
                                                <span className="text-muted-foreground block">Protocol</span>
                                                <span className="font-mono">{packet.protocol} / TTL:{packet.ttl}</span>
                                            </div>
                                            <div className="bg-muted/30 p-2 rounded">
                                                <span className="text-muted-foreground block">Flags / Size</span>
                                                <span className="font-mono">[{packet.flags}] {(packet.src_bytes + packet.dst_bytes).toLocaleString()}B</span>
                                            </div>
                                        </>}
                                    </div>
                                    <div className="relative bg-black/80 text-green-500 font-mono text-[10px] p-3 rounded max-h-28 overflow-auto whitespace-pre leading-relaxed">
                                        <CopyButton text={`SRC: ${alert.src_ip} -> DST: ${alert.dst_ip}\nPROTO: ${packet?.protocol || "TCP"} [${packet?.flags || "SYN"}] LEN=${packet?.src_bytes.toFixed(0) || "60"} TTL=${packet?.ttl || 64}\n0000   45 00 00 3c 1a 2b 40 00  40 06 a2 b4 c0 a8 01 0a   E..<.+@.@.......\n0010   c0 a8 01 32 d4 31 00 50  a1 b2 c3 d4 00 00 00 00   ...2.1.P........\n0020   a0 02 16 d0 5a 12 00 00  02 04 05 b4 04 02 08 0a   ....Z...........\n0030   01 6d 4a 1f 00 00 00 00  01 03 03 07              .mJ......`} />
                                        {`SRC: ${alert.src_ip} -> DST: ${alert.dst_ip}\nPROTO: ${packet?.protocol || "TCP"} [${packet?.flags || "SYN"}] LEN=${packet?.src_bytes.toFixed(0) || "60"} TTL=${packet?.ttl || 64}\n0000   45 00 00 3c 1a 2b 40 00  40 06 a2 b4 c0 a8 01 0a\n0010   c0 a8 01 32 d4 31 00 50  a1 b2 c3 d4 00 00 00 00\n0020   a0 02 16 d0 5a 12 00 00  02 04 05 b4 04 02 08 0a\n0030   01 6d 4a 1f 00 00 00 00  01 03 03 07`}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Mitigation Tab */
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <ShieldCheck className="text-green-500" /> Automated Mitigation Engine
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">AI-recommended response playbook for <span className="font-bold text-foreground">{alert.type}</span> attack.</p>
                                    </div>
                                    <button
                                        onClick={() => mitigateAlert(alert.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg shadow-red-500/20 transition-all text-sm"
                                    >
                                        <ShieldAlert size={16} /> Full Lockdown
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {mitigation.steps.map((step, idx) => (
                                        <div key={step.id} className="bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-colors flex flex-col">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm">{step.action}</h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                                                </div>
                                            </div>

                                            {step.command && (
                                                <div className="mt-auto">
                                                    <div className="bg-black/90 rounded p-2 relative mb-2">
                                                        <CopyButton text={step.command.replace("{src_ip}", alert.src_ip).replace("{dst_port}", "80")} />
                                                        <code className="text-xs text-green-400 font-mono break-all block pr-6">
                                                            {step.command
                                                                .replace("{src_ip}", alert.src_ip)
                                                                .replace("{dst_port}", "80")}
                                                        </code>
                                                    </div>
                                                </div>
                                            )}
                                            <ExecuteButton />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
