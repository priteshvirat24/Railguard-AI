"""RailGuard AI — Crisis Scenarios"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Callable


@dataclass
class ScenarioStep:
    """A single step in a crisis scenario."""
    tick_offset: int  # ticks after scenario start
    action: str       # description of what happens
    handler_key: str  # key to look up the handler function
    params: dict      # parameters for the handler


class CrisisScenario:
    """A pre-built crisis scenario that can be played back."""

    def __init__(self, name: str, description: str, steps: list[ScenarioStep]):
        self.name = name
        self.description = description
        self.steps = sorted(steps, key=lambda s: s.tick_offset)
        self.total_ticks = max(s.tick_offset for s in steps) if steps else 0


def compound_failure_scenario() -> CrisisScenario:
    """
    Compound Failure Scenario:
    Signal Failure → Train Delay → Platform Closure → Passenger Accumulation
    → Critical Density → AI Intervention → Recovery
    """
    steps = [
        # Phase 1: Signal Failure (tick 0)
        ScenarioStep(
            tick_offset=0,
            action="Signal failure detected on Track 2",
            handler_key="signal_failure",
            params={"track_id": 2},
        ),

        # Phase 2: Train Delay (tick 5)
        ScenarioStep(
            tick_offset=5,
            action="Shatabdi Express delayed by 12 minutes due to signal failure",
            handler_key="train_delay",
            params={"train_id": "T-12302", "delay_minutes": 12},
        ),

        # Phase 3: Platform Closure (tick 10)
        ScenarioStep(
            tick_offset=10,
            action="Platform 3 closed for emergency inspection",
            handler_key="platform_closure",
            params={"platform_id": 3, "reason": "Emergency inspection due to signal fault"},
        ),

        # Phase 4: Passenger Surge begins (tick 15-25, multiple surges)
        ScenarioStep(
            tick_offset=15,
            action="Passengers redirected from Platform 3 to Platform 2",
            handler_key="passenger_surge",
            params={"platform_id": 2, "count": 60},
        ),
        ScenarioStep(
            tick_offset=18,
            action="Continued passenger accumulation on Platform 2",
            handler_key="passenger_surge",
            params={"platform_id": 2, "count": 50},
        ),
        ScenarioStep(
            tick_offset=21,
            action="Heavy accumulation — waiting passengers growing",
            handler_key="passenger_surge",
            params={"platform_id": 2, "count": 70},
        ),
        ScenarioStep(
            tick_offset=24,
            action="Platform 2 approaching capacity",
            handler_key="passenger_surge",
            params={"platform_id": 2, "count": 80},
        ),
        ScenarioStep(
            tick_offset=27,
            action="Surge continues from delayed train passengers",
            handler_key="passenger_surge",
            params={"platform_id": 2, "count": 40},
        ),

        # Phase 5: AI generates forecast (tick 30)
        ScenarioStep(
            tick_offset=30,
            action="Forecast Agent projects critical density in 11 minutes",
            handler_key="generate_forecast",
            params={},
        ),

        # Phase 6: AI generates intervention plans (tick 35)
        ScenarioStep(
            tick_offset=35,
            action="AI Planner generates 3 intervention strategies",
            handler_key="generate_plans",
            params={},
        ),

        # Phase 7: Best plan selected (tick 40)
        ScenarioStep(
            tick_offset=40,
            action="Decision Agent selects optimal intervention",
            handler_key="select_plan",
            params={"plan_id": "plan-a"},
        ),

        # Phase 8: Plan execution begins — mitigation (tick 45)
        ScenarioStep(
            tick_offset=45,
            action="Executing: Hold Shatabdi Express, open overflow gate on Platform 2",
            handler_key="begin_mitigation",
            params={"platform_id": 2},
        ),

        # Phase 9: Recovery draining (tick 48-65)
        ScenarioStep(
            tick_offset=48,
            action="Overflow gate draining passengers",
            handler_key="drain_passengers",
            params={"platform_id": 2, "rate": 30},
        ),
        ScenarioStep(
            tick_offset=52,
            action="Continued draining",
            handler_key="drain_passengers",
            params={"platform_id": 2, "rate": 35},
        ),
        ScenarioStep(
            tick_offset=56,
            action="Density dropping significantly",
            handler_key="drain_passengers",
            params={"platform_id": 2, "rate": 40},
        ),
        ScenarioStep(
            tick_offset=60,
            action="Near normal levels",
            handler_key="drain_passengers",
            params={"platform_id": 2, "rate": 45},
        ),

        # Phase 10: Signal restored (tick 62)
        ScenarioStep(
            tick_offset=62,
            action="Signal restored on Track 2",
            handler_key="restore_signal",
            params={"track_id": 2},
        ),

        # Phase 11: Platform reopened (tick 65)
        ScenarioStep(
            tick_offset=65,
            action="Platform 3 reopened after inspection",
            handler_key="reopen_platform",
            params={"platform_id": 3},
        ),

        # Phase 12: Train released (tick 68)
        ScenarioStep(
            tick_offset=68,
            action="Shatabdi Express cleared for departure",
            handler_key="release_train",
            params={"train_id": "T-12302"},
        ),

        # Phase 13: Full recovery (tick 75)
        ScenarioStep(
            tick_offset=75,
            action="All platforms returned to normal operation",
            handler_key="recovery_achieved",
            params={},
        ),
    ]

    return CrisisScenario(
        name="Compound Failure",
        description=(
            "A cascading failure scenario: signal failure causes train delay, "
            "which triggers platform closure, leading to dangerous passenger "
            "accumulation. AI detects, forecasts, plans, and executes recovery."
        ),
        steps=steps,
    )
