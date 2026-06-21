"""RailGuard AI — Simulation Agent (Real LLM)"""

from __future__ import annotations
from agents.state import AgentState, SimulatedOutcome
from agents.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
import json


SIMULATION_SYSTEM_PROMPT = """You are the Simulation Agent of RailGuard AI.

Your job: Simulate the projected outcome of each candidate intervention plan.

For each plan, estimate:
1. What the platform densities would be AFTER the plan is executed (over next 15 minutes)
2. How much risk would be reduced (0-1 scale)
3. How long recovery would take (in minutes)
4. What side effects would occur
5. Your confidence in this projection (0-1)

Use the current platform state, train data, and your understanding of railway operations.

For each plan, return a JSON object:
{
  "plan_id": "<string>",
  "plan_name": "<string>",
  "projected_density_after": {<platform_id>: <float 0-1>, ...},
  "projected_risk_reduction": <float 0-1>,
  "projected_recovery_minutes": <float>,
  "side_effects": ["<effect 1>", "<effect 2>"],
  "confidence": <float 0-1>
}

projected_density_after should contain the estimated density for each affected platform
15 minutes after plan execution.

Return ONLY a JSON array, no markdown."""


async def simulation_agent(state: AgentState) -> dict:
    """Simulation Agent: Simulates each candidate plan's projected outcome."""
    if not state.candidate_plans:
        return {"simulated_outcomes": []}

    llm = get_llm(temperature=0.3)

    plans_text = "\n\n".join([
        f"PLAN: {p.name} (id: {p.id})\n"
        f"Description: {p.description}\n"
        f"Actions: {', '.join(p.actions)}\n"
        f"Rationale: {p.rationale}"
        for p in state.candidate_plans
    ])

    platform_state = "\n".join([
        f"Platform {p.id} ({p.name}): density={p.current_density:.1%}, "
        f"passengers={p.passenger_count}/{p.capacity}, state={p.state}"
        for p in state.platforms
    ])

    train_state = "\n".join([
        f"Train {t.id} ({t.name}): status={t.status}, delay={t.delay_minutes:.0f}min, passengers={t.passenger_load}"
        for t in state.trains
    ])

    context = (
        f"CURRENT PLATFORMS:\n{platform_state}\n\n"
        f"CURRENT TRAINS:\n{train_state}\n\n"
        f"CANDIDATE PLANS:\n{plans_text}"
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=SIMULATION_SYSTEM_PROMPT),
            HumanMessage(content=f"Simulate the outcomes of these plans:\n\n{context}"),
        ])

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]

        outcomes_raw = json.loads(content)
        outcomes = [SimulatedOutcome(**o) for o in outcomes_raw]

        return {"simulated_outcomes": outcomes}
    except Exception as e:
        return {"errors": [f"Simulation Agent error: {str(e)}"]}
