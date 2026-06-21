"""RailGuard AI — FastAPI Main Application"""

from __future__ import annotations
import asyncio
import json
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from config import AppConfig
from simulation.engine import SimulationEngine
from simulation.types import InterventionPlan
from agents.orchestrator import agent_workflow, copilot_workflow
from agents.state import (
    AgentState, PlatformSnapshot, TrainSnapshot, TrackSnapshot,
)
from knowledge.knowledge_base import knowledge_base


# ─── Global State ────────────────────────────────────────────────
config = AppConfig()
engine = SimulationEngine(config)

# WebSocket connections
ws_connections: set[WebSocket] = []


# ─── Lifespan ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize knowledge base on startup."""
    await knowledge_base.initialize()
    yield
    engine.stop()


# ─── App ─────────────────────────────────────────────────────────
app = FastAPI(
    title="RailGuard AI",
    description="Railway Digital Twin & Crowd Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper: Build AgentState from Engine ────────────────────────
def build_agent_state() -> AgentState:
    """Convert current simulation state to agent-consumable state."""
    snapshot = engine.get_snapshot()
    return AgentState(
        platforms=[
            PlatformSnapshot(
                id=p.id, name=p.name, capacity=p.capacity,
                passenger_count=p.passenger_count,
                current_density=p.current_density,
                state=p.state.value, inflow_rate=p.inflow_rate,
                outflow_rate=p.outflow_rate, is_closed=p.is_closed,
            )
            for p in snapshot.platforms
        ],
        trains=[
            TrainSnapshot(
                id=t.id, name=t.name, platform_id=t.platform_id,
                status=t.status.value, delay_minutes=t.delay_minutes,
                passenger_load=t.passenger_load, position=t.position,
            )
            for t in snapshot.trains
        ],
        tracks=[
            TrackSnapshot(
                id=t.id, platform_ids=t.platform_ids,
                has_signal_failure=t.has_signal_failure,
            )
            for t in snapshot.tracks
        ],
        station_state=snapshot.station_state.value,
        crisis_probability=snapshot.crisis_probability,
        recent_events=engine.event_store.to_dict_list(20),
        tick=snapshot.tick,
    )


# ─── WebSocket: Simulation Stream ───────────────────────────────
@app.websocket("/ws/simulation")
async def websocket_simulation(ws: WebSocket):
    """Stream simulation state updates to the frontend."""
    await ws.accept()
    ws_connections.append(ws)

    try:
        # Send initial state
        snapshot = engine.get_snapshot()
        await ws.send_json({
            "type": "snapshot",
            "data": snapshot.to_dict(),
        })

        # Listen for commands while streaming
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_json(), timeout=engine.tick_rate)
                await handle_ws_command(ws, data)
            except asyncio.TimeoutError:
                # Send state update on each tick
                if engine.running and not engine.paused:
                    snapshot = engine.get_snapshot()
                    await ws.send_json({
                        "type": "snapshot",
                        "data": snapshot.to_dict(),
                    })
    except WebSocketDisconnect:
        pass
    finally:
        if ws in ws_connections:
            ws_connections.remove(ws)


async def handle_ws_command(ws: WebSocket, data: dict):
    """Handle commands received over WebSocket."""
    cmd = data.get("command")

    if cmd == "start":
        if not engine.running:
            asyncio.create_task(engine.start())
        elif engine.paused:
            engine.resume()
        await ws.send_json({"type": "status", "data": {"running": True}})

    elif cmd == "pause":
        engine.pause()
        await ws.send_json({"type": "status", "data": {"running": False}})

    elif cmd == "reset":
        engine.reset()
        snapshot = engine.get_snapshot()
        await ws.send_json({"type": "snapshot", "data": snapshot.to_dict()})

    elif cmd == "demo":
        if not engine.running:
            asyncio.create_task(engine.start())
        engine.start_crisis_demo()
        await ws.send_json({"type": "status", "data": {"demo": True}})


# ─── REST: Simulation Controls ──────────────────────────────────
@app.post("/api/simulation/start")
async def start_simulation():
    if not engine.running:
        asyncio.create_task(engine.start())
    elif engine.paused:
        engine.resume()
    return {"status": "running"}


@app.post("/api/simulation/pause")
async def pause_simulation():
    engine.pause()
    return {"status": "paused"}


@app.post("/api/simulation/reset")
async def reset_simulation():
    engine.reset()
    return {"status": "reset"}


@app.get("/api/station/state")
async def get_station_state():
    snapshot = engine.get_snapshot()
    return snapshot.to_dict()


@app.get("/api/events")
async def get_events(count: int = 50):
    return engine.event_store.to_dict_list(count)


# ─── REST: AI Agents ────────────────────────────────────────────
@app.post("/api/forecast")
async def request_forecast():
    """Trigger the forecast engine (simulation-based)."""
    forecasts = engine.request_forecast()
    return {"forecasts": [f.to_dict() for f in forecasts]}


@app.post("/api/agents/run")
async def run_agent_pipeline():
    """
    Run the full LangGraph multi-agent pipeline:
    Forecast → Detect → Plan → Simulate → Risk → Decide → Explain
    """
    state = build_agent_state()

    try:
        result = await agent_workflow.ainvoke(state.model_dump())

        # Update engine with agent results
        if result.get("candidate_plans"):
            plans = []
            for cp in result["candidate_plans"]:
                outcome = next(
                    (o for o in result.get("simulated_outcomes", []) if o.get("plan_id") == cp.get("id")),
                    {}
                )
                plans.append(InterventionPlan(
                    id=cp.get("id", ""),
                    name=cp.get("name", ""),
                    description=cp.get("description", ""),
                    actions=cp.get("actions", []),
                    projected_density_reduction=outcome.get("projected_risk_reduction", 0),
                    projected_risk_reduction=outcome.get("projected_risk_reduction", 0),
                    estimated_recovery_time=outcome.get("projected_recovery_minutes", 0),
                    confidence=outcome.get("confidence", 0),
                    side_effects=outcome.get("side_effects", []),
                ))
            engine.set_plans(plans)

        if result.get("selected_plan_id"):
            engine.selected_plan_id = result["selected_plan_id"]

        return {
            "status": "completed",
            "forecasts": result.get("forecasts", []),
            "incidents": result.get("incidents", []),
            "candidate_plans": result.get("candidate_plans", []),
            "simulated_outcomes": result.get("simulated_outcomes", []),
            "risk_assessments": result.get("risk_assessments", []),
            "ranked_plans": result.get("ranked_plans", []),
            "selected_plan_id": result.get("selected_plan_id"),
            "explanation": result.get("explanation", ""),
            "errors": result.get("errors", []),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


class CopilotQuery(BaseModel):
    query: str


@app.post("/api/copilot")
async def copilot_query(body: CopilotQuery):
    """Query the Operations Copilot agent."""
    state = build_agent_state()
    state_dict = state.model_dump()
    state_dict["copilot_query"] = body.query

    # Include current agent results if available
    if engine.active_plans:
        state_dict["candidate_plans"] = [
            {"id": p.id, "name": p.name, "description": p.description, "actions": p.actions}
            for p in engine.active_plans
        ]
    if engine.selected_plan_id:
        state_dict["selected_plan_id"] = engine.selected_plan_id

    try:
        result = await copilot_workflow.ainvoke(state_dict)
        return {"response": result.get("copilot_response", "")}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}


@app.post("/api/plans/{plan_id}/execute")
async def execute_plan(plan_id: str):
    """Execute a selected intervention plan."""
    engine.execute_plan(plan_id)

    # Find the plan and apply its effects
    plan = next((p for p in engine.active_plans if p.id == plan_id), None)
    if plan:
        # Apply plan effects to the simulation
        for action in plan.actions:
            action_lower = action.lower()
            if "hold" in action_lower:
                for train in engine.station.trains.values():
                    if train.id in action or train.name.lower() in action_lower:
                        train.status = "DELAYED"
            if "overflow" in action_lower or "gate" in action_lower:
                for platform in engine.station.platforms.values():
                    if platform.state.value in ("WARNING", "CRITICAL"):
                        engine.station.begin_mitigation(platform.id)
            if "restrict" in action_lower or "entry" in action_lower:
                for platform in engine.station.platforms.values():
                    platform.inflow_rate *= 0.5

        return {"status": "executed", "plan_id": plan_id, "plan_name": plan.name}
    return {"status": "plan_not_found", "plan_id": plan_id}


@app.post("/api/demo/crisis")
async def start_crisis_demo():
    """Start the compound failure crisis demo scenario."""
    if not engine.running:
        asyncio.create_task(engine.start())
    engine.start_crisis_demo()
    return {"status": "demo_started", "scenario": "Compound Failure"}


# ─── Health Check ────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "tick": engine.tick, "running": engine.running}
