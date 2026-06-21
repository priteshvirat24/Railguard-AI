/* ─── RailGuard AI — Plan Comparison Panel ─── */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "@/stores/simulationStore";
import { api } from "@/lib/api";

export function PlanComparison() {
  const showPlans = useSimulationStore((s) => s.showPlans);
  const setShowPlans = useSimulationStore((s) => s.setShowPlans);
  const activePlans = useSimulationStore((s) => s.activePlans);
  const rankedPlans = useSimulationStore((s) => s.rankedPlans);
  const selectedPlanId = useSimulationStore((s) => s.selectedPlanId);
  const explanation = useSimulationStore((s) => s.explanation);

  if (!showPlans || activePlans.length === 0) return null;

  const handleExecute = async (planId: string) => {
    try {
      await api.executePlan(planId);
    } catch (e) {
      console.error("Plan execution error:", e);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-4xl pointer-events-auto"
        id="plan-comparison"
      >
        <div className="glass-panel p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🧠</span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-[0.2em]">
                AI INTERVENTION PLANS
              </span>
            </div>
            <button
              onClick={() => setShowPlans(false)}
              className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {activePlans.map((plan, idx) => {
              const ranked = rankedPlans.find((r) => r.planId === plan.id);
              const isSelected = plan.id === selectedPlanId;
              const isTop = ranked?.rank === 1;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`glass-panel-sm p-3 relative ${
                    isSelected ? "glow-cyan border-cyan-400/40" : ""
                  } ${isTop ? "border-cyan-400/30" : ""}`}
                >
                  {/* Rank badge */}
                  {ranked && (
                    <div
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                        flex items-center justify-center text-[9px] font-bold font-mono
                        ${ranked.rank === 1
                          ? "bg-cyan-500 text-white"
                          : ranked.rank === 2
                            ? "bg-slate-600 text-slate-300"
                            : "bg-slate-700 text-slate-400"
                        }`}
                    >
                      #{ranked.rank}
                    </div>
                  )}

                  {/* Plan name */}
                  <h3 className="text-xs font-bold text-white mb-1.5">
                    {plan.name}
                  </h3>

                  {/* Description */}
                  <p className="text-[10px] text-slate-400 leading-tight mb-2">
                    {plan.description}
                  </p>

                  {/* Actions */}
                  <div className="space-y-0.5 mb-2">
                    {plan.actions.map((action, i) => (
                      <div
                        key={i}
                        className="text-[9px] font-mono text-cyan-400/80 flex items-center gap-1"
                      >
                        <span className="text-cyan-600">›</span>
                        {action}
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono mb-2">
                    <div>
                      <span className="text-slate-600">Risk Reduction</span>
                      <div className="text-green-400 font-bold">
                        {Math.round(plan.projectedRiskReduction * 100)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600">Recovery</span>
                      <div className="text-cyan-400 font-bold">
                        {plan.estimatedRecoveryTime}min
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600">Confidence</span>
                      <div className="text-purple-400 font-bold">
                        {Math.round(plan.confidence * 100)}%
                      </div>
                    </div>
                    {ranked && (
                      <div>
                        <span className="text-slate-600">Score</span>
                        <div className="text-yellow-400 font-bold">
                          {ranked.overallScore.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Side effects */}
                  {plan.sideEffects.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[8px] font-mono text-slate-600">
                        SIDE EFFECTS
                      </span>
                      {plan.sideEffects.map((se, i) => (
                        <div
                          key={i}
                          className="text-[9px] text-orange-400/70"
                        >
                          ⚠ {se}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Execute button */}
                  <button
                    onClick={() => handleExecute(plan.id)}
                    className={`w-full py-1 text-[9px] font-mono font-bold tracking-wider
                      rounded border transition-all cursor-pointer ${
                        isTop
                          ? "border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/20"
                          : "border-slate-600 text-slate-400 hover:bg-slate-700/30"
                      }`}
                  >
                    {isTop ? "⚡ EXECUTE PLAN" : "EXECUTE"}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* AI Explanation */}
          {explanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel-sm p-3"
            >
              <div className="text-[9px] font-mono font-bold text-purple-300/70 tracking-wider mb-1">
                🤖 AI EXPLANATION
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {explanation}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
