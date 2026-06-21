"""RailGuard AI — Forecast Agent (Real LLM)"""

from __future__ import annotations
from agents.state import AgentState, DensityForecast
from agents.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
import json


FORECAST_SYSTEM_PROMPT = """You are the Forecast Agent of RailGuard AI, a railway operations intelligence platform.

Your job: Predict future passenger density for each platform at 5, 10, 15, and 20 minutes ahead.

You receive current platform data (passenger counts, densities, inflow/outflow rates, states) and train data (positions, delays, passenger loads).

Analyze the data and produce density forecasts. Consider:
- Current inflow/outflow rates and their projected continuation
- Approaching trains that will discharge passengers
- Delayed trains causing passenger accumulation
- Closed platforms redirecting passengers to neighbors
- Historical patterns (peak hours have 35-50% higher load)

Return a JSON array of forecasts. Each forecast object:
{
  "platform_id": <int>,
  "platform_name": "<string>",
  "minutes_ahead": <5|10|15|20>,
  "predicted_density": <float 0-1>,
  "predicted_passenger_count": <int>,
  "predicted_state": "<NORMAL|CONGESTING|WARNING|CRITICAL>",
  "confidence": <float 0-1>
}

Rules for predicted_state:
- NORMAL: density < 0.55
- CONGESTING: density 0.55-0.70
- WARNING: density 0.70-0.85
- CRITICAL: density >= 0.85

Return ONLY the JSON array, no markdown, no explanation."""


async def forecast_agent(state: AgentState) -> dict:
    """Forecast Agent: Predicts future density using LLM analysis."""
    llm = get_llm(temperature=0.2)

    # Build context
    platform_data = []
    for p in state.platforms:
        platform_data.append(
            f"Platform {p.id} ({p.name}): {p.passenger_count}/{p.capacity} passengers "
            f"({p.current_density:.1%} density), state={p.state}, "
            f"inflow={p.inflow_rate:.1f}/tick, outflow={p.outflow_rate:.1f}/tick, "
            f"closed={p.is_closed}"
        )

    train_data = []
    for t in state.trains:
        train_data.append(
            f"Train {t.id} ({t.name}): platform={t.platform_id}, status={t.status}, "
            f"position={t.position:.2f}, delay={t.delay_minutes:.0f}min, "
            f"passengers={t.passenger_load}"
        )

    context = (
        f"Station State: {state.station_state}\n"
        f"Crisis Probability: {state.crisis_probability:.1%}\n"
        f"Current Tick: {state.tick}\n\n"
        f"PLATFORMS:\n" + "\n".join(platform_data) + "\n\n"
        f"TRAINS:\n" + "\n".join(train_data)
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=FORECAST_SYSTEM_PROMPT),
            HumanMessage(content=f"Generate density forecasts for the following station state:\n\n{context}"),
        ])

        # Parse JSON response
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]

        forecasts_raw = json.loads(content)
        forecasts = [DensityForecast(**f) for f in forecasts_raw]

        return {"forecasts": forecasts}
    except Exception as e:
        return {"errors": [f"Forecast Agent error: {str(e)}"]}
