import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, ChevronRight, Clock, AlertTriangle, Shield, Crosshair, Zap } from 'lucide-react';
import { usePackets, REPLAY_SCENARIOS } from '../context/PacketContext';
import { ReplayScenario } from '../core/types';
import { cn } from '../utils/cn';

const ATTACK_COLORS: Record<string, string> = {
  Normal: "text-green-400",
  DoS: "text-red-400",
  Probe: "text-orange-400",
  Exploits: "text-yellow-400",
  Backdoor: "text-cyan-400",
  U2R: "text-pink-400",
  R2L: "text-purple-400",
  Fuzzers: "text-amber-400",
};

function ScenarioCard({ scenario, onStart, isActive, isReplaying }: {
  scenario: ReplayScenario;
  onStart: () => void;
  isActive: boolean;
  isReplaying: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "bg-card border rounded-xl p-5 cursor-pointer transition-all",
        isActive ? "border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`text-3xl`}>{scenario.icon}</div>
          <div>
            <h3 className="font-bold text-sm">{scenario.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{scenario.description}</p>
          </div>
        </div>
        <button
          onClick={onStart}
          disabled={isReplaying && !isActive}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0",
            isActive
              ? "bg-red-500 text-white hover:bg-red-600"
              : isReplaying
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isActive ? <><Square size={11} /> Stop</> : <><Play size={11} /> Launch</>}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Clock size={11} /> {scenario.totalDuration / 1000}s</span>
        <span className="flex items-center gap-1"><Crosshair size={11} /> {scenario.steps.length} phases</span>
      </div>

      {/* Timeline */}
      <div className="space-y-1.5">
        {scenario.steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", ATTACK_COLORS[step.attackType] || "text-muted-foreground")} style={{ backgroundColor: "currentColor" }} />
            <span className="text-muted-foreground font-mono w-10 shrink-0">{(step.time / 1000).toFixed(0)}s</span>
            <span className={cn("font-medium", ATTACK_COLORS[step.attackType])}>{step.attackType}</span>
            <span className="text-muted-foreground truncate">{step.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export const AttackReplayPanel: React.FC = () => {
  const { isReplaying, currentReplay, replayProgress, replayStep, startReplay, stopReplay, isMonitoring, toggleMonitoring } = usePackets();
  const [, setSelectedScenario] = useState<ReplayScenario | null>(null);

  const handleStart = (scenario: ReplayScenario) => {
    if (isReplaying && currentReplay?.id === scenario.id) {
      stopReplay();
      return;
    }
    if (!isMonitoring) toggleMonitoring();
    setSelectedScenario(scenario);
    startReplay(scenario);
  };

  return (
    <div className="space-y-6">
      {/* Active Replay Banner */}
      <AnimatePresence>
        {isReplaying && currentReplay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="text-xl">{currentReplay.icon}</span>
                    {currentReplay.name}
                    <span className="text-xs font-normal text-muted-foreground">(LIVE SIMULATION)</span>
                  </h3>
                  {replayStep && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className={cn("font-bold", ATTACK_COLORS[replayStep.attackType])}>{replayStep.attackType}</span>
                      {" — "}{replayStep.description}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={stopReplay} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all">
                <Square size={11} /> Stop
              </button>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{replayProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                  animate={{ width: `${replayProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Phase Indicators */}
            <div className="flex items-center gap-1 mt-3 flex-wrap">
              {currentReplay.steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    replayStep?.time === step.time ? "bg-red-500 text-white" : "bg-muted/50 text-muted-foreground"
                  )}>
                    {step.attackType}
                  </div>
                  {idx < currentReplay.steps.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-primary" size={20} /> Attack Replay Mode
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Launch pre-configured multi-stage attack scenarios to test detection capabilities.
          </p>
        </div>
        {!isMonitoring && (
          <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg">
            <AlertTriangle size={14} /> Monitoring is OFF — launching a scenario will auto-start it.
          </div>
        )}
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {REPLAY_SCENARIOS.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onStart={() => handleStart(scenario)}
            isActive={isReplaying && currentReplay?.id === scenario.id}
            isReplaying={isReplaying}
          />
        ))}
      </div>

      {/* Info section */}
      <div className="bg-card/50 border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase">
          <Shield size={14} /> How Attack Replay Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          {[
            { icon: "1", title: "Multi-Phase Simulation", desc: "Each scenario runs through realistic attack kill-chain phases, escalating in severity over time." },
            { icon: "2", title: "Live Detection", desc: "The Isolation Forest ML engine processes each injected packet in real-time and raises alerts for anomalies." },
            { icon: "3", title: "Full Forensics", desc: "All generated alerts are logged with full XAI, MITRE ATT&CK, and mitigation recommendations." },
          ].map(item => (
            <div key={item.icon} className="bg-muted/30 rounded-lg p-3">
              <div className="text-primary font-bold mb-1">{item.icon}.</div>
              <div className="font-semibold text-foreground mb-1">{item.title}</div>
              <div>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
