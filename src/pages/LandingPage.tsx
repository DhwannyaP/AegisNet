import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Brain, Download, ChevronRight,
  Activity, Globe, Lock, BarChart3, AlertTriangle, Cpu
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useEffect, useRef, useState } from 'react';

/* ─── Mini Live Simulation Strip ─────────────────────────────────── */

const ATTACK_TYPES = ['Normal', 'Normal', 'Normal', 'DoS', 'Probe', 'Normal', 'R2L', 'Normal', 'Normal', 'U2R'];
const HOSTS = ['api.github.com', 'cdn.tailwindcss.com', '185.220.10.44', 'dns.google', '192.168.1.2', 'evil-host.xyz', 'npm.io'];

function randomBetween(a: number, b: number) { return Math.floor(Math.random() * (b - a) + a); }
function randomItem<T>(arr: T[]): T { return arr[randomBetween(0, arr.length)]; }

interface LiveRow {
  id: number; host: string; method: string; status: number;
  bytes: number; attack: string; time: string;
}

function LiveSimStrip() {
  const [rows, setRows] = useState<LiveRow[]>([]);
  const counterRef = useRef(1);

  useEffect(() => {
    const generate = (): LiveRow => ({
      id: counterRef.current++,
      host: randomItem(HOSTS),
      method: randomItem(['GET', 'POST', 'GET', 'GET', 'POST']),
      status: randomItem([200, 200, 200, 404, 403, 200, 301]),
      bytes: randomBetween(120, 9800),
      attack: randomItem(ATTACK_TYPES),
      time: new Date().toISOString().slice(11, 19),
    });

    // Seed first 6 rows
    setRows(Array.from({ length: 6 }, generate));

    const interval = setInterval(() => {
      setRows(prev => [generate(), ...prev].slice(0, 8));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const severityColor = (attack: string) => {
    if (attack === 'Normal') return 'text-green-400';
    if (attack === 'DoS') return 'text-red-400';
    if (attack === 'Probe') return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/8 bg-card/60 backdrop-blur-sm font-mono text-xs">
      {/* terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 bg-white/2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <span className="ml-3 text-muted-foreground/60 text-[10px] tracking-widest uppercase">AegisNet Live Monitor — Simulation</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-[10px]">LIVE</span>
        </div>
      </div>

      {/* column headers */}
      <div className="grid grid-cols-6 px-4 py-1.5 text-[10px] text-muted-foreground/50 uppercase tracking-wider border-b border-white/4">
        <span>Time</span>
        <span className="col-span-2">Destination</span>
        <span>Method</span>
        <span>Bytes</span>
        <span>Classification</span>
      </div>

      {/* rows */}
      <div className="divide-y divide-white/4">
        {rows.map((row, i) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className={`grid grid-cols-6 px-4 py-2 items-center ${i === 0 ? 'bg-primary/5' : ''}`}
          >
            <span className="text-muted-foreground/50">{row.time}</span>
            <span className="col-span-2 text-foreground/80 truncate">{row.host}</span>
            <span className="text-cyan-400/80">{row.method}</span>
            <span className="text-muted-foreground">{(row.bytes / 1000).toFixed(1)}kb</span>
            <span className={`font-semibold ${severityColor(row.attack)}`}>{row.attack}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animated counter ────────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 60;
    const tick = () => {
      frame++;
      setVal(Math.round((frame / total) * target));
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

/* ─── Feature card ────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, title: string, desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-6 flex flex-col gap-3 hover:border-primary/20 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ─── Product card ────────────────────────────────────────────────── */
function ProductCard({
  tag, title, desc, features, cta, ctaTo, accent, featured
}: {
  tag: string; title: string; desc: string; features: string[];
  cta: string; ctaTo: string; accent: string; featured?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      className={`rounded-2xl border p-8 flex flex-col gap-5 relative overflow-hidden ${
        featured ? 'border-primary/40 bg-primary/5' : 'glass-card'
      }`}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
          Recommended
        </div>
      )}
      <div className={`text-xs font-bold tracking-widest uppercase ${accent}`}>{tag}</div>
      <div>
        <h3 className="text-2xl font-black">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{desc}</p>
      </div>
      <ul className="flex flex-col gap-2 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="mt-0.5 text-green-400">+</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={ctaTo}
        className={`text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          featured
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-white/10 hover:bg-white/5 text-foreground'
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  );
}

/* ─── Main Landing Page ───────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                AI-Powered Intrusion Detection
              </div>

              <h1 className="text-5xl font-black leading-tight tracking-tight">
                Network security
                <span className="block bg-gradient-to-r from-primary via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                  that learns you.
                </span>
              </h1>

              <p className="text-muted-foreground text-lg leading-relaxed">
                AegisNet AI monitors your real network traffic in real time, scores every packet with an Isolation Forest ML model,
                and adapts to your personal usage patterns over time — so alerts matter when they arrive.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  to="/pricing"
                  className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  Get Started <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/demo"
                  className="px-6 py-3 border border-white/10 text-foreground font-medium rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-primary" /> Try Demo
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-4 border-t border-white/6">
                {[
                  { value: 98, suffix: '%', label: 'Detection Rate' },
                  { value: 15, suffix: 'ms', label: 'Avg Inference' },
                  { value: 7, suffix: ' types', label: 'Attack Coverage' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-black text-primary">
                      <Counter target={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: live sim */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Live Packet Monitor — running in your browser</span>
                <Link to="/demo" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Full Dashboard <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <LiveSimStrip />
              <p className="text-xs text-muted-foreground/50 text-center">
                Simulated traffic for demonstration purposes. The Desktop App connects to real local packets.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-3">Built for the real threat landscape</h2>
            <p className="text-muted-foreground">Not just a port scanner. AegisNet is a full intelligence layer on top of your network.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Brain} title="ML Anomaly Engine" desc="Isolation Forest model trained on NSL-KDD scores every connection in under 15ms. No signatures, no rules — pure statistical deviation." />
            <FeatureCard icon={Zap} title="Real-Time Capture" desc="Reads directly from the OS connection table (netstat/ss) 600ms. Sees every active TCP/UDP connection as it opens." />
            <FeatureCard icon={AlertTriangle} title="Attack Classification" desc="Classifies packets into 7 attack categories: DoS, Probe, R2L, U2R, Fuzzers, Backdoors, Exploits — with per-packet MITRE ATT&CK mapping." />
            <FeatureCard icon={Lock} title="Automated Mitigation" desc="One-click firewall blocking via native OS APIs (netsh on Windows, iptables on Linux) directly from the dashboard." />
            <FeatureCard icon={BarChart3} title="XAI Forensics" desc="Explainable AI per alert — see exactly which features drove the anomaly score for every flagged packet." />
            <FeatureCard icon={Cpu} title="Adaptive AI (Tier 3)" desc="The model learns from your personal traffic over time, reducing false positives and improving accuracy for your specific environment." />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-3">Three ways to protect your network</h2>
            <p className="text-muted-foreground">From zero-install browser tracking to a full enterprise desktop IDS — pick what fits you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <ProductCard
              tag="Lightweight"
              title="Browser Extension"
              desc="Captures HTTP/HTTPS browser traffic metadata. No install needed beyond the Chrome store."
              features={[
                'Monitors browser network requests',
                'URL-based threat heuristics',
                'Native Chrome notifications',
                'Connects to the dashboard',
                'Zero system permissions needed',
              ]}
              cta="Install Extension"
              ctaTo="/pricing"
              accent="text-cyan-400"
            />
            <ProductCard
              tag="Professional"
              title="Desktop App"
              desc="The full AegisNet AI platform as a native desktop application. No Node.js, no terminal."
              features={[
                'Full AI Dashboard + Live Monitor',
                'Real TCP/UDP connection capture',
                'Automated firewall mitigation',
                'Attack Replay & Forensics Panel',
                'Adaptive AI (Apex tier)',
              ]}
              cta="Download Desktop App"
              ctaTo="/pricing"
              accent="text-primary"
              featured
            />
            <ProductCard
              tag="Free"
              title="Web Demo"
              desc="Try the full dashboard UI in simulation mode — no account, no install, right in your browser."
              features={[
                'Full dashboard UI access',
                'Simulated live traffic stream',
                'ML scoring & forensics',
                'Network graph visualization',
                'No data stored or transmitted',
              ]}
              cta="Open Live Demo"
              ctaTo="/demo"
              accent="text-green-400"
            />
          </div>
        </div>
      </section>

      {/* Comparison teaser */}
      <section className="py-24 px-6 border-t border-white/6 bg-primary/3">
        <div className="max-w-4xl mx-auto text-center flex flex-col gap-6 items-center">
          <Globe className="w-10 h-10 text-primary/60" />
          <h2 className="text-3xl font-black">How does AegisNet compare to a traditional antivirus?</h2>
          <p className="text-muted-foreground">Signature databases can't catch zero-days. ML anomaly detection can. We ran the numbers.</p>
          <Link
            to="/compare"
            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> See the Full Comparison
          </Link>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center"
          >
            <Download className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-black">
            Ready to <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">take control</span>?
          </h2>
          <p className="text-muted-foreground text-lg">Start free, upgrade when you need automated mitigation.</p>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
              View Pricing
            </Link>
            <Link to="/demo" className="px-8 py-3 border border-white/10 font-medium rounded-xl hover:bg-white/5 transition-colors">
              Try Demo First
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary/60" />
            <span className="font-bold text-foreground/70">AegisNet AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/compare" className="hover:text-foreground transition-colors">Compare</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/demo" className="hover:text-foreground transition-colors">Demo</Link>
          </div>
          <span>Built by Dhwannya — {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
