import React, { useEffect, useState } from "react";
import { usePackets } from "../context/PacketContext";
import { ShieldAlert, X } from "lucide-react";
import { cn } from "../utils/cn";
import { Alert } from "../core/types";

export const Toaster: React.FC = () => {
  const { alerts } = usePackets();
  const [visibleToasts, setVisibleToasts] = useState<Alert[]>([]);

  useEffect(() => {
    if (alerts.length > 0) {
        const newAlert = alerts[0];
        // Only show critical/high alerts as toast
        if (newAlert.severity === "CRITICAL" || newAlert.severity === "HIGH") {
            // Check if already shown recently to avoid spam? 
            // Ideally use a dedicated toast queue, but for now just showing specific ones
            // Actually, alerts[0] changes on every new alert.
            // We'll add it to visible toasts.
            addToast(newAlert);
        }
    }
  }, [alerts]);

  const addToast = (alert: Alert) => {
    setVisibleToasts(prev => {
        if (prev.find(t => t.id === alert.id)) return prev;
        return [alert, ...prev].slice(0, 3); // Max 3 toasts
    });

    // Auto dismiss
    setTimeout(() => {
        removeToast(alert.id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {visibleToasts.map((toast) => (
        <div 
            key={toast.id}
            className={cn(
                "flex items-start gap-3 p-4 rounded-lg shadow-lg border w-80 animate-in slide-in-from-right fade-in duration-300",
                "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                toast.severity === "CRITICAL" ? "border-red-500/50 text-red-500" : "border-orange-500/50 text-orange-500"
            )}
        >
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
                <h4 className="font-bold text-sm tracking-wide uppercase">{toast.severity} THREAT DETECTED</h4>
                <p className="text-xs text-foreground/80 mt-1">
                    {toast.type} attack detected from {toast.src_ip}
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                    Score: {toast.score.toFixed(4)}
                </p>
            </div>
            <button 
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                <X size={16} />
            </button>
        </div>
      ))}
    </div>
  );
};
