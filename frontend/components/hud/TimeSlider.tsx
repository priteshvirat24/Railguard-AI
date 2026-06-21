/* ─── RailGuard AI — Time Slider ─── */

"use client";

import { useSimulationStore } from "@/stores/simulationStore";

export function TimeSlider() {
  const timeOffset = useSimulationStore((s) => s.timeOffset);
  const setTimeOffset = useSimulationStore((s) => s.setTimeOffset);
  const forecastMode = useSimulationStore((s) => s.forecastMode);

  if (!forecastMode) return null;

  const marks = [0, 5, 10, 15, 20];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[500px] pointer-events-auto" id="time-slider">
      <div className="glass-panel px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold text-cyan-300/70 tracking-[0.2em]">
            TIME TRAVEL
          </span>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {timeOffset === 0 ? "NOW" : `+${timeOffset} MIN`}
          </span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={20}
          step={5}
          value={timeOffset}
          onChange={(e) => setTimeOffset(Number(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-cyan-400
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,200,255,0.5)]
            [&::-webkit-slider-thumb]:cursor-pointer"
        />

        {/* Marks */}
        <div className="flex justify-between mt-1">
          {marks.map((m) => (
            <span
              key={m}
              className={`text-[9px] font-mono ${
                m === timeOffset
                  ? "text-cyan-400 font-bold"
                  : "text-slate-600"
              }`}
            >
              {m === 0 ? "NOW" : `+${m}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
