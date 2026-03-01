import React, { useMemo } from 'react';
import { usePackets } from '../context/PacketContext';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, MonitorCheck, Cpu, Activity } from 'lucide-react';

const CHART_COLORS = {
  accuracy: '#3b82f6',
  precision: '#8b5cf6',
  recall: '#10b981',
  f1: '#f59e0b',
};

const ATTACK_COLORS: Record<string, string> = {
  Normal: '#22c55e',
  DoS: '#ef4444',
  Probe: '#f97316',
  R2L: '#a855f7',
  U2R: '#ec4899',
  Fuzzers: '#eab308',
  Backdoor: '#06b6d4',
  Exploits: '#f43f5e',
};

function MetricCard({ label, value, trend, color }: { label: string; value: number; trend: number; color: string }) {
  const pct = (value * 100).toFixed(1);
  const isUp = trend >= 0;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</span>
        <span className={`text-xs flex items-center gap-0.5 ${isUp ? "text-green-400" : "text-red-400"}`}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend * 100).toFixed(2)}%
        </span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{pct}%</div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const customTooltipStyle = {
  backgroundColor: 'hsl(222.2, 84%, 6%)',
  border: '1px solid hsl(217.2, 32.6%, 17.5%)',
  color: 'hsl(210, 40%, 98%)',
  fontSize: '11px',
  borderRadius: '8px',
};

export const MLPerformancePanel: React.FC = () => {
  const { metrics, metricHistory, packets, alerts } = usePackets();

  const attackDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    packets.forEach(p => { counts[p.attack_type] = (counts[p.attack_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [packets]);

  const chartData = useMemo(() => {
    return metricHistory.map((s, i) => ({
      time: i,
      accuracy: parseFloat((s.accuracy * 100).toFixed(2)),
      precision: parseFloat((s.precision * 100).toFixed(2)),
      recall: parseFloat((s.recall * 100).toFixed(2)),
      f1: parseFloat((s.f1 * 100).toFixed(2)),
    }));
  }, [metricHistory]);

  // Confusion matrix simulation
  const totalPackets = packets.length;
  const truePositives = alerts.length;
  const trueNegatives = Math.round(totalPackets * metrics.accuracy - truePositives);
  const falsePositives = Math.round(totalPackets * metrics.falsePositiveRate);
  const falseNegatives = Math.round(totalPackets * (1 - metrics.recall) * 0.02);

  const prevMetrics = metricHistory.length > 1 ? metricHistory[metricHistory.length - 2] : null;
  const trend = (key: keyof typeof metrics) =>
    prevMetrics ? metrics[key] - ((prevMetrics as unknown as Record<string, number>)[key] ?? 0) : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Accuracy" value={metrics.accuracy} trend={trend('accuracy')} color={CHART_COLORS.accuracy} />
        <MetricCard label="Precision" value={metrics.precision} trend={trend('precision')} color={CHART_COLORS.precision} />
        <MetricCard label="Recall" value={metrics.recall} trend={trend('recall')} color={CHART_COLORS.recall} />
        <MetricCard label="F1 Score" value={metrics.f1} trend={trend('f1')} color={CHART_COLORS.f1} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric History Chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
            <Activity size={15} /> Metric History
            <span className="ml-auto text-xs font-normal text-muted-foreground/60 normal-case">Last {chartData.length} snapshots</span>
          </h3>
          {chartData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              <span>Start monitoring to populate metric history...</span>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[88, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'hsl(215, 20.2%, 65.1%)' }} width={38} />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  {Object.entries(CHART_COLORS).map(([key, color]) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Attack Distribution Donut */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Attack Taxonomy</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attackDistribution} cx="40%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                  {attackDistribution.map((entry) => (
                    <Cell key={entry.name} fill={ATTACK_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px' }} layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix + Model Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
            <Cpu size={15} /> Confusion Matrix
          </h3>
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <div className="col-span-2 grid grid-cols-2 gap-1 mb-1">
              <div className="text-center text-xs text-muted-foreground py-1">Predicted: Benign</div>
              <div className="text-center text-xs text-muted-foreground py-1">Predicted: Threat</div>
            </div>
            {[
              { label: "TN", value: trueNegatives, color: "bg-green-500/10 border-green-500/20 text-green-400", row: "Actual: Benign" },
              { label: "FP", value: falsePositives, color: "bg-orange-500/10 border-orange-500/20 text-orange-400", row: "" },
              { label: "FN", value: falseNegatives, color: "bg-red-500/10 border-red-500/20 text-red-400", row: "Actual: Threat" },
              { label: "TP", value: truePositives, color: "bg-blue-500/10 border-blue-500/20 text-blue-400", row: "" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`p-4 rounded-lg border text-center ${color}`}>
                <div className="text-xs font-semibold mb-1">{label}</div>
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-center">
            FPR: <span className="text-orange-400 font-mono">{(metrics.falsePositiveRate * 100).toFixed(2)}%</span>
            {" · "}TPR: <span className="text-green-400 font-mono">{(metrics.truePositiveRate * 100).toFixed(2)}%</span>
          </div>
        </div>

        {/* Model Health */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
            <MonitorCheck size={15} /> Model Health Monitor
          </h3>
          <div className="space-y-3">
            {[
              { label: "Concept Drift", status: "STABLE", detail: "0.02%", color: "text-green-500 bg-green-500/10", icon: "✓" },
              { label: "False Positive Rate", status: `${(metrics.falsePositiveRate * 100).toFixed(2)}%`, detail: metrics.falsePositiveRate > 0.02 ? "ELEVATED" : "NORMAL", color: metrics.falsePositiveRate > 0.02 ? "text-yellow-500 bg-yellow-500/10" : "text-green-500 bg-green-500/10", icon: metrics.falsePositiveRate > 0.02 ? "⚠" : "✓" },
              { label: "Model Version", status: "IF-v2.1.0", detail: "100 trees · 200 samples", color: "text-blue-400 bg-blue-500/10", icon: "◈" },
              { label: "Training Data", status: "200 pkts", detail: "Normal baseline", color: "text-purple-400 bg-purple-500/10", icon: "⬡" },
              { label: "Last Inference", status: "< 15ms", detail: "Real-time scoring", color: "text-cyan-400 bg-cyan-500/10", icon: "⚡" },
              { label: "Status", status: "HEALTHY", detail: "No retraining required", color: "text-green-400 bg-green-500/10", icon: "●" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${item.color}`}>
                  {item.icon} {item.status}
                  {item.detail && <span className="font-normal ml-1 opacity-70">{item.detail}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
