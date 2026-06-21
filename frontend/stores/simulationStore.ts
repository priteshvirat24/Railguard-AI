/* ─── RailGuard AI — Zustand Simulation Store ─── */

import { create } from "zustand";
import {
  SimulationSnapshot,
  SimulationEvent,
  InterventionPlan,
  RankedPlan,
  ForecastPoint,
  Platform,
  Train,
  Track,
  StationState,
} from "@/lib/types";

interface SimulationStore {
  // Connection state
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Simulation state
  running: boolean;
  tick: number;
  stationState: StationState;
  crisisProbability: number;
  activeIncidents: number;

  // Entities
  platforms: Platform[];
  trains: Train[];
  tracks: Track[];

  // Events timeline
  events: SimulationEvent[];
  addEvent: (event: SimulationEvent) => void;

  // Forecasts
  forecasts: ForecastPoint[];
  forecastMode: boolean;
  setForecastMode: (v: boolean) => void;

  // AI Plans
  activePlans: InterventionPlan[];
  rankedPlans: RankedPlan[];
  selectedPlanId: string | null;
  explanation: string;
  showPlans: boolean;
  setShowPlans: (v: boolean) => void;

  // Time travel
  timeOffset: number; // minutes ahead (0 = now)
  setTimeOffset: (v: number) => void;

  // Demo
  demoActive: boolean;

  // Copilot
  copilotMessages: { role: "user" | "assistant"; content: string }[];
  addCopilotMessage: (msg: { role: "user" | "assistant"; content: string }) => void;

  // Hovered platform
  hoveredPlatformId: number | null;
  setHoveredPlatformId: (id: number | null) => void;

  // Update from snapshot
  updateFromSnapshot: (snapshot: SimulationSnapshot) => void;

  // Agent results
  setAgentResults: (results: {
    rankedPlans?: RankedPlan[];
    explanation?: string;
    selectedPlanId?: string | null;
  }) => void;

  // Loading states
  agentsRunning: boolean;
  setAgentsRunning: (v: boolean) => void;

  // Reset
  reset: () => void;

  // Cinematic Intro
  cinematicMode: boolean;
  setCinematicMode: (v: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  running: false,
  tick: 0,
  stationState: "NORMAL",
  crisisProbability: 0,
  activeIncidents: 0,

  platforms: [],
  trains: [],
  tracks: [],

  events: [],
  addEvent: (event) =>
    set((s) => ({
      events: [...s.events.slice(-99), event],
    })),

  forecasts: [],
  forecastMode: false,
  setForecastMode: (v) => set({ forecastMode: v }),

  activePlans: [],
  rankedPlans: [],
  selectedPlanId: null,
  explanation: "",
  showPlans: false,
  setShowPlans: (v) => set({ showPlans: v }),

  timeOffset: 0,
  setTimeOffset: (v) => set({ timeOffset: v }),

  demoActive: false,

  copilotMessages: [],
  addCopilotMessage: (msg) =>
    set((s) => ({ copilotMessages: [...s.copilotMessages, msg] })),

  hoveredPlatformId: null,
  setHoveredPlatformId: (id) => set({ hoveredPlatformId: id }),

  updateFromSnapshot: (snapshot) =>
    set({
      tick: snapshot.tick,
      stationState: snapshot.stationState,
      crisisProbability: snapshot.crisisProbability,
      activeIncidents: snapshot.activeIncidents,
      platforms: snapshot.platforms,
      trains: snapshot.trains,
      tracks: snapshot.tracks,
      forecasts: snapshot.forecasts,
      activePlans: snapshot.activePlans,
      selectedPlanId: snapshot.selectedPlanId,
      running: true,
    }),

  setAgentResults: (results) =>
    set({
      rankedPlans: results.rankedPlans || [],
      explanation: results.explanation || "",
      selectedPlanId: results.selectedPlanId || null,
      showPlans: true,
    }),

  agentsRunning: false,
  setAgentsRunning: (v) => set({ agentsRunning: v }),

  reset: () =>
    set({
      running: false,
      tick: 0,
      stationState: "NORMAL",
      crisisProbability: 0,
      activeIncidents: 0,
      platforms: [],
      trains: [],
      tracks: [],
      events: [],
      forecasts: [],
      forecastMode: false,
      activePlans: [],
      rankedPlans: [],
      selectedPlanId: null,
      explanation: "",
      showPlans: false,
      timeOffset: 0,
      demoActive: false,
      copilotMessages: [],
      hoveredPlatformId: null,
      agentsRunning: false,
      cinematicMode: false,
    }),
  
  cinematicMode: false,
  setCinematicMode: (v) => set({ cinematicMode: v }),
}));
