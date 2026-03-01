import { AttackType } from "./AttackSignatures";

export interface ThreatIntel {
  country: string;
  countryCode: string;
  flag: string;
  asn: string;
  org: string;
  abuseScore: number;
  reputation: "Malicious" | "Suspicious" | "Unknown" | "Clean";
  tags: string[];
  firstSeen: string;
  lastSeen: string;
  knownCampaigns: string[];
  cveRefs: string[];
  mitreAttack: {
    tactic: string;
    technique: string;
    id: string;
  }[];
}

const COUNTRY_POOLS: Record<string, { flag: string; org: string }> = {
  RU: { flag: "🇷🇺", org: "Rostelecom AS12389" },
  CN: { flag: "🇨🇳", org: "China Telecom AS4134" },
  KP: { flag: "🇰🇵", org: "Star Joint Venture AS131279" },
  IR: { flag: "🇮🇷", org: "Shatel AS31549" },
  BR: { flag: "🇧🇷", org: "Claro NXT AS28573" },
  NG: { flag: "🇳🇬", org: "MTN Nigeria AS36873" },
  US: { flag: "🇺🇸", org: "Cloudflare AS13335" },
  UA: { flag: "🇺🇦", org: "Kyivstar AS15895" },
  DE: { flag: "🇩🇪", org: "Deutsche Telekom AS3320" },
};

const ATTACK_MITRE_MAP: Record<AttackType, { tactic: string; technique: string; id: string }[]> = {
  DoS: [
    { tactic: "Impact", technique: "Network Denial of Service", id: "T1498" },
    { tactic: "Impact", technique: "Endpoint Denial of Service", id: "T1499" },
  ],
  Probe: [
    { tactic: "Reconnaissance", technique: "Active Scanning", id: "T1595" },
    { tactic: "Discovery", technique: "Network Service Discovery", id: "T1046" },
  ],
  R2L: [
    { tactic: "Initial Access", technique: "External Remote Services", id: "T1133" },
    { tactic: "Credential Access", technique: "Brute Force", id: "T1110" },
  ],
  U2R: [
    { tactic: "Privilege Escalation", technique: "Exploitation for Privilege Escalation", id: "T1068" },
    { tactic: "Defense Evasion", technique: "Abuse Elevation Control Mechanism", id: "T1548" },
  ],
  Fuzzers: [
    { tactic: "Initial Access", technique: "Exploit Public-Facing Application", id: "T1190" },
    { tactic: "Discovery", technique: "Application Layer Protocol", id: "T1071" },
  ],
  Backdoor: [
    { tactic: "Persistence", technique: "Server Software Component", id: "T1505" },
    { tactic: "Command & Control", technique: "Encrypted Channel", id: "T1573" },
  ],
  Exploits: [
    { tactic: "Execution", technique: "Exploitation for Client Execution", id: "T1203" },
    { tactic: "Initial Access", technique: "Exploit Public-Facing Application", id: "T1190" },
  ],
  Normal: [],
};

const ATTACK_CVE_MAP: Record<AttackType, string[]> = {
  DoS: ["CVE-2023-44487 (HTTP/2 Rapid Reset)", "CVE-2022-26143 (TP-240 reflective amplification)"],
  Probe: ["CVE-2021-44228 (Log4Shell scan)", "CVE-2023-23397 (Outlook probe)"],
  R2L: ["CVE-2023-20198 (Cisco IOS)", "CVE-2022-27510 (Citrix Gateway)"],
  U2R: ["CVE-2023-0386 (Linux kernel OverlayFS)", "CVE-2022-0847 (Dirty Pipe)"],
  Fuzzers: ["CVE-2023-4863 (WebP heap overflow)", "CVE-2022-42475 (Fortinet SSL-VPN)"],
  Backdoor: ["CVE-2021-41773 (Apache path traversal)", "CVE-2023-34362 (MOVEit SQLi)"],
  Exploits: ["CVE-2023-44487 (HTTP/2)", "CVE-2021-26084 (Confluence RCE)"],
  Normal: [],
};

const ATTACK_TAGS: Record<AttackType, string[]> = {
  DoS: ["volumetric", "botnet", "syn-flood", "amplification"],
  Probe: ["scanner", "recon", "port-scan", "fingerprinting"],
  R2L: ["brute-force", "credential-stuffing", "unauthorized-access"],
  U2R: ["privilege-escalation", "lpe", "kernel-exploit"],
  Fuzzers: ["fuzzing", "crash-testing", "input-validation"],
  Backdoor: ["persistence", "c2", "web-shell", "rat"],
  Exploits: ["rce", "0-day", "cve-exploitation", "weaponized"],
  Normal: [],
};

const ATTACK_CAMPAIGNS: Record<AttackType, string[]> = {
  DoS: ["Killnet (2023)", "Anonymous Sudan Campaign"],
  Probe: ["APT28 Recon Op", "Volt Typhoon LOTL"],
  R2L: ["Lazarus Group Credential Harvest", "FIN7 Lateral Movement"],
  U2R: ["NSO Pegasus Chain", "Turla Rootkit Campaign"],
  Fuzzers: ["TeamTNT Cloud Fuzzer", "Scattered Spider API Abuse"],
  Backdoor: ["Sandworm Industroyer2", "Cozy Bear SolarWinds"],
  Exploits: ["BlackCat ALPHV", "Cl0p MOVEit Campaign"],
  Normal: [],
};

export class ThreatIntelService {
  private cache = new Map<string, ThreatIntel>();

  enrich(ip: string, attackType: AttackType): ThreatIntel {
    const cacheKey = `${ip}-${attackType}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Deterministic seeding from IP for consistency
    const seed = ip.split(".").reduce((sum, n) => sum + parseInt(n), 0);
    
    
    let countryCode: string;
    if (attackType === "Normal") {
      // Normal traffic gets US/DE
      countryCode = seed % 2 === 0 ? "US" : "DE";
    } else {
      // Attacks get adversarial countries
      const adversarialPools = ["RU", "CN", "KP", "IR", "BR", "NG", "UA"];
      countryCode = adversarialPools[seed % adversarialPools.length];
    }

    const countryInfo = COUNTRY_POOLS[countryCode] || COUNTRY_POOLS["US"];
    const abuseScore = attackType === "Normal" ? seed % 10 : 40 + (seed % 60);

    const intel: ThreatIntel = {
      country: countryCode,
      countryCode,
      flag: countryInfo.flag,
      asn: `AS${10000 + (seed % 80000)}`,
      org: countryInfo.org,
      abuseScore,
      reputation: attackType === "Normal" ? "Unknown" : abuseScore > 70 ? "Malicious" : "Suspicious",
      tags: ATTACK_TAGS[attackType] || [],
      firstSeen: `${2020 + (seed % 4)}-${String((seed % 12) + 1).padStart(2, "0")}-${String((seed % 28) + 1).padStart(2, "0")}`,
      lastSeen: new Date(Date.now() - (seed % 3600000)).toISOString().split("T")[0],
      knownCampaigns: ATTACK_CAMPAIGNS[attackType] || [],
      cveRefs: ATTACK_CVE_MAP[attackType] || [],
      mitreAttack: ATTACK_MITRE_MAP[attackType] || [],
    };

    this.cache.set(cacheKey, intel);
    return intel;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const threatIntelService = new ThreatIntelService();
