"""RailGuard AI — Risk Analysis Agent (Real LLM)"""

from __future__ import annotations
from agents.state import AgentState, RiskAssessment
from agents.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
import json


RISK_SYSTEM_PROMPT = """You are the Risk Analysis Agent of RailGuard AI.

Your job: Evaluate the risk profile of each simulated plan outcome.

For each plan's simulated outcome, assess:
1. risk_score (0-1): Overall risk AFTER plan execution. 0 = no risk, 1 = maximum risk.
2. safety_improvement (0-1): How much safer the station becomes compared to doing nothing.
3. cascading_failure_risk (0-1): Risk that this intervention triggers new problems.
4. confidence (0-1): How confident you are in this assessment.
5. analysis: Brief text explaining the key risk factors.

Consider:
- Does the plan adequately reduce density on critical platforms?
- Could redirecting passengers create new bottlenecks?
- Does holding trains cause downstream delays?
- Is entry restriction sustainable for the projected duration?
- Are there single points of failure in the plan?

Return a JSON array of risk assessments:
{
  "plan_id": "<string>",
  "risk_score": <float 0-1>,
  "safety_improvement": <float 0-1>,
  "cascading_failure_risk": <float 0-1>,
  "confidence": <float 0-1>,
  "analysis": "<brief analysis>"
}

Return ONLY the JSON array, no markdown."""


async def risk_agent(state: AgentState) -> dict:
    """Risk Analysis Agent: Evaluates consequences and cascading failure risks."""
    if not state.simulated_outcomes:
        return {"risk_assessments": []}

    llm = get_llm(temperature=0.2)

    outcomes_text = "\n\n".join([
        f"PLAN: {o.plan_name} (id: {o.plan_id})\n"
        f"Projected densities: {o.projected_density_after}\n"
        f"Risk reduction: {o.projected_risk_reduction:.0%}\n"
        f"Recovery time: {o.projected_recovery_minutes:.0f} minutes\n"
        f"Side effects: {', '.join(o.side_effects)}\n"
        f"Confidence: {o.confidence:.0%}"
        for o in state.simulated_outcomes
    ])

    platform_state = "\n".join([
        f"Platform {p.id}: density={p.current_density:.1%}, state={p.state}"
        for p in state.platforms
    ])

    # Include knowledge context if available
    knowledge = "\n".join(state.knowledge_context[:3]) if state.knowledge_context else "No knowledge context"

    context = (
        f"CURRENT STATE:\n{platform_state}\n\n"
        f"SIMULATED OUTCOMES:\n{outcomes_text}\n\n"
        f"RELEVANT KNOWLEDGE:\n{knowledge}"
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=RISK_SYSTEM_PROMPT),
            HumanMessage(content=f"Assess risk for these plan outcomes:\n\n{context}"),
        ])

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]

        assessments_raw = json.loads(content)
        assessments = [RiskAssessment(**a) for a in assessments_raw]

        return {"risk_assessments": assessments}
    except Exception as e:
        return {"errors": [f"Risk Agent error: {str(e)}"]}
