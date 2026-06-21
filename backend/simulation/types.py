"""RailGuard AI — Simulation Data Types"""

from __future__ import annotations
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import time


class PlatformState(str, Enum):
    NORMAL = "NORMAL"
    CONGESTING = "CONGESTING"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    MITIGATING = "MITIGATING"
    RECOVERING = "RECOVERING"
    CLOSED = "CLOSED"


class TrainStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    APPROACHING = "APPROACHING"
    STOPPED = "STOPPED"
    BOARDING = "BOARDING"
    DEPARTING = "DEPARTING"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"


class StationState(str, Enum):
    NORMAL = "NORMAL"
    MONITORING = "MONITORING"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    MITIGATING = "MITIGATING"
    RECOVERING = "RECOVERING"


class EventSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class Platform:
    id: int
    name: str
    capacity: int
    x: float
    z: float
    current_density: float = 0.0  # 0.0 to 1.0
    passenger_count: int = 0
    state: PlatformState = PlatformState.NORMAL
    inflow_rate: float = 0.0  # passengers per tick
    outflow_rate: float = 0.0
    is_closed: bool = False

    def density_ratio(self) -> float:
        return self.passenger_count / self.capacity if self.capacity > 0 else 0.0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "capacity": self.capacity,
            "x": self.x,
            "z": self.z,
            "currentDensity": self.current_density,
            "passengerCount": self.passenger_count,
            "state": self.state.value,
            "inflowRate": self.inflow_rate,
            "outflowRate": self.outflow_rate,
            "isClosed": self.is_closed,
        }


@dataclass
class Train:
    id: str
    name: str
    platform_id: int
    track_id: int
    status: TrainStatus = TrainStatus.SCHEDULED
    scheduled_arrival: float = 0.0
    actual_arrival: float = 0.0
    scheduled_departure: float = 0.0
    actual_departure: float = 0.0
    delay_minutes: float = 0.0
    passenger_load: int = 0
    position: float = 0.0  # 0.0 = far away, 1.0 = at platform

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "platformId": self.platform_id,
            "trackId": self.track_id,
            "status": self.status.value,
            "scheduledArrival": self.scheduled_arrival,
            "actualArrival": self.actual_arrival,
            "scheduledDeparture": self.scheduled_departure,
            "actualDeparture": self.actual_departure,
            "delayMinutes": self.delay_minutes,
            "passengerLoad": self.passenger_load,
            "position": self.position,
        }


@dataclass
class Track:
    id: int
    platform_ids: list[int]
    z: float
    has_signal_failure: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "platformIds": self.platform_ids,
            "z": self.z,
            "hasSignalFailure": self.has_signal_failure,
        }


@dataclass
class ForecastPoint:
    """A single forecast data point for a platform at a future time."""
    platform_id: int
    minutes_ahead: int
    predicted_density: float
    predicted_passenger_count: int
    predicted_state: PlatformState
    confidence: float = 0.85

    def to_dict(self) -> dict:
        return {
            "platformId": self.platform_id,
            "minutesAhead": self.minutes_ahead,
            "predictedDensity": self.predicted_density,
            "predictedPassengerCount": self.predicted_passenger_count,
            "predictedState": self.predicted_state.value,
            "confidence": self.confidence,
        }


@dataclass
class InterventionPlan:
    """An AI-generated intervention plan."""
    id: str
    name: str
    description: str
    actions: list[str]
    projected_density_reduction: float
    projected_risk_reduction: float
    estimated_recovery_time: float  # minutes
    confidence: float
    side_effects: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "actions": self.actions,
            "projectedDensityReduction": self.projected_density_reduction,
            "projectedRiskReduction": self.projected_risk_reduction,
            "estimatedRecoveryTime": self.estimated_recovery_time,
            "confidence": self.confidence,
            "sideEffects": self.side_effects,
        }


@dataclass
class SimulationSnapshot:
    """Complete state of the simulation at a point in time."""
    tick: int
    timestamp: float
    station_state: StationState
    platforms: list[Platform]
    trains: list[Train]
    tracks: list[Track]
    crisis_probability: float
    active_incidents: int
    forecasts: list[ForecastPoint] = field(default_factory=list)
    active_plans: list[InterventionPlan] = field(default_factory=list)
    selected_plan_id: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "tick": self.tick,
            "timestamp": self.timestamp,
            "stationState": self.station_state.value,
            "platforms": [p.to_dict() for p in self.platforms],
            "trains": [t.to_dict() for t in self.trains],
            "tracks": [t.to_dict() for t in self.tracks],
            "crisisProbability": self.crisis_probability,
            "activeIncidents": self.active_incidents,
            "forecasts": [f.to_dict() for f in self.forecasts],
            "activePlans": [p.to_dict() for p in self.active_plans],
            "selectedPlanId": self.selected_plan_id,
        }
