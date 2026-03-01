import React, { useMemo } from 'react';
import { usePackets } from "../context/PacketContext";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '../utils/cn';

export const RiskGauge: React.FC = () => {
    const { packets, alerts } = usePackets();

    const riskScore = useMemo(() => {
        if (packets.length === 0) return 0;
        
        const recent = packets.slice(0, 50);
        
        // 1. Anomaly Component (60%)
        // specific anomaly scores are better to use if available, but ratio works for now
        const anomalyCount = recent.filter(p => p.is_anomaly).length;
        const anomalyScore = (anomalyCount / recent.length) * 100;

        // 2. Severity Component (30%)
        const recentAlerts = alerts.slice(0, 20); // check last 20 alerts
        let severityScore = 0;
        if (recentAlerts.length > 0) {
            const weights: Record<string, number> = { "CRITICAL": 100, "HIGH": 70, "MEDIUM": 40, "LOW": 10, "NONE": 0 };
            const weightedSum = recentAlerts.reduce((sum, a) => sum + (weights[a.severity] || 0), 0);
            severityScore = Math.min(weightedSum / Math.min(recentAlerts.length, 5), 100); // Normalize based on density
        }

        // 3. Historical Repetition (10%)
        // If we have many alerts over time, risk is higher
        const historyScore = Math.min(alerts.length, 100);

        // Composite Formula
        // Risk = (ML * 0.6) + (Severity * 0.3) + (History * 0.1)
        const totalRisk = (anomalyScore * 0.6) + (severityScore * 0.3) + (historyScore * 0.1);

        return Math.min(Math.round(totalRisk), 100);
    }, [packets, alerts]);

    const data = [
        { value: riskScore },
        { value: 100 - riskScore }
    ];

    const color = riskScore < 30 ? "#22c55e" : riskScore < 70 ? "#eab308" : "#ef4444";

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-card/50 rounded-lg border border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Threat Level</h3>
            <div className="relative h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="score" fill={color} />
                            <Cell key="rest" fill="hsl(var(--muted))" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <div className="text-center">
                         <span className={cn("text-3xl font-bold", 
                            riskScore < 30 ? "text-green-500" : riskScore < 70 ? "text-yellow-500" : "text-red-500"
                        )}>
                            {riskScore}
                        </span>
                        <span className="text-xs text-muted-foreground block">/ 100</span>
                    </div>
                </div>
            </div>
            <div className="mt-2 text-xs text-center font-medium">
                {riskScore < 30 ? "System Secure" : riskScore < 70 ? "Elevated Risk" : "CRITICAL THREAT"}
            </div>
        </div>
    );
};
