/* ─── RailGuard AI — Control Panel (Left side HUD) ─── */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSimulationStore } from "@/stores/simulationStore";
import { api } from "@/lib/api";

interface ControlPanelProps {
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  onStartDemo: () => void;
}

export function ControlPanel({
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onStartDemo,
}: ControlPanelProps) {
  const running = useSimulationStore((s) => s.running);
  const forecastMode = useSimulationStore((s) => s.forecastMode);
  const setForecastMode = useSimulationStore((s) => s.setForecastMode);
  const agentsRunning = useSimulationStore((s) => s.agentsRunning);
  const setAgentsRunning = useSimulationStore((s) => s.setAgentsRunning);
  const setAgentResults = useSimulationStore((s) => s.setAgentResults);
  const showPlans = useSimulationStore((s) => s.showPlans);
  const setCinematicMode = useSimulationStore((s) => s.setCinematicMode);
  const [forecastLoading, setForecastLoading] = useState(false);

  const handleRunAgents = async () => {
    setAgentsRunning(true);
    try {
      const result = await api.runAgents();
      setAgentResults({
        rankedPlans: result.ranked_plans,
        explanation: result.explanation,
        selectedPlanId: result.selected_plan_id,
      });
    } catch (e) {
      console.error("Agent pipeline error:", e);
    } finally {
      setAgentsRunning(false);
    }
  };

  const handleForecast = async () => {
    setForecastLoading(true);
    try {
      await api.getForecast();
      setForecastMode(true);
    } catch (e) {
      console.error("Forecast error:", e);
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div className="fixed left-4 top-20 z-40 w-56 space-y-3 pointer-events-auto" id="control-panel">
      {/* Simulation Controls */}
      <div className="glass-panel p-3">
        <div className="text-[10px] font-mono font-bold text-cyan-300/70 tracking-[0.2em] mb-2.5">
          SIMULATION
        </div>
        <div className="space-y-1.5">
          {!running ? (
            <HUDButton onClick={onStartSimulation} color="cyan">
              ▶ START SIMULATION
            </HUDButton>
          ) : (
            <HUDButton onClick={onPauseSimulation} color="yellow">
              ⏸ PAUSE
            </HUDButton>
          )}
          <HUDButton onClick={onResetSimulation} color="slate">
            ↺ RESET
          </HUDButton>
        </div>
      </div>

      {/* Demo Mode */}
      <div className="glass-panel p-3">
        <div className="text-[10px] font-mono font-bold text-cyan-300/70 tracking-[0.2em] mb-2.5">
          CRISIS DEMO
        </div>
        <HUDButton 
          onClick={() => {
            setCinematicMode(true);
            onStartDemo();
          }} 
          color="red"
        >
          🎬 LAUNCH CRISIS DEMO
        </HUDButton>
        <p className="text-[9px] font-mono text-slate-600 mt-1.5">
          Runs compound failure scenario
        </p>
      </div>

      {/* AI Intelligence */}
      <div className="glass-panel p-3">
        <div className="text-[10px] font-mono font-bold text-cyan-300/70 tracking-[0.2em] mb-2.5">
          INTELLIGENCE
        </div>
        <div className="space-y-1.5">
          <HUDButton
            onClick={handleForecast}
            color="purple"
            loading={forecastLoading}
          >
            🔮 FORECAST +15 MIN
          </HUDButton>

          {forecastMode && (
            <HUDButton
              onClick={() => setForecastMode(false)}
              color="slate"
            >
              ✕ CLEAR FORECAST
            </HUDButton>
          )}

          <HUDButton
            onClick={handleRunAgents}
            color="cyan"
            loading={agentsRunning}
          >
            🧠 RUN AI AGENTS
          </HUDButton>

          {agentsRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-mono text-cyan-400/70 mt-1"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Agents processing...
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Platform Status Summary */}
      <PlatformStatusPanel />
    </div>
  );
}

/* ─── Platform Status Summary ─── */
function PlatformStatusPanel() {
  const platforms = useSimulationStore((s) => s.platforms);

  if (platforms.length === 0) return null;

  return (
    <div className="glass-panel p-3">
      <div className="text-[10px] font-mono font-bold text-cyan-300/70 tracking-[0.2em] mb-2">
        PLATFORMS
      </div>
      <div className="space-y-1">
        {platforms.map((p) => {
          const stateColors: Record<string, string> = {
            NORMAL: "bg-cyan-400",
            CONGESTING: "bg-yellow-400",
            WARNING: "bg-orange-400",
            CRITICAL: "bg-red-400",
            MITIGATING: "bg-purple-400",
            RECOVERING: "bg-green-400",
            CLOSED: "bg-slate-600",
          };

          return (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${stateColors[p.state] || "bg-slate-400"} ${
                  p.state === "CRITICAL" ? "animate-pulse" : ""
                }`}
              />
              <span className="text-[10px] font-mono text-slate-400 flex-1">
                P{p.id}
              </span>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${p.currentDensity * 100}%`,
                    background:
                      p.state === "CRITICAL"
                        ? "#FF4D4D"
                        : p.state === "WARNING"
                          ? "#F97316"
                          : "#00C8FF",
                  }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500 w-8 text-right">
                {Math.round(p.currentDensity * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── HUD Button ─── */
function HUDButton({
  children,
  onClick,
  color = "cyan",
  loading = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
  loading?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/50",
    red: "border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-400/50",
    purple: "border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50",
    yellow: "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 hover:border-yellow-400/50",
    green: "border-green-500/30 text-green-300 hover:bg-green-500/10 hover:border-green-400/50",
    slate: "border-slate-500/30 text-slate-300 hover:bg-slate-500/10 hover:border-slate-400/50",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full text-left px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider
        border rounded-md transition-all duration-200 ${colorClasses[color] || colorClasses.cyan}
        ${loading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
    >
      {loading ? "⏳ PROCESSING..." : children}
    </button>
  );
}
