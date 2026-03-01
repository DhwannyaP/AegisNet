import React, { useMemo } from 'react';
import { usePackets } from "../context/PacketContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const NetworkHeatmap: React.FC = () => {
    const { packets } = usePackets();

    // Prepare data for the chart: Aggregate packets by timestamp (e.g., last 60 seconds)
    const data = useMemo(() => {
        const buckets: Record<string, { time: string; count: number; anomalies: number }> = {};
        const now = Date.now();
        
        // Initialize buckets for the last 60 seconds to ensure x-axis continuity
        for (let i = 59; i >= 0; i--) {
            const t = new Date(now - i * 1000);
            const key = t.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            buckets[key] = { time: key, count: 0, anomalies: 0 };
        }

        packets.forEach(pkt => {
            const t = new Date(pkt.timestamp);
            const key = t.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (buckets[key]) {
                buckets[key].count++;
                if (pkt.is_anomaly) buckets[key].anomalies++;
            }
        });

        return Object.values(buckets).slice(-60); // Last 60 seconds
    }, [packets]);

    return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Traffic Volume (Last 60s)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                            interval={5}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                            stroke="hsl(var(--border))"
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                color: 'hsl(var(--popover-foreground))',
                                fontSize: '12px'
                            }}
                            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        />
                        <Bar dataKey="count" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                           {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.anomalies > 5 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                           ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
