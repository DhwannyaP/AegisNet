import { AttackType, Severity } from "./AttackSignatures";

export interface PacketFeatureVector {
  src_bytes: number;
  dst_bytes: number;
  duration: number;
  num_connections: number;
  error_rate: number;
}

export interface Packet extends PacketFeatureVector {
  id: string;
  timestamp: number;
  protocol: "TCP" | "UDP" | "ICMP";
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  flags: string;
  ttl: number;
  
  // Labeling (Ground Truth for simulation)
  attack_type: AttackType;
  severity: Severity;
  
  // Model Output
  anomaly_score?: number;
  is_anomaly?: boolean;

  // Feature Importance (XAI)
  feature_importance?: FeatureImportance[];
}

export interface FeatureImportance {
  feature: string;
  value: number;
  z_score: number;
  deviation_pct: string;
}

export interface Alert {
  id: string;
  packetId: string;
  timestamp: number;
  type: AttackType;
  severity: Severity;
  score: number;
  src_ip: string;
  dst_ip: string;
  mitigated?: boolean;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  falsePositiveRate: number;
  truePositiveRate: number;
}

export interface MetricSnapshot {
  timestamp: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  anomalyScore: number;
}

export interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    group: number; // 1: Normal, 2: Attacker
    val: number; // radius based on volume
    ip: string;
    attackType?: AttackType;
    packetCount: number;
    threatCount: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    value: number; // thickness based on packet count
    protocol: "TCP" | "UDP" | "ICMP";
    isAttack: boolean;
}

export interface GraphParticle {
    id: number;
    link: GraphLink;
    progress: number; // 0 to 1
    speed: number;
    type: "normal" | "attack";
}

export interface ThroughputSnapshot {
  timestamp: number;
  pps: number; // packets per second
  threats: number;
}

export interface ReplayScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: ReplayStep[];
  totalDuration: number; // ms
}

export interface ReplayStep {
  time: number; // ms offset
  label: string;
  attackType: AttackType;
  burstSize: number;
  description: string;
}
