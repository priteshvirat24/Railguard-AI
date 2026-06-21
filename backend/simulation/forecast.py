"""RailGuard AI — Forecast Engine"""

from __future__ import annotations
from simulation.types import (
    Platform, PlatformState, ForecastPoint, Train, TrainStatus,
)
import math
import random


class ForecastEngine:
    """Projects future platform density based on current flow rates and train schedules."""

    def __init__(self):
        self.ticks_per_minute = 60  # assuming 1 tick per second

    def generate_forecasts(
        self,
        platforms: dict[int, Platform],
        trains: dict[str, Train],
        horizons: list[int] = [5, 10, 15, 20],
    ) -> list[ForecastPoint]:
        """Generate density forecasts for all platforms at given time horizons."""
        forecasts = []

        for platform in platforms.values():
            for minutes in horizons:
                forecast = self._forecast_platform(platform, trains, minutes)
                forecasts.append(forecast)

        return forecasts

    def _forecast_platform(
        self, platform: Platform, trains: dict[str, Train], minutes_ahead: int
    ) -> ForecastPoint:
        """Forecast a single platform's density at a future time."""
        ticks_ahead = minutes_ahead * self.ticks_per_minute
        current_count = platform.passenger_count

        # Calculate net flow rate
        net_inflow = platform.inflow_rate - platform.outflow_rate

        # Project passenger accumulation
        projected_count = current_count + (net_inflow * ticks_ahead)

        # Factor in approaching trains (they'll dump passengers)
        for train in trains.values():
            if train.platform_id == platform.id:
                if train.status == TrainStatus.APPROACHING:
                    # Train will arrive, passengers disembark
                    eta_ticks = max(0, (1.0 - train.position) / 0.02)
                    if eta_ticks < ticks_ahead:
                        projected_count += train.passenger_load * 0.4  # 40% disembark

                elif train.status == TrainStatus.DELAYED:
                    # Delayed train means passengers accumulate waiting
                    projected_count += train.delay_minutes * 8  # ~8 pax per minute waiting

        # Factor in platform closure effects on neighbors
        if platform.is_closed:
            projected_count = platform.passenger_count  # no new passengers
        else:
            # Closed neighboring platforms redirect passengers here
            pass

        # Apply capacity ceiling with overflow
        projected_count = max(0, projected_count)
        projected_density = min(1.0, projected_count / platform.capacity) if platform.capacity > 0 else 0.0

        # Determine predicted state
        predicted_state = self._density_to_state(projected_density, platform.state)

        # Confidence decreases with time horizon
        confidence = max(0.5, 0.95 - (minutes_ahead * 0.025))
        # Add noise proportional to horizon
        noise = random.gauss(0, 0.02 * minutes_ahead)
        projected_density = max(0, min(1.0, projected_density + noise))

        return ForecastPoint(
            platform_id=platform.id,
            minutes_ahead=minutes_ahead,
            predicted_density=round(projected_density, 3),
            predicted_passenger_count=int(projected_count),
            predicted_state=predicted_state,
            confidence=round(confidence, 3),
        )

    def _density_to_state(self, density: float, current_state: PlatformState) -> PlatformState:
        if current_state in (PlatformState.MITIGATING, PlatformState.RECOVERING):
            return current_state
        if density >= 0.85:
            return PlatformState.CRITICAL
        elif density >= 0.7:
            return PlatformState.WARNING
        elif density >= 0.55:
            return PlatformState.CONGESTING
        return PlatformState.NORMAL
