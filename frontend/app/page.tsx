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
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [loaded, setLoaded] = useState(false);
  const { startSimulation, pauseSimulation, resetSimulation, startDemo } = useSimulation();
  
  // We need to import the store to check cinematicMode
  const { useSimulationStore } = require("@/stores/simulationStore");
  const cinematicMode = useSimulationStore((s: any) => s.cinematicMode);

  useEffect(() => {
    // Show loading screen for 3 seconds when switching to 3d
    if (viewMode === "3d" && !loaded) {
      const timer = setTimeout(() => setLoaded(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [viewMode, loaded]);

  const toggleButton = (
    <button
      onClick={() => setViewMode(v => v === "2d" ? "3d" : "2d")}
      className="fixed top-4 right-4 z-[999] bg-[#050A12]/80 backdrop-blur-md text-[#E6EAEF] px-4 py-2 rounded font-mono text-[11px] uppercase tracking-widest shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:bg-[#11151B] transition-colors border border-[#2E3742] hover:border-[#34B6D6] hover:text-[#34B6D6] flex items-center gap-2"
    >
      {viewMode === "2d" ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          3D Digital Twin
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          2D Dashboard
        </>
      )}
    </button>
  );

  if (viewMode === "2d") {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-[#0B0E12]">
        {toggleButton}
        <DashboardLayout />
      </main>
    );
  }

  if (!loaded) {
    return (
      <>
        {toggleButton}
        <LoadingScreen />
      </>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050A12]" id="railguard-main">
      {toggleButton}
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
