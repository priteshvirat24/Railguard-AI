/* ─── RailGuard AI — API Client ─── */

import { API_BASE } from "./constants";
import { AgentResult } from "./types";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  startSimulation: () => apiFetch("/api/simulation/start", { method: "POST" }),
  pauseSimulation: () => apiFetch("/api/simulation/pause", { method: "POST" }),
  resetSimulation: () => apiFetch("/api/simulation/reset", { method: "POST" }),
  getState: () => apiFetch("/api/station/state"),
  getEvents: (count = 50) => apiFetch(`/api/events?count=${count}`),
  getForecast: () => apiFetch("/api/forecast", { method: "POST" }),

  runAgents: () => apiFetch<AgentResult>("/api/agents/run", { method: "POST" }),

  executePlan: (planId: string) =>
    apiFetch(`/api/plans/${planId}/execute`, { method: "POST" }),

  copilotQuery: (query: string) =>
    apiFetch<{ response: string }>("/api/copilot", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),

  startDemo: () => apiFetch("/api/demo/crisis", { method: "POST" }),
};
