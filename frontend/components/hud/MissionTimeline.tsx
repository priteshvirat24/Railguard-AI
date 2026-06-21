/* ─── RailGuard AI — Mission Timeline ─── */

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "@/stores/simulationStore";
import { EVENT_ICONS, SEVERITY_COLORS } from "@/lib/constants";

export function MissionTimeline() {
  const events = useSimulationStore((s) => s.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const recentEvents = events.slice(-30);

  return (
    <div
      className="fixed right-4 top-20 bottom-20 w-72 z-40 pointer-events-auto"
      id="mission-timeline"
    >
      <div className="glass-panel h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-[0.2em]">
              MISSION TIMELINE
            </span>
          </div>
        </div>

        {/* Events */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5"
        >
          <AnimatePresence initial={false}>
            {recentEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-1.5 px-2 rounded-md hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start gap-2">
                  {/* Event icon */}
                  <span className="text-xs mt-0.5 shrink-0">
                    {EVENT_ICONS[event.type] || "📡"}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Severity + Type */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            SEVERITY_COLORS[event.severity] || "#7DD3FC",
                        }}
                      />
                      <span
                        className="text-[9px] font-mono font-bold tracking-wider"
                        style={{
                          color:
                            SEVERITY_COLORS[event.severity] || "#7DD3FC",
                        }}
                      >
                        {event.severity}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-[11px] text-slate-300 leading-tight mt-0.5 break-words">
                      {event.message}
                    </p>

                    {/* Tick */}
                    <span className="text-[9px] font-mono text-slate-600">
                      T+{event.tick}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {recentEvents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[10px] font-mono text-slate-600">
                Awaiting events...
              </p>
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="px-3 py-1.5 border-t border-cyan-500/10">
          <span className="text-[9px] font-mono text-slate-600">
            {events.length} events recorded
          </span>
        </div>
      </div>
    </div>
  );
}
