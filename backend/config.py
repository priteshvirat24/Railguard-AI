"""RailGuard AI — Configuration"""

import os
from pydantic import BaseModel


class SimulationConfig(BaseModel):
    """Simulation engine configuration."""
    tick_rate: float = 1.0  # seconds between ticks
    num_platforms: int = 6
    num_tracks: int = 4
    max_platform_capacity: int = 500
    warning_threshold: float = 0.7
    critical_threshold: float = 0.85
    congesting_threshold: float = 0.55
    forecast_horizons: list[int] = [5, 10, 15, 20]  # minutes


class StationConfig(BaseModel):
    """Station layout configuration."""
    platforms: list[dict] = [
        {"id": 1, "name": "Platform 1", "capacity": 450, "x": -12, "z": -8},
        {"id": 2, "name": "Platform 2", "capacity": 500, "x": -4, "z": -8},
        {"id": 3, "name": "Platform 3", "capacity": 500, "x": 4, "z": -8},
        {"id": 4, "name": "Platform 4", "capacity": 400, "x": 12, "z": -8},
        {"id": 5, "name": "Platform 5", "capacity": 350, "x": -8, "z": 8},
        {"id": 6, "name": "Platform 6", "capacity": 350, "x": 8, "z": 8},
    ]
    tracks: list[dict] = [
        {"id": 1, "platforms": [1, 2], "z": -12},
        {"id": 2, "platforms": [2, 3], "z": -4},
        {"id": 3, "platforms": [3, 4], "z": 4},
        {"id": 4, "platforms": [5, 6], "z": 12},
    ]

def get_cors_origins():
    origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,https://frontend-qsi5bsfwg-priteshvirat24s-projects.vercel.app")
    return [o.strip() for o in origins.split(",")]

class AppConfig(BaseModel):
    """Application configuration."""
    simulation: SimulationConfig = SimulationConfig()
    station: StationConfig = StationConfig()
    websocket_heartbeat: int = 30  # seconds
    cors_origins: list[str] = get_cors_origins()
