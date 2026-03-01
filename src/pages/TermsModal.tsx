import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing, registering for, or using AegisNet AI ("the Platform"), you confirm that you have read, understood, and agree to be bound by these Terms & Conditions ("Terms"). If you do not agree, you may not use the Platform.

These Terms constitute a legally binding agreement between you ("User") and AegisNet AI ("we", "our", "us"). We reserve the right to update these Terms at any time; continued use signifies acceptance of modifications.`
  },
  {
    title: "2. Acceptable Use Policy",
    content: `AegisNet AI is an intrusion detection and network monitoring platform. You acknowledge and agree that:

• You will ONLY monitor networks that you own or have explicit written authorization to monitor.
• You will NOT use this platform to intercept or monitor communications on public or third-party networks without consent.
• You will NOT use the platform for any malicious, unlawful, or unauthorized purposes, including but not limited to unauthorized access to computer systems, network attacks, or data exfiltration.
• You are fully responsible for all actions taken using your account, including any automated mitigation actions (e.g., firewall rule creation).
• Misuse of network monitoring tools is a criminal offense in most jurisdictions under laws including the Computer Fraud and Abuse Act (CFAA, USA), Computer Misuse Act (UK), and equivalent laws in your jurisdiction.`
  },
  {
    title: "3. Data Collection & Privacy",
    content: `When you use AegisNet AI, we may collect:

• Account information: Email address, encrypted password (via Supabase Auth).
• Usage metadata: Login timestamps, session durations, feature usage.
• Network telemetry: Network connection metadata processed locally by the AegisNet Agent on your device. Raw packet contents are NEVER transmitted to our servers.
• T&C agreement records: Timestamp and version of Terms agreed to, stored with your account.

We do not sell your personal data to third parties. Telemetry data is processed locally on your device by the AegisNet Agent and is not stored in the cloud unless explicitly shared by you.`
  },
  {
    title: "4. The AegisNet Agent",
    content: `The AegisNet Agent is a local software component that runs on your device as a privileged process. By installing and running the Agent, you acknowledge:

• The Agent reads active network connection tables (via OS utilities like netstat/ss) to provide real-time monitoring.
• The Agent may execute system-level commands (e.g., Windows Firewall rules via netsh, Linux iptables) when you initiate mitigation actions.
• You are solely responsible for the consequences of any automated mitigation actions taken through the platform.
• The Agent communicates only with localhost (ws://localhost:3001) and the AegisNet dashboard in your browser. No external phone-home traffic is generated.
• You must run the Agent with appropriate administrative privileges and take responsibility for this security decision.`
  },
  {
    title: "5. Intellectual Property",
    content: `All software, algorithms (including the Isolation Forest ML model implementation), user interface designs, and documentation associated with AegisNet AI are proprietary to AegisNet AI and protected by applicable intellectual property laws.

You are granted a limited, non-exclusive, non-transferable license to use the Platform for your authorized network monitoring purposes. You may not copy, modify, reverse-engineer, or redistribute any portion of the Platform without express written permission.`
  },
  {
    title: "6. Disclaimers & Limitation of Liability",
    content: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. AegisNet AI makes no warranty that the Platform will detect all intrusions, prevent all attacks, or operate error-free.

AIGISNET AI SHALL NOT BE LIABLE FOR:
• Any direct, indirect, incidental, or consequential damages arising from use or inability to use the Platform.
• Security breaches, data loss, or unauthorized access that occurs despite use of the Platform.
• Damages resulting from automated mitigation actions (e.g., blocking legitimate traffic).
• Any claims arising from your use of the Platform in violation of these Terms.

OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.`
  },
  {
    title: "7. Termination",
    content: `We reserve the right to suspend or terminate your account at any time if we determine, in our sole discretion, that you have violated these Terms, engaged in fraudulent activity, or pose a threat to other users or the integrity of the Platform.

Upon termination, your right to access the Platform immediately ceases. Sections 2, 5, 6, and 8 shall survive termination.`
  },
  {
    title: "8. Governing Law",
    content: `These Terms and any disputes arising hereunder shall be governed by and construed in accordance with applicable law. You agree to submit to the exclusive jurisdiction of the courts of the applicable jurisdiction for the resolution of any disputes. 

If any provision of these Terms is held to be unenforceable, the remaining provisions shall continue in full force and effect.`
  },
];

function TermsSection({ section, defaultOpen = false }: { section: typeof TERMS_SECTIONS[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-semibold">{section.title}</span>
        {open ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border/30 pt-3">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const TermsModal: React.FC<TermsModalProps> = ({ open, onClose, onAgree }) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-card border border-border w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Terms & Conditions</h2>
                <p className="text-xs text-muted-foreground">AegisNet AI · Version 1.0 · Effective 2025</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Warning banner */}
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg shrink-0">
            <p className="text-xs text-amber-400 font-medium">
              ⚠️ Important: AegisNet AI is a network monitoring tool. You may only use it on networks you own or have explicit authorization to monitor. Unauthorized network monitoring is illegal.
            </p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3" onScroll={handleScroll}>
            {TERMS_SECTIONS.map((s, i) => (
              <TermsSection key={i} section={s} defaultOpen={i === 0} />
            ))}
            <div className="h-4" />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/10 shrink-0">
            {!scrolledToBottom && (
              <p className="text-xs text-muted-foreground text-center mb-3">Scroll to read all terms before agreeing</p>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                Decline
              </button>
              <button
                onClick={onAgree}
                className="flex-1 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                <CheckCircle size={15} /> I Agree to All Terms
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
