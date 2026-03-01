import React, { useMemo } from 'react';
import { usePackets } from "../context/PacketContext";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';

const ATTACK_COLORS: Record<string, string> = {
  DoS: '#ef4444',
  Probe: '#f97316',
  Exploits: '#f59e0b',
  R2L: '#a855f7',
  U2R: '#ec4899',
  Fuzzers: '#eab308',
  Backdoor: '#06b6d4',
  Normal: '#22c55e',
};

const tooltipStyle = {
  backgroundColor: 'hsl(222.2, 84%, 6%)',
  border: '1px solid hsl(217.2, 32.6%, 17.5%)',
  color: 'hsl(210, 40%, 98%)',
  fontSize: '11px',
  borderRadius: '8px',
};

export const AnalysisPanel: React.FC = () => {
  const { throughputHistory, alerts, packets } = usePackets();

  const throughputData = useMemo(() =>
    throughputHistory.map((s, i) => ({
      time: i,
      pps: s.pps,
      threats: s.threats,
    })),
    [throughputHistory]
  );

  const alertsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts)
      .filter(([k]) => k !== "Normal")
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [alerts]);

  const severityBreakdown = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    alerts.forEach(a => { if (a.severity in counts) counts[a.severity as keyof typeof counts]++; });
    return counts;
  }, [alerts]);

  const anomalyRate = useMemo(() => {
    if (packets.length === 0) return 0;
    return ((packets.filter(p => p.is_anomaly).length / packets.length) * 100).toFixed(1);
  }, [packets]);

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: alerts.length.toLocaleString(), color: "text-red-400", sub: `${anomalyRate}% anomaly rate` },
          { label: "Critical", value: severityBreakdown.CRITICAL.toString(), color: "text-red-500" },
          { label: "High", value: severityBreakdown.HIGH.toString(), color: "text-orange-400" },
          { label: "Active Mitigations", value: alerts.filter(a => a.mitigated).length.toString(), color: "text-green-400", sub: "auto-responded" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
            <span className="text-xs text-muted-foreground uppercase font-semibold">{kpi.label}</span>
            <div className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
            {kpi.sub && <div className="text-xs text-muted-foreground mt-1">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Throughput Area */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Network Throughput (pkts/s)</h3>
          {throughputData.length < 2 ? (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              Start monitoring to see live throughput...
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="ppsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="thrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20.2%, 65.1%)' }} width={30} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="pps" stroke="#3b82f6" fill="url(#ppsGrad)" strokeWidth={2} dot={false} name="Packets/s" />
                  <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="url(#thrGrad)" strokeWidth={2} dot={false} name="Threats" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alerts by Type */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Alert Counts by Type</h3>
          {alertsByType.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              No alerts yet. Start monitoring...
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertsByType} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 20.2%, 65.1%)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215, 20.2%, 65.1%)' }} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {alertsByType.map(entry => (
                      <rect key={entry.name} fill={ATTACK_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Severity Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: "Critical", key: "CRITICAL", color: "bg-red-500", text: "text-red-400" },
            { label: "High", key: "HIGH", color: "bg-orange-500", text: "text-orange-400" },
            { label: "Medium", key: "MEDIUM", color: "bg-yellow-500", text: "text-yellow-400" },
            { label: "Low", key: "LOW", color: "bg-blue-500", text: "text-blue-400" },
          ] as const).map(s => {
            const val = severityBreakdown[s.key];
            const total = Object.values(severityBreakdown).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={s.key} className="text-center">
                <div className={`text-2xl font-black ${s.text}`}>{val}</div>
                <div className="text-xs text-muted-foreground mb-2">{s.label}</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
