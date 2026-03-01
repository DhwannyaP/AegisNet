import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TermsModal } from './TermsModal';
import { cn } from '../utils/cn';

type AuthMode = 'login' | 'register' | 'verify' | 'forgot';

interface AuthPageProps {
  onAuthenticated: () => void;
}

function FloatingParticle({ delay, duration, x, size }: { delay: number; duration: number; x: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 blur-sm pointer-events-none"
      style={{ width: size, height: size, left: x, bottom: -size }}
      animate={{ y: [0, -window.innerHeight - size * 2], opacity: [0, 0.6, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check if already logged in (demo mode bypass)
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co';

  useEffect(() => {
    if (!isDemoMode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) onAuthenticated();
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);

    if (isDemoMode) {
      // Demo mode: accept any credentials
      setTimeout(() => { setLoading(false); onAuthenticated(); }, 800);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onAuthenticated();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) { setError('You must agree to the Terms & Conditions to create an account.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);

    if (isDemoMode) {
      setTimeout(() => { setLoading(false); setMode('verify'); setSuccessMsg(`Verification email sent to ${email}. (Demo mode — skip to login)`); }, 800);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { terms_agreed_at: new Date().toISOString(), terms_version: '1.0' } }
    });
    setLoading(false);
    if (error) setError(error.message);
    else { setMode('verify'); setSuccessMsg(`Verification email sent to ${email}. Please check your inbox.`); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);

    if (isDemoMode) {
      setTimeout(() => { setLoading(false); setSuccessMsg('Password reset email sent. (Demo mode)'); }, 600);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccessMsg('Password reset email sent. Check your inbox.');
  };

  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.5,
    duration: 8 + (i % 4) * 2,
    x: `${(i * 8.5) % 100}%`,
    size: 4 + (i % 3) * 4,
  }));

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-900/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Terms Modal */}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} onAgree={() => { setAgreedToTerms(true); setShowTerms(false); }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 relative">
            <Activity className="h-8 w-8 text-primary" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-blue-300 to-cyan-400 bg-clip-text text-transparent">AegisNet</span>
            <span className="text-foreground/80"> AI</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Enterprise AI Intrusion Detection Platform</p>
          {isDemoMode && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Demo Mode — any credentials work
            </div>
          )}
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Tab bar */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex border-b border-border">
              {(['login', 'register'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setError(''); setSuccessMsg(''); }}
                  className={cn(
                    "flex-1 py-4 text-sm font-semibold transition-all capitalize",
                    mode === tab
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          <div className="p-8">
            {/* Verify Email */}
            {mode === 'verify' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                <p className="text-muted-foreground text-sm mb-6">{successMsg}</p>
                <button onClick={() => setMode('login')} className="text-primary text-sm hover:underline">
                  Back to Sign In
                </button>
              </motion.div>
            )}

            {/* Login */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertCircle size={13} />{error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <motion.div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />
                  ) : (
                    <><Shield size={16} /> Sign In to Dashboard</>
                  )}
                </button>
              </form>
            )}

            {/* Register */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters"
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <input
                    type="checkbox" id="terms" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    I have read and agree to the{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-primary hover:underline font-semibold inline-flex items-center gap-1">
                      Terms & Conditions and Privacy Policy <ExternalLink size={11} />
                    </button>
                    {' '}of AegisNet AI, including the Acceptable Use Policy for network monitoring tools.
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertCircle size={13} />{error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading || !agreedToTerms}
                  className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <motion.div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />
                  ) : (
                    <><User size={16} /> Create Account <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            )}

            {/* Forgot Password */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Reset Password</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send a reset link.</p>
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                    className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                </div>
                {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}
                {successMsg && <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs"><CheckCircle size={13} />{successMsg}</div>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                  {loading ? <motion.div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7 }} /> : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by AegisNet AI Security · v2.0
        </p>
      </div>
    </div>
  );
};
