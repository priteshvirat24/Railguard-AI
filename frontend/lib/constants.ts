/* ─── RailGuard AI — Constants ─── */

import { PlatformState } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";

// Platform state colors (Three.js Color format)
export const PLATFORM_COLORS: Record<PlatformState, string> = {
  NORMAL: "#00C8FF",
  CONGESTING: "#F59E0B",
  WARNING: "#F97316",
  CRITICAL: "#FF4D4D",
  MITIGATING: "#A855F7",
  RECOVERING: "#10B981",
  CLOSED: "#374151",
};

// Platform state emissive intensity
export const PLATFORM_INTENSITY: Record<PlatformState, number> = {
  NORMAL: 0.3,
  CONGESTING: 0.5,
  WARNING: 0.7,
  CRITICAL: 1.0,
  MITIGATING: 0.6,
  RECOVERING: 0.4,
  CLOSED: 0.1,
};

// Train status colors
export const TRAIN_COLORS: Record<string, string> = {
  SCHEDULED: "#374151",
  APPROACHING: "#00C8FF",
  STOPPED: "#7DD3FC",
  BOARDING: "#00C8FF",
  DEPARTING: "#10B981",
  DELAYED: "#F97316",
  CANCELLED: "#FF4D4D",
};

// Severity colors
export const SEVERITY_COLORS: Record<string, string> = {
  INFO: "#7DD3FC",
  LOW: "#00C8FF",
  MEDIUM: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#FF4D4D",
};

// Event type icons (emoji for simplicity)
export const EVENT_ICONS: Record<string, string> = {
  TRAIN_ARRIVED: "🚆",
  TRAIN_DEPARTED: "🚄",
  TRAIN_DELAYED: "⏰",
  TRAIN_HELD: "✋",
  TRAIN_RELEASED: "✅",
  PLATFORM_STATE_CHANGED: "📊",
  PLATFORM_CLOSED: "🚫",
  PLATFORM_REOPENED: "🟢",
  DENSITY_THRESHOLD_CROSSED: "⚠️",
  CRITICAL_DENSITY_REACHED: "🔴",
  SIGNAL_FAILURE: "⚡",
  SIGNAL_RESTORED: "🔧",
  FORECAST_GENERATED: "🔮",
  PLAN_GENERATED: "🧠",
  PLAN_SELECTED: "✅",
  PLAN_EXECUTED: "🚀",
  INTERVENTION_STARTED: "🛠️",
  RECOVERY_ACHIEVED: "💚",
  SIMULATION_STARTED: "▶️",
  SIMULATION_PAUSED: "⏸️",
  SIMULATION_RESET: "🔄",
  DEMO_STARTED: "🎬",
  DEMO_COMPLETED: "🎉",
  OVERFLOW_GATE_OPENED: "🚪",
  PASSENGERS_REDIRECTED: "↪️",
  ENTRY_RESTRICTED: "🚧",
};
