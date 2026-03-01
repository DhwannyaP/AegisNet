import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldAlert,
  BarChart3,
  Network,
  Play,
  Pause,
  Menu,
  Cpu,
  Microscope,
  Zap,
  Brain,
  Clock,
  TrendingUp,
  LogOut,
  Wifi,
  WifiOff,
  Flame,
} from "lucide-react";
import { cn } from "../utils/cn";
import { usePackets } from "../context/PacketContext";
import { AttackType } from "../core/AttackSignatures";
import { livePacketService } from "../core/LivePacketService";
import { Toaster } from "./Toaster";
import { LiveStreamPanel } from "./LiveStreamPanel";
import { NetworkHeatmap } from "./NetworkHeatmap";
import { AnalysisPanel } from "./AnalysisPanel";
import { NetworkGraph } from "./NetworkGraph";
import { ForensicsPanel } from "./ForensicsPanel";
import { RiskGauge } from "./RiskGauge";
import { ArchitectureView } from "./ArchitectureView";
import { ForensicsModal } from "./ForensicsModal";
import { MLPerformancePanel } from "./MLPerformancePanel";
import { AttackReplayPanel } from "./AttackReplayPanel";
import { FirewallRulesPanel } from "./FirewallRulesPanel";

const ALL_ATTACK_TYPES: AttackType[] = ["Normal", "DoS", "Probe", "Exploits", "R2L", "U2R", "Fuzzers", "Backdoor"];

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed: boolean;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, collapsed, badge }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      collapsed && "justify-center px-2"
    )}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
    )}
    <Icon size={18} className={cn("shrink-0", active && "text-primary")} />
    {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    {!collapsed && badge !== undefined && badge > 0 && (
      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
    {collapsed && badge !== undefined && badge > 0 && (
      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border border-background" />
    )}
    {collapsed && (
      <div className="absolute left-full ml-2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-border shadow-md whitespace-nowrap">
        {label}
      </div>
    )}
  </button>
);

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
      <Clock size={12} />
      {time.toLocaleTimeString()}
    </div>
  );
}

const NAV_ITEMS = [
  { icon: Activity, label: "Live Stream" },
  { icon: BarChart3, label: "Analysis" },
  { icon: Network, label: "Network Graph" },
  { icon: Microscope, label: "Forensics" },
  { icon: Brain, label: "ML Performance" },
  { icon: Zap, label: "Attack Replay" },
  { icon: Flame, label: "Firewall Rules" },
  { icon: Cpu, label: "Architecture" },
];

const ATTACK_LABEL_MAP: Record<AttackType, string> = {
  Normal: "Reset",
  DoS: "DoS",
  Probe: "Probe",
  Exploits: "Exploit",
  R2L: "R2L",
  U2R: "U2R",
  Fuzzers: "Fuzz",
  Backdoor: "Backdoor",
};

export const DashboardLayout: React.FC<{ onSignOut?: () => void }> = ({ onSignOut }) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    isMonitoring,
    toggleMonitoring,
    alerts,
    setAttackType,
    selectedAttack,
    selectedAlert,
    setSelectedAlert,
    totalPacketsProcessed,
    throughputHistory,
    isReplaying,
  } = usePackets();
  const [activeTab, setActiveTab] = useState("Live Stream");
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const unmitigatedAlerts = alerts.filter(a => !a.mitigated).length;
  const latestThroughput = throughputHistory.length > 0 ? throughputHistory[throughputHistory.length - 1] : null;

  // Agent WebSocket status
  useEffect(() => {
    const unsub = livePacketService.onStatusChange(setAgentStatus);
    return () => { unsub(); };
  }, []);


  const toggleLiveMode = () => {
    if (!isLiveMode) {
      livePacketService.connect();
      setIsLiveMode(true);
    } else {
      livePacketService.disconnect();
      setIsLiveMode(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Toaster />
      <ForensicsModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />

      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-card/60 backdrop-blur-sm transition-all duration-300 flex flex-col z-20",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border/50 shrink-0">
          <div className="relative shrink-0">
            <Activity className="h-6 w-6 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-background" />
          </div>
          {!collapsed && (
            <div className="ml-3 leading-none">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-primary via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                AegisNet
              </span>
              <span className="font-black text-lg text-foreground/80"> AI</span>
              <div className="text-[9px] text-muted-foreground font-mono tracking-widest uppercase">Intrusion Detection</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.label}
              onClick={() => setActiveTab(item.label)}
              collapsed={collapsed}
              badge={item.label === "Forensics" ? unmitigatedAlerts : undefined}
            />
          ))}
        </div>

        {/* Risk Gauge */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <RiskGauge />
          </div>
        )}

        {/* Controls */}
        <div className="p-3 border-t border-border/50 bg-muted/10 shrink-0">
          <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between mb-3")}>
            <button
              onClick={toggleMonitoring}
              className={cn(
                "flex items-center justify-center rounded-full p-2.5 transition-all",
                isMonitoring
                  ? "bg-red-500/15 text-red-400 hover:bg-red-500/25 ring-1 ring-red-500/30"
                  : "bg-green-500/15 text-green-400 hover:bg-green-500/25 ring-1 ring-green-500/30"
              )}
            >
              {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {!collapsed && (
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System</span>
                <span className={cn("text-sm font-bold", isMonitoring ? "text-green-400" : "text-yellow-500")}>
                  {isReplaying ? "REPLAY" : isMonitoring ? "MONITORING" : "PAUSED"}
                </span>
              </div>
            )}
          </div>

          {/* Attack Injection */}
          {!collapsed && (
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Inject Attack
              </span>
              <div className="grid grid-cols-4 gap-1">
                {ALL_ATTACK_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setAttackType(selectedAttack === type ? null : type)}
                    title={type}
                    className={cn(
                      "text-[10px] px-1 py-1.5 rounded border transition-all font-medium",
                      selectedAttack === type
                        ? type === "Normal"
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-red-500 text-white border-red-500"
                        : "bg-background hover:bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {ATTACK_LABEL_MAP[type]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Live Mode & Sign-out */}
          {!collapsed && (
            <div className="mt-3 space-y-2">
              <button
                onClick={toggleLiveMode}
                title={isLiveMode ? 'Switch to Simulation mode' : 'Connect to local AegisNet Agent for real capture'}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                  isLiveMode
                    ? agentStatus === 'connected'
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-muted hover:bg-muted/80 border-border text-muted-foreground"
                )}
              >
                {isLiveMode ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isLiveMode
                  ? agentStatus === 'connected' ? '🟢 Live Mode' : '🟡 Connecting...'
                  : '🔴 Simulation'}
              </button>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                >
                  <LogOut size={12} /> Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-5 bg-background/90 backdrop-blur z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-base font-semibold leading-none">{activeTab}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <LiveClock />
                {isMonitoring && (
                  <span className="text-[10px] font-mono text-green-400">
                    {totalPacketsProcessed.toLocaleString()} pkts processed
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Throughput indicator */}
            {isMonitoring && latestThroughput && (
              <div className="hidden md:flex items-center gap-2 text-xs bg-muted/50 border border-border rounded-lg px-3 py-1.5">
                <TrendingUp size={12} className="text-primary" />
                <span className="font-mono font-bold">{latestThroughput.pps}</span>
                <span className="text-muted-foreground">pkt/s</span>
                {latestThroughput.threats > 0 && (
                  <>
                    <span className="text-border">|</span>
                    <span className="text-red-400 font-bold">{latestThroughput.threats}</span>
                    <span className="text-muted-foreground">threats</span>
                  </>
                )}
              </div>
            )}

            {/* Alert badge */}
            <button
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              onClick={() => {
                const first = alerts.find(a => !a.mitigated);
                if (first) {
                  setSelectedAlert(first);
                  setActiveTab("Forensics");
                }
              }}
            >
              <ShieldAlert size={18} className={unmitigatedAlerts > 0 ? "text-red-400 animate-pulse" : "text-muted-foreground"} />
              {unmitigatedAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border border-background text-[9px] font-bold text-white flex items-center justify-center">
                  {unmitigatedAlerts > 9 ? "9+" : unmitigatedAlerts}
                </span>
              )}
            </button>

            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-500 border border-primary/50 flex items-center justify-center text-xs font-black text-white shadow">
              AI
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 relative">
          {activeTab === "Live Stream" && (
            <div className="space-y-5">
              <LiveStreamPanel />
              <NetworkHeatmap />
            </div>
          )}
          {activeTab === "Analysis" && <AnalysisPanel />}
          {activeTab === "Network Graph" && (
            <div className="h-[calc(100vh-148px)]">
              <NetworkGraph />
            </div>
          )}
          {activeTab === "Forensics" && <ForensicsPanel />}
          {activeTab === "Firewall Rules" && <div className="max-w-3xl"><FirewallRulesPanel /></div>}
          {activeTab === "ML Performance" && <MLPerformancePanel />}
          {activeTab === "Attack Replay" && <AttackReplayPanel />}
          {activeTab === "Architecture" && (
            <div className="h-[calc(100vh-148px)]">
              <ArchitectureView />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
