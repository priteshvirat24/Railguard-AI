/* ─── RailGuard AI — Main Page ─── */

"use client";

import dynamic from "next/dynamic";
import { useSimulation } from "@/hooks/useSimulation";
import { CrisisBar } from "@/components/hud/CrisisBar";
import { MissionTimeline } from "@/components/hud/MissionTimeline";
import { ControlPanel } from "@/components/hud/ControlPanel";
import { PlanComparison } from "@/components/hud/PlanComparison";
import { CopilotChat } from "@/components/hud/CopilotChat";
import { TimeSlider } from "@/components/hud/TimeSlider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useState, useEffect } from "react";

// Dynamic import for 3D scene (no SSR)
const StationScene = dynamic(
  () =>
    import("@/components/scene/StationScene").then((mod) => ({
      default: mod.StationScene,
    })),
  { ssr: false }
);

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const { startSimulation, pauseSimulation, resetSimulation, startDemo } = useSimulation();
  
  // We need to import the store to check cinematicMode
  const { useSimulationStore } = require("@/stores/simulationStore");
  const cinematicMode = useSimulationStore((s: any) => s.cinematicMode);

  useEffect(() => {
    // Show loading screen for 3 seconds
    const timer = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050A12]" id="railguard-main">
      {/* 3D Digital Twin (background, 100% viewport) */}
      <StationScene />

      {/* Cinematic Letterboxes */}
      <div 
        className="fixed top-0 left-0 right-0 bg-black z-[100] transition-all duration-[2000ms] ease-in-out pointer-events-none"
        style={{ height: cinematicMode ? "12vh" : "0vh" }}
      />
      <div 
        className="fixed bottom-0 left-0 right-0 bg-black z-[100] transition-all duration-[2000ms] ease-in-out pointer-events-none"
        style={{ height: cinematicMode ? "12vh" : "0vh" }}
      />

      {/* HUD Overlays (Hide when cinematicMode is active) */}
      <div 
        className="transition-all duration-1000 ease-in-out"
        style={{ 
          opacity: cinematicMode ? 0 : 1, 
          transform: cinematicMode ? "translateY(20px)" : "translateY(0px)",
          pointerEvents: cinematicMode ? "none" : "auto" 
        }}
      >
        <CrisisBar />

        <ControlPanel
          onStartSimulation={startSimulation}
          onPauseSimulation={pauseSimulation}
          onResetSimulation={resetSimulation}
          onStartDemo={startDemo}
        />

        <MissionTimeline />
        <PlanComparison />
        <TimeSlider />
        <CopilotChat />
      </div>

      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-[60] scanlines opacity-30" />

      {/* Bottom gradient fade */}
      <div
        className="fixed bottom-0 left-0 right-0 h-20 pointer-events-none z-30 transition-opacity duration-1000"
        style={{
          background: "linear-gradient(transparent, #050A12)",
          opacity: cinematicMode ? 0 : 1
        }}
      />
    </main>
  );
}
