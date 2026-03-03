import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, MinusCircle, Shield, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';

/* ─── Data ───────────────────────────────────────────────────── */

const categories = [
  {
    group: 'Detection Method',
    rows: [
      { feature: 'Threat detection approach', aegisnet: 'ML Anomaly Score (Isolation Forest)', av: 'Signature Pattern Matching', ids: 'Rule-based / Signature' },
      { feature: 'Zero-day attack detection', aegisnet: true, av: false, ids: false },
      { feature: 'Real-time packet scoring', aegisnet: true, av: false, ids: true },
      { feature: 'Adapts to your traffic baseline', aegisnet: true, av: false, ids: false },
      { feature: 'Explainable AI (per-alert reasoning)', aegisnet: true, av: false, ids: false },
    ],
  },
  {
    group: 'Coverage',
    rows: [
      { feature: 'Browser traffic monitoring', aegisnet: true, av: true, ids: false },
      { feature: 'Full TCP/UDP connection layer', aegisnet: true, av: false, ids: true },
      { feature: 'MITRE ATT&CK mapping per alert', aegisnet: true, av: false, ids: 'partial' },
      { feature: 'Attack classification (7 types)', aegisnet: true, av: false, ids: 'partial' },
      { feature: 'Network graph visualization', aegisnet: true, av: false, ids: false },
    ],
  },
  {
    group: 'Mitigation',
    rows: [
      { feature: 'Automated IP blocking', aegisnet: true, av: false, ids: false },
      { feature: 'Firewall rule management', aegisnet: true, av: 'partial', ids: false },
      { feature: 'Threat-specific mitigation advice', aegisnet: true, av: 'partial', ids: false },
      { feature: 'One-click forensic analysis', aegisnet: true, av: false, ids: false },
    ],
  },
  {
    group: 'Privacy & Architecture',
    rows: [
      { feature: 'All processing stays local', aegisnet: true, av: 'partial', ids: true },
      { feature: 'No cloud telemetry or data sales', aegisnet: true, av: false, ids: 'partial' },
      { feature: 'Open, auditable ML model', aegisnet: true, av: false, ids: 'partial' },
      { feature: 'Free tier available', aegisnet: true, av: false, ids: false },
    ],
  },
];

type CellValue = boolean | 'partial' | string;

function Cell({ val, highlight }: { val: CellValue; highlight?: boolean }) {
  if (val === true) {
    return (
      <span className={`flex items-center justify-center gap-1 ${highlight ? 'text-primary' : 'text-green-400'}`}>
        <CheckCircle className="w-4 h-4" />
      </span>
    );
  }
  if (val === false) {
    return (
      <span className="flex items-center justify-center">
        <XCircle className="w-4 h-4 text-red-500/60" />
      </span>
    );
  }
  if (val === 'partial') {
    return (
      <span className="flex items-center justify-center">
        <MinusCircle className="w-4 h-4 text-yellow-500/70" />
      </span>
    );
  }
  // String description cell
  return <span className="text-xs text-muted-foreground text-center">{val}</span>;
}

/* ─── Page ───────────────────────────────────────────────────── */

export function ComparePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-28 pb-24 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary mb-6">
            <Shield className="w-3 h-3" /> AegisNet vs The Field
          </div>
          <h1 className="text-4xl font-black mb-4">Why ML-based IDS wins</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Traditional antivirus tools catch known threats. AegisNet catches unknown ones.
            Signature databases are always behind — anomaly detection is always ahead.
          </p>
        </motion.div>

        {/* Table header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/8 overflow-hidden"
        >
          {/* Sticky column headers */}
          <div className="grid grid-cols-4 bg-card border-b border-white/8">
            <div className="p-5 text-sm font-bold text-muted-foreground">Feature</div>
            <div className="p-5 text-center border-l border-white/6">
              <div className="flex items-center justify-center gap-1.5 text-sm font-black text-primary">
                <Shield className="w-4 h-4" /> AegisNet AI
              </div>
            </div>
            <div className="p-5 text-center border-l border-white/6">
              <div className="text-sm font-bold text-muted-foreground">Traditional Antivirus</div>
              <div className="text-xs text-muted-foreground/50">(e.g. Norton, Avast)</div>
            </div>
            <div className="p-5 text-center border-l border-white/6">
              <div className="text-sm font-bold text-muted-foreground">Traditional IDS</div>
              <div className="text-xs text-muted-foreground/50">(e.g. Snort, Suricata)</div>
            </div>
          </div>

          {/* Rows by category */}
          {categories.map((cat, ci) => (
            <div key={ci}>
              {/* Group label */}
              <div className="px-5 py-2 bg-white/2 border-b border-white/6">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{cat.group}</span>
              </div>
              {cat.rows.map((row, ri) => (
                <div
                  key={ri}
                  className="grid grid-cols-4 border-b border-white/5 hover:bg-white/2 transition-colors"
                >
                  <div className="p-4 text-sm text-foreground/80 flex items-center">{row.feature}</div>
                  <div className="p-4 border-l border-white/4 bg-primary/3 flex items-center justify-center">
                    <Cell val={row.aegisnet} highlight />
                  </div>
                  <div className="p-4 border-l border-white/4 flex items-center justify-center">
                    <Cell val={row.av} />
                  </div>
                  <div className="p-4 border-l border-white/4 flex items-center justify-center">
                    <Cell val={row.ids} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground justify-end">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Supported</span>
          <span className="flex items-center gap-1.5"><MinusCircle className="w-3.5 h-3.5 text-yellow-500/70" /> Partial</span>
          <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-500/60" /> Not Supported</span>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">AegisNet brings enterprise-grade threat intelligence to your personal network — no security team required.</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/pricing"
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              See Pricing <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="px-8 py-3 border border-white/10 font-medium rounded-xl hover:bg-white/5 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
