"""RailGuard AI — Core Simulation Engine"""

from __future__ import annotations
import asyncio
import time
from typing import Optional, Callable
from simulation.types import (
    Platform, Train, Track, SimulationSnapshot, StationState,
    InterventionPlan, ForecastPoint,
)
from simulation.events import EventStore, SimulationEvent, EventType
from simulation.station import Station
from simulation.forecast import ForecastEngine
from simulation.scenarios import CrisisScenario, compound_failure_scenario
from config import AppConfig


class SimulationEngine:
    """
    Core simulation engine that drives the railway digital twin.
    Uses a state machine + event sourcing architecture.
    """

    def __init__(self, config: AppConfig):
        self.config = config
        self.event_store = EventStore()
        self.station = Station(config, self.event_store)
        self.forecast_engine = ForecastEngine()

        self.tick = 0
        self.running = False
        self.paused = False
        self.tick_rate = config.simulation.tick_rate

        # Crisis scenario
        self.active_scenario: Optional[CrisisScenario] = None
        self.scenario_start_tick: int = 0

        # AI-generated data
        self.forecasts: list[ForecastPoint] = []
        self.active_plans: list[InterventionPlan] = []
        self.selected_plan_id: Optional[str] = None

        # Callbacks
        self._on_tick_callbacks: list[Callable] = []
        self._on_event_callbacks: list[Callable] = []

        # Subscribe to events
        self.event_store.subscribe(self._handle_event)

    def on_tick(self, callback: Callable):
        """Register a callback that fires every tick with the snapshot."""
        self._on_tick_callbacks.append(callback)

    def on_event(self, callback: Callable):
        """Register a callback that fires when events occur."""
        self._on_event_callbacks.append(callback)

    def _handle_event(self, event: SimulationEvent):
        for cb in self._on_event_callbacks:
            try:
                cb(event)
            except Exception:
                pass

    async def start(self):
        """Start the simulation loop."""
        self.running = True
        self.paused = False
        self.event_store.append(SimulationEvent(
            type=EventType.SIMULATION_STARTED,
            timestamp=time.time(),
            tick=self.tick,
            severity="INFO",
            message="Simulation engine started",
        ))

        while self.running:
            if not self.paused:
                self._advance_tick()
            await asyncio.sleep(self.tick_rate)

    def pause(self):
        self.paused = True
        self.event_store.append(SimulationEvent(
            type=EventType.SIMULATION_PAUSED,
            timestamp=time.time(),
            tick=self.tick,
            severity="INFO",
            message="Simulation paused",
        ))

    def resume(self):
        self.paused = False

    def stop(self):
        self.running = False

    def reset(self):
        """Reset the entire simulation."""
        self.stop()
        self.tick = 0
        self.event_store.clear()
        self.station = Station(self.config, self.event_store)
        self.forecasts.clear()
        self.active_plans.clear()
        self.selected_plan_id = None
        self.active_scenario = None
        self.event_store.append(SimulationEvent(
            type=EventType.SIMULATION_RESET,
            timestamp=time.time(),
            tick=0,
            severity="INFO",
            message="Simulation reset",
        ))

    def _advance_tick(self):
        """Advance one simulation tick."""
        self.tick += 1

        # Update station
        self.station.update_tick(self.tick)

        # Process active scenario steps
        if self.active_scenario:
            self._process_scenario_tick()

        # Build snapshot and notify
        snapshot = self.get_snapshot()
        for cb in self._on_tick_callbacks:
            try:
                cb(snapshot)
            except Exception:
                pass

    def get_snapshot(self) -> SimulationSnapshot:
        """Get current simulation state as a snapshot."""
        return SimulationSnapshot(
            tick=self.tick,
            timestamp=time.time(),
            station_state=self.station.state,
            platforms=list(self.station.platforms.values()),
            trains=list(self.station.trains.values()),
            tracks=list(self.station.tracks.values()),
            crisis_probability=self.station.calculate_crisis_probability(),
            active_incidents=self.station.get_active_incidents(),
            forecasts=self.forecasts,
            active_plans=self.active_plans,
            selected_plan_id=self.selected_plan_id,
        )

    # === Scenario Execution ===

    def start_crisis_demo(self):
        """Start the compound failure crisis demo."""
        self.active_scenario = compound_failure_scenario()
        self.scenario_start_tick = self.tick
        self.event_store.append(SimulationEvent(
            type=EventType.DEMO_STARTED,
            timestamp=time.time(),
            tick=self.tick,
            severity="INFO",
            message=f"Crisis Demo Started: {self.active_scenario.name}",
            metadata={"scenario": self.active_scenario.name},
        ))

    def _process_scenario_tick(self):
        """Process any scenario steps that should fire this tick."""
        if not self.active_scenario:
            return

        elapsed = self.tick - self.scenario_start_tick

        for step in self.active_scenario.steps:
            if step.tick_offset == elapsed:
                self._execute_scenario_step(step)

        # Check if scenario is complete
        if elapsed > self.active_scenario.total_ticks:
            self.active_scenario = None
            self.event_store.append(SimulationEvent(
                type=EventType.DEMO_COMPLETED,
                timestamp=time.time(),
                tick=self.tick,
                severity="INFO",
                message="Crisis Demo Completed — All systems recovered",
            ))

    def _execute_scenario_step(self, step):
        """Execute a single scenario step."""
        handler_map = {
            "signal_failure": lambda p: self.station.trigger_signal_failure(p["track_id"]),
            "train_delay": lambda p: self.station.trigger_train_delay(p["train_id"], p["delay_minutes"]),
            "platform_closure": lambda p: self.station.trigger_platform_closure(p["platform_id"], p.get("reason", "")),
            "passenger_surge": lambda p: self.station.surge_passengers(p["platform_id"], p["count"]),
            "generate_forecast": lambda p: self._trigger_forecast(),
            "generate_plans": lambda p: self._trigger_plan_generation(),
            "select_plan": lambda p: self._select_plan(p["plan_id"]),
            "begin_mitigation": lambda p: self.station.begin_mitigation(p["platform_id"]),
            "drain_passengers": lambda p: self.station.drain_passengers(p["platform_id"], p.get("rate", 20)),
            "restore_signal": lambda p: self.station.restore_signal(p["track_id"]),
            "reopen_platform": lambda p: self.station.reopen_platform(p["platform_id"]),
            "release_train": lambda p: self.station.release_train(p["train_id"]),
            "recovery_achieved": lambda p: self._mark_recovery(),
        }

        handler = handler_map.get(step.handler_key)
        if handler:
            handler(step.params)

    def _trigger_forecast(self):
        """Generate forecasts using the forecast engine."""
        self.forecasts = self.forecast_engine.generate_forecasts(
            self.station.platforms,
            self.station.trains,
            self.config.simulation.forecast_horizons,
        )
        self.event_store.append(SimulationEvent(
            type=EventType.FORECAST_GENERATED,
            timestamp=time.time(),
            tick=self.tick,
            severity="MEDIUM",
            message="Forecast Agent: Density projections generated for all platforms",
            metadata={"horizons": self.config.simulation.forecast_horizons},
        ))

    def _trigger_plan_generation(self):
        """Generate intervention plans (called by agent system or scenario)."""
        # These will be overwritten by the real agent system when it runs
        self.active_plans = [
            InterventionPlan(
                id="plan-a",
                name="Hold Train + Overflow Gate",
                description="Hold Shatabdi Express at Platform 2 and open overflow gate to redistribute passengers to concourse.",
                actions=["Hold T-12302", "Open overflow gate on Platform 2", "Deploy crowd marshals"],
                projected_density_reduction=0.35,
                projected_risk_reduction=0.65,
                estimated_recovery_time=8.0,
                confidence=0.89,
                side_effects=["6-minute additional delay to T-12302", "Temporary crowding at concourse"],
            ),
            InterventionPlan(
                id="plan-b",
                name="Redirect to Platform 4",
                description="Redirect waiting passengers from Platform 2 to Platform 4 via underpass.",
                actions=["Open P2-P4 underpass", "Announce platform change", "Deploy marshals at underpass"],
                projected_density_reduction=0.28,
                projected_risk_reduction=0.52,
                estimated_recovery_time=12.0,
                confidence=0.74,
                side_effects=["Increased load on Platform 4", "Passenger confusion risk"],
            ),
            InterventionPlan(
                id="plan-c",
                name="Entry Restriction",
                description="Restrict station entry at gates A and B to reduce inflow rate.",
                actions=["Throttle Gate A to 50%", "Throttle Gate B to 50%", "Announce delay at entrance"],
                projected_density_reduction=0.18,
                projected_risk_reduction=0.38,
                estimated_recovery_time=18.0,
                confidence=0.92,
                side_effects=["External crowd buildup", "Negative passenger experience"],
            ),
        ]
        self.event_store.append(SimulationEvent(
            type=EventType.PLAN_GENERATED,
            timestamp=time.time(),
            tick=self.tick,
            severity="MEDIUM",
            message="Planning Agent: 3 intervention strategies generated",
            metadata={"planCount": 3},
        ))

    def _select_plan(self, plan_id: str):
        """Select a plan for execution."""
        self.selected_plan_id = plan_id
        plan = next((p for p in self.active_plans if p.id == plan_id), None)
        self.event_store.append(SimulationEvent(
            type=EventType.PLAN_SELECTED,
            timestamp=time.time(),
            tick=self.tick,
            severity="HIGH",
            message=f"Decision Agent: Selected '{plan.name if plan else plan_id}'",
            metadata={"planId": plan_id},
        ))

    def _mark_recovery(self):
        self.event_store.append(SimulationEvent(
            type=EventType.RECOVERY_ACHIEVED,
            timestamp=time.time(),
            tick=self.tick,
            severity="INFO",
            message="Recovery achieved — all platforms at normal density",
        ))
        self.active_plans.clear()
        self.selected_plan_id = None
        self.forecasts.clear()

    # === Manual controls ===

    def request_forecast(self):
        """Manually trigger a forecast."""
        self._trigger_forecast()
        return self.forecasts

    def set_plans(self, plans: list[InterventionPlan]):
        """Set plans from the agent system."""
        self.active_plans = plans

    def execute_plan(self, plan_id: str):
        """Execute a selected plan."""
        self._select_plan(plan_id)
