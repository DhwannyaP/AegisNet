import { useState, useEffect } from 'react';
import { PacketProvider } from './context/PacketContext';
import { DashboardLayout } from './components/DashboardLayout';
import { AuthPage } from './pages/AuthPage';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

type AppState = 'loading' | 'auth' | 'dashboard';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6"
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <Activity className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.h1
          className="text-2xl font-black mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="bg-gradient-to-r from-primary via-blue-300 to-cyan-400 bg-clip-text text-transparent">AegisNet AI</span>
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Initializing security platform...
        </motion.p>
        <div className="mt-6 flex items-center justify-center gap-1">
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1, delay }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co';

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, check localStorage for a simple session
      const demoSession = localStorage.getItem('aegisnet_demo_session');
      if (demoSession) {
        setAppState('dashboard');
      } else {
        setAppState('auth');
      }
      return;
    }

    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAppState(session ? 'dashboard' : 'auth');
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAppState(session ? 'dashboard' : 'auth');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthenticated = () => {
    if (isDemoMode) {
      localStorage.setItem('aegisnet_demo_session', 'true');
    }
    setAppState('dashboard');
  };

  const handleSignOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('aegisnet_demo_session');
    } else {
      await supabase.auth.signOut();
    }
    setAppState('auth');
  };

  return (
    <AnimatePresence mode="wait">
      {appState === 'loading' && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoadingScreen />
        </motion.div>
      )}
      {appState === 'auth' && (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AuthPage onAuthenticated={handleAuthenticated} />
        </motion.div>
      )}
      {appState === 'dashboard' && (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen">
          <PacketProvider>
            <DashboardLayout onSignOut={handleSignOut} />
          </PacketProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
