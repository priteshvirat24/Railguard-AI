/* ─── RailGuard AI — WebSocket Simulation Hook ─── */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import { WS_BASE } from "@/lib/constants";
import { SimulationSnapshot, SimulationEvent } from "@/lib/types";

export function useSimulation() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const {
    setConnected,
    updateFromSnapshot,
    addEvent,
  } = useSimulationStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/simulation`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0; // Reset attempts on success
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "snapshot") {
            const snapshot = msg.data as SimulationSnapshot;
            updateFromSnapshot(snapshot);
          } else if (msg.type === "event") {
            addEvent(msg.data as SimulationEvent);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Exponential backoff: 2s, 4s, 8s, max 30s
        const backoff = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts.current));
        reconnectAttempts.current++;
        reconnectTimer.current = setTimeout(connect, backoff);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      const backoff = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts.current));
      reconnectAttempts.current++;
      reconnectTimer.current = setTimeout(connect, backoff);
    }
  }, [setConnected, updateFromSnapshot, addEvent]);

  const sendCommand = useCallback((command: string, data?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command, ...data }));
    }
  }, []);

  const startSimulation = useCallback(() => sendCommand("start"), [sendCommand]);
  const pauseSimulation = useCallback(() => sendCommand("pause"), [sendCommand]);
  const resetSimulation = useCallback(() => sendCommand("reset"), [sendCommand]);
  const startDemo = useCallback(() => sendCommand("demo"), [sendCommand]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [connect]);

  return {
    startSimulation,
    pauseSimulation,
    resetSimulation,
    startDemo,
    sendCommand,
  };
}
