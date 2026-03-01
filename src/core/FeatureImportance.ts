import { Packet } from "./types";

interface FeatureMeans {
  src_bytes: number;
  dst_bytes: number;
  duration: number;
  num_connections: number;
  error_rate: number;
}

interface FeatureStdevs {
  src_bytes: number;
  dst_bytes: number;
  duration: number;
  num_connections: number;
  error_rate: number;
}

export interface FeatureImportanceResult {
  feature: string;
  value: number;
  z_score: number;
  deviation_pct: string;
}

export function computeFeatureImportance(
  pkt: Packet,
  means: FeatureMeans,
  stdevs: FeatureStdevs
): FeatureImportanceResult[] {
  const features: { key: keyof FeatureMeans; label: string }[] = [
    { key: "src_bytes", label: "src_bytes" },
    { key: "dst_bytes", label: "dst_bytes" },
    { key: "duration", label: "duration" },
    { key: "num_connections", label: "num_conn" },
    { key: "error_rate", label: "error_rate" },
  ];

  return features.map(({ key, label }) => {
    const val = pkt[key] as number;
    const mean = means[key];
    const std = stdevs[key];
    const z = std > 0 ? (val - mean) / std : 0;
    const devPct = mean > 0 ? ((val - mean) / mean) * 100 : 0;
    const sign = devPct >= 0 ? "+" : "";
    return {
      feature: label,
      value: val,
      z_score: parseFloat(z.toFixed(2)),
      deviation_pct: `${sign}${devPct.toFixed(0)}%`,
    };
  }).sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));
}
