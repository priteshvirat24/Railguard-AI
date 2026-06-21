/* ─── RailGuard AI — Crisis Probability Bar ─── */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "@/stores/simulationStore";

export function CrisisBar() {
  const crisisProbability = useSimulationStore((s) => s.crisisProbability);
  const stationState = useSimulationStore((s) => s.stationState);
  const activeIncidents = useSimulationStore((s) => s.activeIncidents);
  const tick = useSimulationStore((s) => s.tick);
  const connected = useSimulationStore((s) => s.connected);

  const pct = Math.round(crisisProbability * 100);
  const isCritical = pct > 70;
  const isWarning = pct > 40;

  const barColor =
    pct > 70
      ? "bg-gradient-to-r from-red-600 to-red-400"
      : pct > 40
        ? "bg-gradient-to-r from-orange-600 to-yellow-400"
        : pct > 20
          ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
          : "bg-gradient-to-r from-cyan-600 to-cyan-400";

  const stateColor: Record<string, string> = {
    NORMAL: "text-cyan-400",
    MONITORING: "text-yellow-400",
    WARNING: "text-orange-400",
    CRITICAL: "text-red-400",
    MITIGATING: "text-purple-400",
    RECOVERING: "text-green-400",
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none" id="crisis-bar">
      <div className="glass-panel mx-4 mt-3 px-4 py-2.5 pointer-events-auto">
        <div className="flex items-center justify-between gap-6">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-bold tracking-wider text-cyan-300 glow-text-cyan">
              RAILGUARD AI
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {connected ? "CONNECTED" : "OFFLINE"}
            </span>
          </div>

          {/* Crisis Probability */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 tracking-widest">
                CRISIS PROBABILITY
              </span>
              <motion.span
                key={pct}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-sm font-bold font-mono ${
                  isCritical
                    ? "text-red-400 glow-text-red"
                    : isWarning
                      ? "text-orange-400"
                      : "text-cyan-400"
                }`}
              >
                {pct}%
              </motion.span>
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Station State */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-500 tracking-wider">STATE</div>
              <div
                className={`text-xs font-bold font-mono ${stateColor[stationState] || "text-slate-400"}`}
              >
                {stationState}
              </div>
            </div>

            <div className="w-px h-6 bg-slate-700" />

            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-500 tracking-wider">INCIDENTS</div>
              <div className={`text-xs font-bold font-mono ${activeIncidents > 0 ? "text-orange-400" : "text-slate-400"}`}>
                {activeIncidents}
              </div>
            </div>

            <div className="w-px h-6 bg-slate-700" />

            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-500 tracking-wider">TICK</div>
              <div className="text-xs font-mono text-slate-400">{tick}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical flash overlay */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40"
          >
            <div className="absolute inset-0 animate-pulse-danger bg-red-500/[0.02]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
