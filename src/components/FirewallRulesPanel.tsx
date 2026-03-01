import React, { useState, useEffect } from 'react';
import { usePackets } from '../context/PacketContext';
import { livePacketService } from '../core/LivePacketService';
import { Shield, RefreshCw, WifiOff, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface FirewallRule { ip: string; rule: string; }

export const FirewallRulesPanel: React.FC = () => {
  const { alerts } = usePackets();
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblockingIP, setUnblockingIP] = useState<string | null>(null);
  const [agentOnline, setAgentOnline] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    const health = await livePacketService.getHealth();
    setAgentOnline(!!health);
    if (health) {
      const r = await livePacketService.getFirewallRules();
      setRules(r);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleUnblock = async (ip: string) => {
    setUnblockingIP(ip);
    await livePacketService.unblockIP(ip);
    await fetchRules();
    setUnblockingIP(null);
  };

  const handleBlockFromAlert = async (ip: string) => {
    const res = await livePacketService.blockIP(ip);
    if (res.success) await fetchRules();
    else alert(`Block failed: ${res.error}`);
  };

  const uniqueAttackerIPs = [...new Set(alerts.filter(a => !a.mitigated).map(a => a.src_ip))].slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Agent Status */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        agentOnline ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", agentOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
          <div>
            <p className="font-semibold text-sm">
              {agentOnline ? "Agent Connected" : "Agent Offline"}
            </p>
            <p className="text-xs text-muted-foreground">
              {agentOnline ? `${rules.length} active block(s) · ws://localhost:3001` : "Run: cd agent && npm install && node agent.mjs"}
            </p>
          </div>
        </div>
        <button onClick={fetchRules} disabled={loading} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Active Blocks */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield size={15} className="text-red-400" />
            Active Firewall Blocks
            {rules.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">{rules.length}</span>
            )}
          </h3>
          {!agentOnline && (
            <span className="text-xs text-muted-foreground">Agent required for live rules</span>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No active firewall blocks.</p>
            <p className="text-xs mt-1">Block IPs from the Forensics panel → Mitigation tab.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {rules.map(({ ip, rule }) => (
              <div key={ip} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="font-mono text-sm font-bold">{ip}</span>
                  <p className="text-xs text-muted-foreground font-mono">{rule}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">BLOCKED</span>
                  <button
                    onClick={() => handleUnblock(ip)}
                    disabled={unblockingIP === ip}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-red-500/10 hover:text-red-400 border border-border hover:border-red-500/20 rounded-lg transition-all"
                  >
                    {unblockingIP === ip ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Block from active alerts */}
      {uniqueAttackerIPs.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <WifiOff size={15} className="text-orange-400" />
              Quick Block — Active Threat Sources
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {uniqueAttackerIPs.map(ip => {
              const isBlocked = rules.some(r => r.ip === ip);
              return (
                <div key={ip} className="flex items-center justify-between px-5 py-3">
                  <span className="font-mono text-sm">{ip}</span>
                  <button
                    onClick={() => handleBlockFromAlert(ip)}
                    disabled={isBlocked || !agentOnline}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg font-bold border transition-all",
                      isBlocked
                        ? "bg-red-500/10 text-red-400 border-red-500/20 cursor-not-allowed"
                        : agentOnline
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        : "bg-muted text-muted-foreground border-border cursor-not-allowed"
                    )}
                  >
                    {isBlocked ? "Blocked" : agentOnline ? "Block IP" : "Agent Offline"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!agentOnline && (
        <div className="bg-muted/30 border border-border rounded-xl p-5 text-xs space-y-2 text-muted-foreground">
          <p className="font-semibold text-foreground text-sm">How to start real-time capture + firewall control:</p>
          <div className="bg-black/60 p-3 rounded-lg font-mono text-green-400 space-y-1">
            <p># In a new terminal (as Administrator):</p>
            <p>cd agent</p>
            <p>npm install</p>
            <p>node agent.mjs</p>
          </div>
          <p>Then toggle <strong className="text-foreground">Live Mode</strong> in the dashboard header. Works on Windows, Linux, and macOS — no Wireshark required.</p>
        </div>
      )}
    </div>
  );
};
