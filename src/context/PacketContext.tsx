import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Packet, Alert, ModelMetrics, MetricSnapshot, ThroughputSnapshot, ReplayScenario, ReplayStep } from "../core/types";
import { TrafficGenerator } from "../core/TrafficGenerator";
import { IsolationForest } from "../core/IsolationForest";
import { AttackType } from "../core/AttackSignatures";
import { computeFeatureImportance } from "../core/FeatureImportance";

// Replay scenarios
export const REPLAY_SCENARIOS: ReplayScenario[] = [
  {
    id: "dos-flood",
    name: "DDoS Flood Attack",
    description: "Simulates a volumetric Denial of Service attack escalating over time.",
    icon: "💥",
    totalDuration: 12000,
    steps: [
      { time: 0, label: "Normal baseline traffic", attackType: "Normal", burstSize: 2, description: "Establishing normal traffic baseline." },
      { time: 3000, label: "Probe phase begins", attackType: "Probe", burstSize: 3, description: "Attacker scanning for open ports and vulnerabilities." },
      { time: 6000, label: "DoS attack initiated", attackType: "DoS", burstSize: 10, description: "High-volume SYN flood overwhelming the target." },
      { time: 9000, label: "Sustained DDoS flood", attackType: "DoS", burstSize: 15, description: "Attack reaches peak intensity. System near capacity." },
      { time: 11500, label: "Attack receding", attackType: "Normal", burstSize: 1, description: "Attacker withdraws after detection." },
    ]
  },
  {
    id: "apt-chain",
    name: "APT Kill Chain",
    description: "Advanced Persistent Threat: Recon → Exploit → Backdoor → Privilege Escalation.",
    icon: "🕵️",
    totalDuration: 16000,
    steps: [
      { time: 0, label: "Initial recon", attackType: "Probe", burstSize: 3, description: "Reconnaissance phase: mapping the network topology." },
      { time: 4000, label: "Exploitation attempt", attackType: "Exploits", burstSize: 5, description: "Weaponized exploit delivered to vulnerable service." },
      { time: 8000, label: "Backdoor installed", attackType: "Backdoor", burstSize: 3, description: "Persistent backdoor established for ongoing access." },
      { time: 12000, label: "Privilege escalation", attackType: "U2R", burstSize: 4, description: "Attacker escalates from user to root privileges." },
      { time: 15000, label: "Exfiltration begins", attackType: "R2L", burstSize: 2, description: "Data exfiltration via encrypted channel." },
    ]
  },
  {
    id: "ransomware",
    name: "Ransomware Campaign",
    description: "R2L credential theft leading to ransomware deployment.",
    icon: "🔒",
    totalDuration: 14000,
    steps: [
      { time: 0, label: "Credential brute force", attackType: "R2L", burstSize: 8, description: "Credential stuffing attack on VPN gateway." },
      { time: 5000, label: "Fuzzing services", attackType: "Fuzzers", burstSize: 4, description: "Fuzzing internal API endpoints for weaknesses." },
      { time: 9000, label: "Ransomware payload", attackType: "Exploits", burstSize: 6, description: "Ransomware payload executed via lateral movement." },
      { time: 12000, label: "DoS to cover tracks", attackType: "DoS", burstSize: 5, description: "DDoS launched to distract security team and cover exfiltration." },
    ]
  }
];

interface PacketContextType {
  packets: Packet[];
  alerts: Alert[];
  metrics: ModelMetrics;
  metricHistory: MetricSnapshot[];
  throughputHistory: ThroughputSnapshot[];
  isMonitoring: boolean;
  toggleMonitoring: () => void;
  selectedAttack: AttackType | null;
  setAttackType: (type: AttackType | null) => void;
  contamination: number;
  setContamination: (val: number) => void;
  selectedAlert: Alert | null;
  setSelectedAlert: (alert: Alert | null) => void;
  totalPacketsProcessed: number;
  isReplaying: boolean;
  currentReplay: ReplayScenario | null;
  replayProgress: number;
  replayStep: ReplayStep | null;
  startReplay: (scenario: ReplayScenario) => void;
  stopReplay: () => void;
  mitigateAlert: (alertId: string) => void;
}

const PacketContext = createContext<PacketContextType | undefined>(undefined);

// Normal baseline feature means for XAI z-score computation
const NORMAL_MEANS = {
  src_bytes: 500,
  dst_bytes: 800,
  duration: 2.0,
  num_connections: 5,
  error_rate: 0.025,
};
const NORMAL_STDEVS = {
  src_bytes: 200,
  dst_bytes: 300,
  duration: 1.0,
  num_connections: 3,
  error_rate: 0.015,
};

export const PacketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedAttack, setAttackType] = useState<AttackType | null>(null);
  const [contamination, setContamination] = useState(0.62);
  const [metrics, setMetrics] = useState<ModelMetrics>({ 
    accuracy: 0.97, precision: 0.95, recall: 0.96, f1: 0.95, 
    falsePositiveRate: 0.014, truePositiveRate: 0.962
  });
  const [metricHistory, setMetricHistory] = useState<MetricSnapshot[]>([]);
  const [throughputHistory, setThroughputHistory] = useState<ThroughputSnapshot[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [totalPacketsProcessed, setTotalPacketsProcessed] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentReplay, setCurrentReplay] = useState<ReplayScenario | null>(null);
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayStep, setReplayStep] = useState<ReplayStep | null>(null);

  const generatorRef = useRef(new TrafficGenerator());
  const forestRef = useRef(new IsolationForest(100, 200));
  const replayTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Pre-train model on mount
  useEffect(() => {
    const trainingData: Packet[] = [];
    for (let i = 0; i < 200; i++) {
      trainingData.push(generatorRef.current.generatePacket("Normal"));
    }
    forestRef.current.train(trainingData);
    
    // Pre-fill with pre-scored packets
    const prefilled = trainingData.slice(-20).map(pkt => {
      const score = forestRef.current.score(pkt);
      return {
        ...pkt,
        anomaly_score: score,
        is_anomaly: score > contamination,
        feature_importance: computeFeatureImportance(pkt, NORMAL_MEANS, NORMAL_STDEVS),
      };
    });
    setPackets(prefilled.reverse());
    setTotalPacketsProcessed(200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-tick packet counter for throughput
  const tickPacketCount = useRef(0);
  const tickThreatCount = useRef(0);

  const processPackets = useCallback((attackOverride?: AttackType | null, burstOverride?: number) => {
    const burstSize = burstOverride 
      ?? (attackOverride && attackOverride !== "Normal" ? 5 : 1);
    
    const newPackets: Packet[] = [];
    
    for (let i = 0; i < burstSize; i++) {
      const pkt = generatorRef.current.generatePacket(attackOverride || undefined);
      const score = forestRef.current.score(pkt);
      pkt.anomaly_score = score;
      pkt.is_anomaly = score > contamination;
      pkt.feature_importance = computeFeatureImportance(pkt, NORMAL_MEANS, NORMAL_STDEVS);

      tickPacketCount.current += 1;

      if (pkt.is_anomaly) {
        tickThreatCount.current += 1;
        const alert: Alert = {
          id: `alert-${pkt.id}`,
          packetId: pkt.id,
          timestamp: pkt.timestamp,
          type: pkt.attack_type,
          severity: pkt.severity,
          score: score,
          src_ip: pkt.src_ip,
          dst_ip: pkt.dst_ip,
          mitigated: false,
        };
        setAlerts(prev => [alert, ...prev].slice(0, 200));
      }
      newPackets.push(pkt);
    }

    setPackets(prev => [...newPackets, ...prev].slice(0, 500));
    setTotalPacketsProcessed(prev => prev + burstSize);
    
    setMetrics(prev => {
      const drift = (Math.random() - 0.5) * 0.003;
      const fprDrift = (Math.random() - 0.5) * 0.002;
      const newAcc = Math.min(0.99, Math.max(0.95, prev.accuracy + drift));
      const newRec = Math.min(0.99, Math.max(0.94, prev.recall + drift));
      return { 
        accuracy: newAcc,
        precision: Math.min(0.98, Math.max(0.92, prev.precision + drift)), 
        recall: newRec,
        f1: Math.min(0.98, Math.max(0.93, prev.f1 + drift)),
        falsePositiveRate: Math.min(0.05, Math.max(0.005, prev.falsePositiveRate + fprDrift)),
        truePositiveRate: newRec,
      }; 
    });
  }, [contamination]);

  // Main simulation loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let throughputInterval: ReturnType<typeof setInterval>;

    if (isMonitoring) {
      interval = setInterval(() => {
        if (!isReplaying) {
          processPackets(selectedAttack);
        }
      }, 500);

      // Throughput sampling every 2 seconds
      throughputInterval = setInterval(() => {
        const pps = Math.round(tickPacketCount.current / 2);
        const threats = tickThreatCount.current;
        tickPacketCount.current = 0;
        tickThreatCount.current = 0;
        
        setThroughputHistory(prev => [
          ...prev, 
          { timestamp: Date.now(), pps, threats }
        ].slice(-60));

        setMetrics(curr => {
          setMetricHistory(prev => [
            ...prev,
            { timestamp: Date.now(), accuracy: curr.accuracy, precision: curr.precision, recall: curr.recall, f1: curr.f1, anomalyScore: curr.truePositiveRate }
          ].slice(-60));
          return curr;
        });
      }, 2000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(throughputInterval);
    };
  }, [isMonitoring, selectedAttack, isReplaying, processPackets]);

  const toggleMonitoring = () => setIsMonitoring(!isMonitoring);

  const startReplay = useCallback((scenario: ReplayScenario) => {
    setIsReplaying(true);
    setCurrentReplay(scenario);
    setReplayProgress(0);
    setReplayStep(scenario.steps[0]);

    // Clear old timeouts
    replayTimeoutsRef.current.forEach(clearTimeout);
    replayTimeoutsRef.current = [];
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);

    // Schedule each step
    scenario.steps.forEach((step, idx) => {
      const id = setTimeout(() => {
        setReplayStep(step);
        setReplayProgress((idx / (scenario.steps.length - 1)) * 100);

        // Fire packets for this step
        const burstInterval = setInterval(() => {
          processPackets(step.attackType, step.burstSize);
        }, 600);
        
        // Stop this step's interval when next step begins (or at end)
        const nextStepTime = scenario.steps[idx + 1]?.time;
        if (nextStepTime !== undefined) {
          const clearId = setTimeout(() => clearInterval(burstInterval), nextStepTime - step.time - 100);
          replayTimeoutsRef.current.push(clearId);
        } else {
          // Last step - end replay
          const endId = setTimeout(() => {
            clearInterval(burstInterval);
            setIsReplaying(false);
            setCurrentReplay(null);
            setReplayProgress(100);
            setReplayStep(null);
          }, 2500);
          replayTimeoutsRef.current.push(endId);
        }
      }, step.time);
      replayTimeoutsRef.current.push(id);
    });
  }, [processPackets]);

  const stopReplay = useCallback(() => {
    replayTimeoutsRef.current.forEach(clearTimeout);
    replayTimeoutsRef.current = [];
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    setIsReplaying(false);
    setCurrentReplay(null);
    setReplayProgress(0);
    setReplayStep(null);
  }, []);

  const mitigateAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, mitigated: true } : a));
  }, []);

  return (
    <PacketContext.Provider value={{
      packets,
      alerts,
      metrics,
      metricHistory,
      throughputHistory,
      isMonitoring,
      toggleMonitoring,
      selectedAttack,
      setAttackType,
      contamination,
      setContamination,
      selectedAlert,
      setSelectedAlert,
      totalPacketsProcessed,
      isReplaying,
      currentReplay,
      replayProgress,
      replayStep,
      startReplay,
      stopReplay,
      mitigateAlert,
    }}>
      {children}
    </PacketContext.Provider>
  );
};

export const usePackets = () => {
  const context = useContext(PacketContext);
  if (!context) throw new Error("usePackets must be used within PacketProvider");
  return context;
};
