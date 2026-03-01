import { Packet, PacketFeatureVector } from "./types";
import { AttackType, ATTACK_SIGNATURES } from "./AttackSignatures";

const PROTOCOLS = ["TCP", "UDP", "ICMP"] as const;

// Realistic IP pools for simulation
const INTERNAL_IPS = ["192.168.1.50", "192.168.1.51", "10.0.0.10", "172.16.0.100"];
const ATTACKER_IP_POOLS: Record<string, string[]> = {
  DoS: ["185.220.101.45", "91.108.4.1", "194.165.16.77", "45.142.12.99", "103.75.190.1"],
  Probe: ["45.33.32.156", "198.20.69.74", "192.241.236.116", "71.6.135.131", "80.82.77.139"],
  R2L: ["78.46.241.111", "89.248.167.131", "190.2.148.0", "198.23.228.115"],
  U2R: ["10.0.0.254", "192.168.100.5", "172.16.254.1"],
  Fuzzers: ["185.181.102.178", "91.240.118.222", "134.209.24.15"],
  Backdoor: ["45.79.19.196", "139.180.203.104", "165.22.60.157"],
  Exploits: ["45.155.205.233", "185.225.74.80", "51.77.135.89", "178.62.80.172"],
  Normal: [],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function randomFromPool(pool: string[]): string | null {
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function gaussianRandom(mean: number, stdev: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function randomTTL(type: AttackType): number {
  if (type === "DoS") return randomInt(32, 64);  // Spoofed/low TTL
  if (type === "Probe") return randomInt(48, 128);
  return randomInt(64, 128); // Normal
}

export class TrafficGenerator {
  private packetCounter = 0;

  generatePacket(forcedType?: AttackType): Packet {
    this.packetCounter++;
    const type: AttackType = forcedType || this.selectRandomType();
    const signature = ATTACK_SIGNATURES[type];

    let features: PacketFeatureVector;
    let flags: string;
    let protocol = PROTOCOLS[randomInt(0, 2)];

    if (type === "DoS") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(5000, 1500)),
        dst_bytes: Math.max(0, gaussianRandom(100, 50)),
        duration: Math.max(0, gaussianRandom(0.1, 0.05)),
        num_connections: randomInt(50, 200),
        error_rate: Math.random() * 0.3,
      };
      flags = Math.random() > 0.5 ? "S0" : "SYN";
      if (Math.random() > 0.5) protocol = "UDP";
    } else if (type === "Probe") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(40, 10)),
        dst_bytes: 0,
        duration: Math.max(0, gaussianRandom(0.01, 0.005)),
        num_connections: randomInt(1, 5),
        error_rate: 0.8 + Math.random() * 0.2,
      };
      flags = "REJ";
      protocol = "TCP";
    } else if (type === "Normal") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(500, 200)),
        dst_bytes: Math.max(0, gaussianRandom(800, 300)),
        duration: Math.max(0, gaussianRandom(2.0, 1.0)),
        num_connections: randomInt(1, 10),
        error_rate: Math.random() * 0.05,
      };
      flags = "SF";
    } else if (type === "R2L") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(1200, 400)),
        dst_bytes: Math.max(0, gaussianRandom(200, 100)),
        duration: Math.max(0, gaussianRandom(8.0, 3.0)),
        num_connections: randomInt(5, 20),
        error_rate: Math.random() * 0.4,
      };
      flags = "SF";
      protocol = "TCP";
    } else if (type === "U2R") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(300, 100)),
        dst_bytes: Math.max(0, gaussianRandom(150, 50)),
        duration: Math.max(0, gaussianRandom(12.0, 4.0)),
        num_connections: randomInt(1, 5),
        error_rate: Math.random() * 0.1,
      };
      flags = "SF";
      protocol = "TCP";
    } else if (type === "Backdoor") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(800, 200)),
        dst_bytes: Math.max(0, gaussianRandom(400, 100)),
        duration: Math.max(0, gaussianRandom(60.0, 20.0)), // Long-running sessions
        num_connections: randomInt(2, 8),
        error_rate: Math.random() * 0.05,
      };
      flags = "SF";
      protocol = Math.random() > 0.3 ? "TCP" : "UDP";
    } else if (type === "Fuzzers") {
      features = {
        src_bytes: Math.max(0, gaussianRandom(2500, 1000)),
        dst_bytes: Math.max(0, gaussianRandom(50, 30)),
        duration: Math.max(0, gaussianRandom(0.5, 0.2)),
        num_connections: randomInt(10, 40),
        error_rate: 0.3 + Math.random() * 0.5,
      };
      flags = Math.random() > 0.5 ? "S1" : "RSTO";
    } else {
      // Exploits
      features = {
        src_bytes: Math.max(0, gaussianRandom(3000, 800)),
        dst_bytes: Math.max(0, gaussianRandom(500, 200)),
        duration: Math.max(0, gaussianRandom(1.5, 0.8)),
        num_connections: randomInt(1, 10),
        error_rate: Math.random() * 0.15,
      };
      flags = "SF";
      protocol = "TCP";
    }

    // Pick source IP - use known attacker IPs for attacks
    const attackerPool = ATTACKER_IP_POOLS[type];
    const srcFromPool = attackerPool && attackerPool.length > 0 && Math.random() > 0.3
      ? randomFromPool(attackerPool)
      : null;
    const src_ip = srcFromPool || randomIP();

    const dst_ip = INTERNAL_IPS[randomInt(0, INTERNAL_IPS.length - 1)];

    return {
      id: `pkt-${this.packetCounter}-${Date.now()}`,
      timestamp: Date.now(),
      protocol,
      src_ip,
      dst_ip,
      src_port: randomInt(1024, 65535),
      dst_port: type === "Probe" ? randomInt(1, 65535) : randomInt(1, 1024),
      flags,
      ttl: randomTTL(type),
      attack_type: type,
      severity: signature.severity,
      ...features,
    };
  }

  private selectRandomType(): AttackType {
    const roll = Math.random();
    if (roll > 0.06) return "Normal";
    const subRoll = Math.random();
    if (subRoll < 0.35) return "DoS";
    if (subRoll < 0.55) return "Probe";
    if (subRoll < 0.68) return "Exploits";
    if (subRoll < 0.78) return "R2L";
    if (subRoll < 0.85) return "U2R";
    if (subRoll < 0.92) return "Fuzzers";
    return "Backdoor";
  }
}
