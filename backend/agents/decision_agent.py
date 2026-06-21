"""RailGuard AI — Decision Agent (Real LLM)"""

from __future__ import annotations
from agents.state import AgentState, RankedPlan
from agents.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
import json


DECISION_SYSTEM_PROMPT = """You are the Decision Agent of RailGuard AI.

Your job: Compare all candidate plans with their simulated outcomes and risk assessments, then rank them and select the optimal intervention.

Consider:
1. Risk reduction effectiveness (higher = better)
2. Recovery time (shorter = better)
3. Cascading failure risk (lower = better)
4. Safety improvement (higher = better)
5. Side effects severity
6. Overall confidence

For each plan, return a ranked assessment:
{
  "plan_id": "<string>",
  "plan_name": "<string>",
  "rank": <1|2|3>,
  "overall_score": <float 0-1, higher = better>,
  "recommendation": "<STRONGLY_RECOMMENDED|RECOMMENDED|ACCEPTABLE|NOT_RECOMMENDED>",
  "tradeoffs": "<brief explanation of key tradeoffs>"
}

Rank 1 = best plan.
Also set selected_plan_id to the plan_id of the rank 1 plan.

Return a JSON object with:
{
  "ranked_plans": [<array of ranked plan objects>],
  "selected_plan_id": "<plan_id of rank 1>"
}

Return ONLY the JSON object, no markdown."""


async def decision_agent(state: AgentState) -> dict:
    """Decision Agent: Compares, ranks, and selects the optimal intervention plan."""
    if not state.candidate_plans:
        return {"ranked_plans": [], "selected_plan_id": None}

    llm = get_llm(temperature=0.1)

    plans_text = ""
    for plan in state.candidate_plans:
        outcome = next((o for o in state.simulated_outcomes if o.plan_id == plan.id), None)
        risk = next((r for r in state.risk_assessments if r.plan_id == plan.id), None)

        plans_text += f"\n--- {plan.name} (id: {plan.id}) ---\n"
        plans_text += f"Actions: {', '.join(plan.actions)}\n"
        if outcome:
            plans_text += (
                f"Projected risk reduction: {outcome.projected_risk_reduction:.0%}\n"
                f"Recovery time: {outcome.projected_recovery_minutes:.0f} min\n"
                f"Side effects: {', '.join(outcome.side_effects)}\n"
                f"Simulation confidence: {outcome.confidence:.0%}\n"
            )
        if risk:
            plans_text += (
                f"Risk score: {risk.risk_score:.2f}\n"
                f"Safety improvement: {risk.safety_improvement:.0%}\n"
                f"Cascading failure risk: {risk.cascading_failure_risk:.0%}\n"
                f"Risk analysis: {risk.analysis}\n"
            )

    context = (
        f"Station State: {state.station_state}\n"
        f"Crisis Probability: {state.crisis_probability:.1%}\n"
        f"Active Incidents: {len(state.incidents)}\n\n"
        f"PLANS WITH OUTCOMES AND RISK:\n{plans_text}"
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=DECISION_SYSTEM_PROMPT),
            HumanMessage(content=f"Rank and select the best plan:\n\n{context}"),
        ])

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]

        result = json.loads(content)
        ranked = [RankedPlan(**rp) for rp in result["ranked_plans"]]

        return {
            "ranked_plans": ranked,
            "selected_plan_id": result.get("selected_plan_id"),
        }
    except Exception as e:
        return {"errors": [f"Decision Agent error: {str(e)}"]}
