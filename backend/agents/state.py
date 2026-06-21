"""RailGuard AI — Agent State Schema & Shared Types"""

from __future__ import annotations
from typing import Optional, Annotated
from pydantic import BaseModel, Field
import operator


class PlatformSnapshot(BaseModel):
    id: int
    name: str
    capacity: int
    passenger_count: int
    current_density: float
    state: str
    inflow_rate: float
    outflow_rate: float
    is_closed: bool


class TrainSnapshot(BaseModel):
    id: str
    name: str
    platform_id: int
    status: str
    delay_minutes: float
    passenger_load: int
    position: float


class TrackSnapshot(BaseModel):
    id: int
    platform_ids: list[int]
    has_signal_failure: bool


class DensityForecast(BaseModel):
    platform_id: int
    platform_name: str
    minutes_ahead: int
    predicted_density: float
    predicted_passenger_count: int
    predicted_state: str
    confidence: float


class Incident(BaseModel):
    type: str
    severity: str
    description: str
    affected_platform_ids: list[int] = []
    affected_train_ids: list[str] = []
    timestamp: float = 0.0


class CandidatePlan(BaseModel):
    id: str
    name: str
    description: str
    actions: list[str]
    rationale: str = ""


class SimulatedOutcome(BaseModel):
    plan_id: str
    plan_name: str
    projected_density_after: dict[int, float] = {}  # platform_id -> density
    projected_risk_reduction: float = 0.0
    projected_recovery_minutes: float = 0.0
    side_effects: list[str] = []
    confidence: float = 0.0


class RiskAssessment(BaseModel):
    plan_id: str
    risk_score: float  # 0-1, lower is better
    safety_improvement: float
    cascading_failure_risk: float
    confidence: float
    analysis: str = ""


class RankedPlan(BaseModel):
    plan_id: str
    plan_name: str
    rank: int
    overall_score: float
    recommendation: str
    tradeoffs: str


class AgentState(BaseModel):
    """Shared state passed through the LangGraph workflow."""

    # Station snapshot
    platforms: list[PlatformSnapshot] = []
    trains: list[TrainSnapshot] = []
    tracks: list[TrackSnapshot] = []
    station_state: str = "NORMAL"
    crisis_probability: float = 0.0

    # Recent events (last 20)
    recent_events: list[dict] = []

    # Agent outputs (each agent appends)
    forecasts: list[DensityForecast] = []
    incidents: list[Incident] = []
    candidate_plans: list[CandidatePlan] = []
    simulated_outcomes: list[SimulatedOutcome] = []
    risk_assessments: list[RiskAssessment] = []
    ranked_plans: list[RankedPlan] = []

    # Decision
    selected_plan_id: Optional[str] = None
    explanation: str = ""
    operator_summary: str = ""

    # Copilot
    copilot_query: str = ""
    copilot_response: str = ""

    # Knowledge base context
    knowledge_context: list[str] = []

    # Metadata
    tick: int = 0
    errors: list[str] = []
