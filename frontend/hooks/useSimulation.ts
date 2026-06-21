/* ─── RailGuard AI — WebSocket Simulation Hook ─── */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import { WS_BASE } from "@/lib/constants";
import { SimulationSnapshot, SimulationEvent } from "@/lib/types";

export function useSimulation() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
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
        // Reconnect after 2 seconds
        reconnectTimer.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, 2000);
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
