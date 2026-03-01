import React from 'react';
import { motion } from "framer-motion";
import { Database, Cpu, ShieldCheck, Activity, Server, ArrowRight } from "lucide-react";

export const ArchitectureView: React.FC = () => {
    
    const pipelineSteps = [
        { 
            id: 1, 
            label: "Traffic Ingestion", 
            icon: Activity, 
            color: "text-blue-400",
            desc: "Raw packet capture & normalization"
        },
        { 
            id: 2, 
            label: "Feature Extraction", 
            icon: Database, 
            color: "text-purple-400",
            desc: "KDD-99 feature vector generation" 
        },
        { 
            id: 3, 
            label: "Isolation Forest", 
            icon: Cpu, 
            color: "text-orange-400",
            desc: "Unsupervised anomaly detection model"
        },
        { 
            id: 4, 
            label: "Threat Scoring", 
            icon: ShieldCheck, 
            color: "text-red-400",
            desc: "Risk calculation & alert generation",
            tech: "TypeScript / Custom Logic"
        },
        { 
            id: 5, 
            label: "Dashboard UI", 
            icon: Server, 
            color: "text-green-400",
            desc: "Real-time visualization & forensics",
            tech: "React + D3.js + Recharts"
        }
    ];

    const [activeStep, setActiveStep] = React.useState<number | null>(null);

    const runSimulation = () => {
        setActiveStep(1);
        
        // Sequence
        setTimeout(() => setActiveStep(2), 1500);
        setTimeout(() => setActiveStep(3), 3000);
        setTimeout(() => setActiveStep(4), 4500);
        setTimeout(() => setActiveStep(5), 6000);
        setTimeout(() => setActiveStep(null), 7500);
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 overflow-hidden bg-gradient-to-br from-background to-muted/20 relative">
             <div className="absolute top-8 right-8">
                <button 
                    onClick={runSimulation}
                    disabled={activeStep !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Activity size={16} />
                    {activeStep ? "Processing..." : "Replay Attack Pipeline"}
                </button>
            </div>

            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    AegisNet AI Pipeline
                </h2>
                <p className="text-muted-foreground">Real-time Data Flow Architecture</p>
            </div>

            <div className="flex items-center gap-4 w-full max-w-6xl justify-center scale-90 md:scale-100">
                {pipelineSteps.map((step, index) => {
                    const isActive = activeStep === step.id;
                    const isPassed = activeStep !== null && activeStep > step.id;
                    
                    return (
                        <React.Fragment key={step.id}>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    scale: isActive ? 1.1 : 1,
                                    filter: activeStep && !isActive && !isPassed ? "grayscale(100%) opacity(50%)" : "none"
                                }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group z-10"
                            >
                                <div className={`absolute inset-0 blur-xl rounded-full transition-colors duration-500 ${isActive ? 'bg-primary/30' : 'bg-transparent'}`} />
                                <div className={`relative w-48 h-64 backdrop-blur-md border rounded-xl p-6 flex flex-col items-center text-center transition-all duration-500 shadow-lg
                                    ${isActive 
                                        ? 'bg-card border-primary shadow-primary/20 ring-2 ring-primary/20' 
                                        : 'bg-card/40 border-border hover:border-primary/50'
                                    }
                                `}>
                                    <div className={`p-4 rounded-full bg-background/50 mb-4 ${isActive ? 'text-primary scale-110' : step.color} border border-border transition-all duration-500`}>
                                        <step.icon size={32} />
                                    </div>
                                    <h3 className={`font-bold text-lg mb-2 ${isActive ? 'text-primary' : ''}`}>{step.label}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {step.desc}
                                    </p>
                                    <div className="mt-3 px-2 py-1 bg-muted/50 rounded text-[10px] font-mono font-semibold opacity-70">
                                        {step.tech || "Custom Module"}
                                    </div>
                                    
                                    {/* Active Pulse */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
                                    )}
                                </div>
                            </motion.div>

                            {index < pipelineSteps.length - 1 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-muted-foreground/30 flex flex-col items-center"
                                >
                                    <ArrowRight size={24} className={isActive || isPassed ? "text-primary transition-colors duration-300" : ""} />
                                    
                                    {/* Connection Line Animation */}
                                    <div className="w-16 h-0.5 bg-muted mt-2 relative overflow-hidden">
                                        {(isActive || isPassed) && (
                                            <motion.div 
                                                className="absolute inset-0 bg-primary"
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "0%" }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-4xl w-full">
                <div className="p-4 rounded-lg bg-card/30 border border-border/50">
                    <div className="text-2xl font-bold font-mono text-blue-400">~15ms</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Latency</div>
                </div>
                <div className="p-4 rounded-lg bg-card/30 border border-border/50">
                    <div className="text-2xl font-bold font-mono text-purple-400">99.2%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Detection Rate</div>
                </div>
                <div className="p-4 rounded-lg bg-card/30 border border-border/50">
                    <div className="text-2xl font-bold font-mono text-green-400">Browser</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Environment</div>
                </div>
            </div>
        </div>
    );
};
