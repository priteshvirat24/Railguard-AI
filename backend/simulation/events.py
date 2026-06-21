"""RailGuard AI — Event Sourcing System"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional
import time
import uuid


class EventType(str, Enum):
    # Train events
    TRAIN_ARRIVED = "TRAIN_ARRIVED"
    TRAIN_DEPARTED = "TRAIN_DEPARTED"
    TRAIN_DELAYED = "TRAIN_DELAYED"
    TRAIN_HELD = "TRAIN_HELD"
    TRAIN_RELEASED = "TRAIN_RELEASED"

    # Platform events
    PLATFORM_STATE_CHANGED = "PLATFORM_STATE_CHANGED"
    PLATFORM_CLOSED = "PLATFORM_CLOSED"
    PLATFORM_REOPENED = "PLATFORM_REOPENED"
    DENSITY_THRESHOLD_CROSSED = "DENSITY_THRESHOLD_CROSSED"
    CRITICAL_DENSITY_REACHED = "CRITICAL_DENSITY_REACHED"

    # Infrastructure events
    SIGNAL_FAILURE = "SIGNAL_FAILURE"
    SIGNAL_RESTORED = "SIGNAL_RESTORED"

    # AI events
    FORECAST_GENERATED = "FORECAST_GENERATED"
    PLAN_GENERATED = "PLAN_GENERATED"
    PLAN_SELECTED = "PLAN_SELECTED"
    PLAN_EXECUTED = "PLAN_EXECUTED"
    INTERVENTION_STARTED = "INTERVENTION_STARTED"
    RECOVERY_ACHIEVED = "RECOVERY_ACHIEVED"

    # System events
    SIMULATION_STARTED = "SIMULATION_STARTED"
    SIMULATION_PAUSED = "SIMULATION_PAUSED"
    SIMULATION_RESET = "SIMULATION_RESET"
    DEMO_STARTED = "DEMO_STARTED"
    DEMO_COMPLETED = "DEMO_COMPLETED"

    # Overflow / reroute
    OVERFLOW_GATE_OPENED = "OVERFLOW_GATE_OPENED"
    PASSENGERS_REDIRECTED = "PASSENGERS_REDIRECTED"
    ENTRY_RESTRICTED = "ENTRY_RESTRICTED"


@dataclass
class SimulationEvent:
    """An immutable event in the simulation timeline."""
    type: EventType
    timestamp: float
    tick: int
    severity: str = "INFO"  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    message: str = ""
    metadata: dict = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "timestamp": self.timestamp,
            "tick": self.tick,
            "severity": self.severity,
            "message": self.message,
            "metadata": self.metadata,
        }


class EventStore:
    """Append-only event store for the simulation timeline."""

    def __init__(self):
        self.events: list[SimulationEvent] = []
        self._listeners: list = []

    def append(self, event: SimulationEvent):
        self.events.append(event)
        for listener in self._listeners:
            listener(event)

    def subscribe(self, listener):
        self._listeners.append(listener)

    def get_events(self, since_tick: int = 0) -> list[SimulationEvent]:
        return [e for e in self.events if e.tick >= since_tick]

    def get_recent(self, count: int = 20) -> list[SimulationEvent]:
        return self.events[-count:]

    def get_by_type(self, event_type: EventType) -> list[SimulationEvent]:
        return [e for e in self.events if e.type == event_type]

    def clear(self):
        self.events.clear()

    def to_dict_list(self, count: int = 50) -> list[dict]:
        return [e.to_dict() for e in self.events[-count:]]
