/* ─── RailGuard AI — TypeScript Types ─── */

export type PlatformState =
  | "NORMAL"
  | "CONGESTING"
  | "WARNING"
  | "CRITICAL"
  | "MITIGATING"
  | "RECOVERING"
  | "CLOSED";

export type TrainStatus =
  | "SCHEDULED"
  | "APPROACHING"
  | "STOPPED"
  | "BOARDING"
  | "DEPARTING"
  | "DELAYED"
  | "CANCELLED";

export type StationState =
  | "NORMAL"
  | "MONITORING"
  | "WARNING"
  | "CRITICAL"
  | "MITIGATING"
  | "RECOVERING";

export interface Platform {
  id: number;
  name: string;
  capacity: number;
  x: number;
  z: number;
  currentDensity: number;
  passengerCount: number;
  state: PlatformState;
  inflowRate: number;
  outflowRate: number;
  isClosed: boolean;
}

export interface Train {
  id: string;
  name: string;
  platformId: number;
  trackId: number;
  status: TrainStatus;
  scheduledArrival: number;
  actualArrival: number;
  scheduledDeparture: number;
  actualDeparture: number;
  delayMinutes: number;
  passengerLoad: number;
  position: number;
}

export interface Track {
  id: number;
  platformIds: number[];
  z: number;
  hasSignalFailure: boolean;
}

export interface ForecastPoint {
  platformId: number;
  minutesAhead: number;
  predictedDensity: number;
  predictedPassengerCount: number;
  predictedState: PlatformState;
  confidence: number;
}

export interface InterventionPlan {
  id: string;
  name: string;
  description: string;
  actions: string[];
  projectedDensityReduction: number;
  projectedRiskReduction: number;
  estimatedRecoveryTime: number;
  confidence: number;
  sideEffects: string[];
}

export interface RankedPlan {
  planId: string;
  planName: string;
  rank: number;
  overallScore: number;
  recommendation: string;
  tradeoffs: string;
}

export interface SimulationEvent {
  id: string;
  type: string;
  timestamp: number;
  tick: number;
  severity: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface SimulationSnapshot {
  tick: number;
  timestamp: number;
  stationState: StationState;
  platforms: Platform[];
  trains: Train[];
  tracks: Track[];
  crisisProbability: number;
  activeIncidents: number;
  forecasts: ForecastPoint[];
  activePlans: InterventionPlan[];
  selectedPlanId: string | null;
}

export interface AgentResult {
  status: string;
  forecasts: unknown[];
  incidents: unknown[];
  candidate_plans: unknown[];
  simulated_outcomes: unknown[];
  risk_assessments: unknown[];
  ranked_plans: RankedPlan[];
  selected_plan_id: string | null;
  explanation: string;
  errors: string[];
}
