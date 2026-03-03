import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Cpu, ChevronRight, Download, Chrome } from 'lucide-react';
import { Navbar } from '../components/Navbar';

/* ─── Tier data ──────────────────────────────────────────────── */

const tiers = [
  {
    name: 'Sentinel',
    tagline: 'Free forever',
    price: '$0',
    period: 'No credit card needed',
    color: 'text-cyan-400',
    border: 'border-white/10',
    bg: '',
    icon: Shield,
    description: 'Monitor your network, understand threats, and learn what to do about them.',
    features: [
      'Real-time packet stream monitoring',
      'ML anomaly scoring on every connection',
      'Plain-English threat explanations',
      'Manual mitigation step suggestions',
      'Full Dashboard UI access',
      'Chrome Extension (browser scope)',
      'Attack Replay simulation mode',
    ],
    notIncluded: [
      'Automated firewall blocking',
      'Adaptive AI learning',
      'Priority support',
    ],
    cta: 'Download Free',
    ctaTo: '/demo',
    featured: false,
  },
  {
    name: 'Guardian',
    tagline: 'Most popular',
    price: '$9',
    period: 'per month',
    color: 'text-primary',
    border: 'border-primary/40',
    bg: 'bg-primary/4',
    icon: Zap,
    description: 'Let AegisNet handle the low-level threats so you can focus on the ones that matter.',
    features: [
      'Everything in Sentinel',
      'Automated IP blocking (low-medium severity)',
      'Firewall rule management (netsh / iptables)',
      'Auto-dismissal of low-priority alerts',
      'Rule log with full autonomous action history',
      'Human confirmation for high-severity cases',
      'Priority email support',
    ],
    notIncluded: [
      'Adaptive AI learning',
      'Federated threat intelligence',
    ],
    cta: 'Start Guardian',
    ctaTo: '/demo',
    featured: true,
  },
  {
    name: 'Apex',
    tagline: 'Enterprise-grade AI',
    price: '$24',
    period: 'per month',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/3',
    icon: Cpu,
    description: 'A model that learns your network, adapts to your workflow, and gets smarter every day.',
    features: [
      'Everything in Guardian',
      'Adaptive AI trained on your personal traffic',
      'Whitelist learning from recurring connections',
      'Conversational mitigation UI (AI dialogue)',
      'Bottom-up model fine-tuning per environment',
      'Federated threat pattern updates (opt-in)',
      'Dedicated support + onboarding session',
    ],
    notIncluded: [],
    cta: 'Start Apex',
    ctaTo: '/demo',
    featured: false,
  },
];

/* ─── Tier card ──────────────────────────────────────────────── */

function TierCard({ tier }: { tier: typeof tiers[0] }) {
  const Icon = tier.icon;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-2xl border ${tier.border} ${tier.bg} p-8 flex flex-col gap-6 relative overflow-hidden`}
    >
      {tier.featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      {tier.featured && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className={`text-xs font-bold tracking-widest uppercase ${tier.color}`}>{tier.tagline}</div>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${tier.color}`} />
          </div>
          <h3 className="text-xl font-black">{tier.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-black text-foreground">{tier.price}</span>
        <span className="text-sm text-muted-foreground mb-1">{tier.period}</span>
      </div>

      {/* CTA */}
      <Link
        to={tier.ctaTo}
        className={`py-3 rounded-xl text-sm font-bold text-center transition-colors ${
          tier.featured
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-white/10 text-foreground hover:bg-white/5'
        }`}
      >
        {tier.cta} <ChevronRight className="inline w-3.5 h-3.5" />
      </Link>

      {/* Included features */}
      <div className="flex flex-col gap-2">
        {tier.features.map(f => (
          <div key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.color}`} />
            {f}
          </div>
        ))}
        {tier.notIncluded.map(f => (
          <div key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/40 line-through">
            <Check className="w-4 h-4 mt-0.5 shrink-0 opacity-30" />
            {f}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────── */

const faqs = [
  {
    q: 'Does AegisNet send my traffic data anywhere?',
    a: 'No. All ML inference, packet analysis, and forensics happen locally on your machine. Nothing leaves your device unless you explicitly opt into the federated learning feature in Apex.',
  },
  {
    q: 'Does automatic blocking in Guardian require admin rights?',
    a: 'Yes, firewall modifications require elevated system privileges. On Windows, run the Desktop App as Administrator. On Linux/macOS, use sudo. The Sentinel tier works without any elevated permissions.',
  },
  {
    q: 'How does the adaptive AI in Apex actually work?',
    a: "I train a personalised Isolation Forest on your specific traffic baseline. When you repeatedly approve a flagged connection, its anomaly score contribution drops in your model. Over time it learns the difference between your VPN, your work tools, and genuine threats.",
  },
  {
    q: 'Can I use the Chrome Extension without the Desktop App?',
    a: 'Yes. The Extension works independently and monitors browser-scope HTTP/HTTPS traffic. The Desktop App extends coverage to the full OS TCP/UDP connection layer.',
  },
];

/* ─── Page ───────────────────────────────────────────────────── */

export function PricingPage() {
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
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-black mb-4">
            Start free. Upgrade when
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent"> threats get serious.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sentinel is completely free and always will be. Guardian and Apex unlock automated intelligence when you need it.
          </p>
        </motion.div>

        {/* Tier cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-20"
        >
          {tiers.map(tier => <TierCard key={tier.name} tier={tier} />)}
        </motion.div>

        {/* Distribution options */}
        <div className="rounded-2xl border border-white/8 p-8 mb-20 glass-card">
          <h2 className="text-xl font-black mb-2">Choose your product</h2>
          <p className="text-muted-foreground text-sm mb-6">All tiers work across both the Desktop App and the Chrome Extension.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/6 p-5 flex items-start gap-4 hover:border-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold mb-1">Desktop App</div>
                <div className="text-sm text-muted-foreground">Full OS-level packet capture, firewall integration, and the complete dashboard in a native window. Windows + macOS.</div>
              </div>
            </div>
            <div className="rounded-xl border border-white/6 p-5 flex items-start gap-4 hover:border-cyan-400/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                <Chrome className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-bold mb-1">Chrome Extension</div>
                <div className="text-sm text-muted-foreground">Lightweight browser-scope monitoring. No install beyond the Chrome Web Store. Perfect for Sentinel tier.</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-8 text-center">Frequently asked questions</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {faqs.map(({ q, a }) => (
              <div key={q} className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                <h3 className="font-bold text-foreground">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-black mb-3">Not sure yet?</h2>
          <p className="text-muted-foreground mb-6">Try the full dashboard in simulation mode — no account, no install, no catch.</p>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" /> Open Live Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
