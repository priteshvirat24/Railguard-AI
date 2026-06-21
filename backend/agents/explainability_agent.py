"""RailGuard AI — Explainability Agent (Real LLM + RAG)"""

from __future__ import annotations
from agents.state import AgentState
from agents.llm import get_llm
from knowledge.knowledge_base import knowledge_base
from langchain_core.messages import SystemMessage, HumanMessage


EXPLAIN_SYSTEM_PROMPT = """You are the Explainability Agent of RailGuard AI.

Your job: Generate a clear, operator-friendly explanation of WHY the selected intervention was chosen.

Your explanation should:
1. State what was detected (incidents, overcrowding)
2. State what was predicted (forecasts)
3. Explain what the selected plan does
4. Justify WHY this plan was selected over alternatives
5. Reference relevant safety rules or operational knowledge
6. Be concise but thorough (2-4 paragraphs)

Speak as a confident operations advisor. Use specific numbers.
Example tone: "Train 12302 should be held for 6 minutes because platform density is projected to exceed safe thresholds in 11 minutes."

Return ONLY the explanation text, no JSON, no markdown formatting."""


async def explainability_agent(state: AgentState) -> dict:
    """Explainability Agent: Explains decisions in operator-friendly language."""
    if not state.selected_plan_id:
        return {"explanation": "No plan has been selected yet."}

    llm = get_llm(temperature=0.4)

    selected_plan = next(
        (p for p in state.candidate_plans if p.id == state.selected_plan_id),
        None
    )
    selected_outcome = next(
        (o for o in state.simulated_outcomes if o.plan_id == state.selected_plan_id),
        None
    )
    selected_risk = next(
        (r for r in state.risk_assessments if r.plan_id == state.selected_plan_id),
        None
    )
    selected_ranked = next(
        (r for r in state.ranked_plans if r.plan_id == state.selected_plan_id),
        None
    )

    # RAG: Get relevant knowledge for the explanation
    rag_query = f"justify intervention {selected_plan.name if selected_plan else ''} crowd management safety"
    knowledge_docs = await knowledge_base.search(rag_query, top_k=3)

    # Build context
    incident_text = "\n".join([f"- [{i.severity}] {i.description}" for i in state.incidents]) or "None"
    forecast_text = "\n".join([
        f"- Platform {f.platform_id}: {f.predicted_density:.0%} in {f.minutes_ahead}min ({f.predicted_state})"
        for f in state.forecasts if f.predicted_state in ("WARNING", "CRITICAL")
    ]) or "No critical forecasts"

    alt_plans = "\n".join([
        f"- {p.name}: {p.description}" for p in state.candidate_plans if p.id != state.selected_plan_id
    ])

    context = (
        f"INCIDENTS:\n{incident_text}\n\n"
        f"CRITICAL FORECASTS:\n{forecast_text}\n\n"
        f"SELECTED PLAN: {selected_plan.name if selected_plan else 'Unknown'}\n"
        f"Actions: {', '.join(selected_plan.actions) if selected_plan else 'N/A'}\n"
        f"Description: {selected_plan.description if selected_plan else 'N/A'}\n\n"
        f"PROJECTED OUTCOME:\n"
        f"Risk reduction: {selected_outcome.projected_risk_reduction:.0%}\n" if selected_outcome else ""
        f"Recovery time: {selected_outcome.projected_recovery_minutes:.0f} min\n" if selected_outcome else ""
        f"Confidence: {selected_outcome.confidence:.0%}\n\n" if selected_outcome else ""
        f"ALTERNATIVE PLANS (not selected):\n{alt_plans}\n\n"
        f"RELEVANT SAFETY RULES & PROCEDURES:\n" + "\n".join(knowledge_docs)
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=EXPLAIN_SYSTEM_PROMPT),
            HumanMessage(content=f"Explain the decision:\n\n{context}"),
        ])

        return {"explanation": response.content.strip()}
    except Exception as e:
        return {"errors": [f"Explainability Agent error: {str(e)}"]}
