export type AttackType = "DoS" | "Probe" | "R2L" | "U2R" | "Fuzzers" | "Backdoor" | "Exploits" | "Normal";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface AttackSignature {
  id: string;
  type: AttackType;
  severity: Severity;
  description: string;
  mitigation: string;
  cliInit: string;
}

export const ATTACK_SIGNATURES: Record<AttackType, AttackSignature> = {
  Normal: {
    id: "norm-00",
    type: "Normal",
    severity: "NONE",
    description: "Standard background traffic.",
    mitigation: "None",
    cliInit: "",
  },
  DoS: {
    id: "dos-01",
    type: "DoS",
    severity: "CRITICAL",
    description: "Denial of Service: Flooding target with high volume of traffic.",
    mitigation: "Rate limit source IP, block traffic from specific subnet.",
    cliInit: "iptables -A INPUT -s {src_ip} -j DROP",
  },
  Probe: {
    id: "prb-02",
    type: "Probe",
    severity: "MEDIUM",
    description: "Probing/Scanning: Discovering vulnerabilities or open ports.",
    mitigation: "Block source IP, enable port scan detection.",
    cliInit: "ufw deny from {src_ip} to any port {dst_port}",
  },
  R2L: {
    id: "r2l-03",
    type: "R2L",
    severity: "HIGH",
    description: "Remote to Local: Unauthorized access from remote machine.",
    mitigation: "Disable exposed service, require MFA.",
    cliInit: "fail2ban-client set sshd banip {src_ip}",
  },
  U2R: {
    id: "u2r-04",
    type: "U2R",
    severity: "CRITICAL",
    description: "User to Root: Local user attempting to gain root privileges.",
    mitigation: "Audit user privileges, patch local exploit.",
    cliInit: "pkill -KILL -u {user}",
  },
  Fuzzers: {
    id: "fuz-05",
    type: "Fuzzers",
    severity: "MEDIUM",
    description: "Fuzzers: Attempting to crash services with random input.",
    mitigation: "Input validation, block source IP.",
    cliInit: "nginx -s reload",
  },
  Backdoor: {
    id: "bdr-06",
    type: "Backdoor",
    severity: "CRITICAL",
    description: "Backdoor: Persistent unauthorized access mechanism.",
    mitigation: "Remove backdoor file, reinstall service.",
    cliInit: "rm -rf /usr/bin/.backdoor",
  },
  Exploits: {
    id: "exp-07",
    type: "Exploits",
    severity: "HIGH",
    description: "Exploits: Taking advantage of a specific vulnerability.",
    mitigation: "Patch vulnerability, update software.",
    cliInit: "apt-get update && apt-get upgrade",
  },
};
