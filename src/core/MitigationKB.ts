import { AttackType } from "./AttackSignatures";

export interface MitigationStep {
    id: string;
    action: string;
    command?: string; // CLI command
    description: string;
}

export interface MitigationStrategy {
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    steps: MitigationStep[];
}

export const MITIGATION_KB: Record<AttackType, MitigationStrategy> = {
    "DoS": {
        severity: "CRITICAL",
        steps: [
            {
                id: "dos-01",
                action: "Block Source IP",
                command: "iptables -A INPUT -s {src_ip} -j DROP",
                description: "Immediately drop all packets from the offending source IP."
            },
            {
                id: "dos-02",
                action: "Rate Limit Incoming Connections",
                command: "iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT",
                description: "Throttle connection requests to prevent resource exhaustion."
            },
            {
                id: "dos-03",
                action: "Enable SYN Cookies",
                command: "sysctl -w net.ipv4.tcp_syncookies=1",
                description: "Protect against SYN flood attacks by validating connection attempts."
            }
        ]
    },
    "Probe": {
        severity: "MEDIUM",
        steps: [
            {
                id: "prb-01",
                action: "Block Source IP",
                command: "ufw deny from {src_ip} to any",
                description: "Prevent further scanning from this IP."
            },
            {
                id: "prb-02",
                action: "Close Unused Ports",
                description: "Review open ports and close any that are not required for business logic."
            }
        ]
    },
    "Exploits": {
        severity: "HIGH",
        steps: [
            {
                id: "exp-01",
                action: "Patch Vulnerable Service",
                command: "apt-get update && apt-get upgrade",
                description: "Ensure all services are running the latest security patches."
            },
            {
                id: "exp-02",
                action: "Isolate Segment",
                description: "Move the targeted server to a quarantined VLAN."
            }
        ]
    },
    "R2L": {
        severity: "HIGH",
        steps: [
            {
                id: "r2l-01",
                action: "Force Password Reset",
                description: "Require immediate password change for the compromised account."
            },
            {
                id: "r2l-02",
                action: "Enable MFA",
                description: "Enforce Multi-Factor Authentication for all remote access."
            }
        ]
    },
    "U2R": {
        severity: "CRITICAL",
        steps: [
            {
                id: "u2r-01",
                action: "Kill User Process",
                command: "pkill -KILL -u {user}",
                description: "Terminate all processes owned by the suspicious user."
            },
            {
                id: "u2r-02",
                action: "Audit Sudo Logs",
                command: "cat /var/log/auth.log | grep sudo",
                description: "Review recent privilege escalation attempts."
            }
        ]
    },
    "Fuzzers": {
        severity: "MEDIUM",
        steps: [
            {
                id: "fuz-01",
                action: "Input Validation",
                description: "Check application logs for crash dumps and improve input sanitization."
            }
        ]
    },
    "Backdoor": {
        severity: "CRITICAL",
        steps: [
            {
                id: "bdr-01",
                action: "Quarantine Host",
                description: "Disconnect the host from the network immediately."
            },
            {
                id: "bdr-02",
                action: "Scan for Web Shells",
                command: "find /var/www -name '*.php' -type f -print0 | xargs -0 grep -l 'shell_exec'",
                description: "Search for common backdoor signatures in web directories."
            }
        ]
    },
    "Normal": {
        severity: "LOW",
        steps: []
    }
};
