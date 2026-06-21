"""RailGuard AI — Operations Copilot Agent (Real LLM + RAG)"""

from __future__ import annotations
from agents.state import AgentState
from agents.llm import get_llm
from knowledge.knowledge_base import knowledge_base
from langchain_core.messages import SystemMessage, HumanMessage


COPILOT_SYSTEM_PROMPT = """You are the Operations Copilot of RailGuard AI — a conversational AI assistant for railway station operators.

You have access to:
- Real-time station state (platform densities, train statuses, tracks)
- Active incidents and forecasts
- AI-generated intervention plans and their outcomes
- Railway operations knowledge base (safety rules, procedures, historical incidents)

Answer the operator's question directly and helpfully. Use specific data from the current state.

Capabilities:
- Explain why a plan was selected
- Describe what happens if no intervention is taken
- Identify the highest-risk platform
- Explain what caused a current surge
- Provide recommendations based on safety rules
- Answer questions about station operations

Be concise, authoritative, and data-driven. Use numbers and specific platform/train references.
Speak like a senior operations advisor, not a chatbot.

If the question is about the current state, use the real-time data provided.
If the question is about procedures or rules, reference the knowledge base.
If you don't have enough information, say so clearly."""


async def copilot_agent(state: AgentState) -> dict:
    """Operations Copilot: Answers operator questions using LLM + station state + RAG."""
    if not state.copilot_query:
        return {"copilot_response": ""}

    llm = get_llm(temperature=0.3)

    # RAG: Search knowledge base for relevant context
    knowledge_docs = await knowledge_base.search(state.copilot_query, top_k=4)

    # Build comprehensive context
    platform_state = "\n".join([
        f"Platform {p.id} ({p.name}): {p.passenger_count}/{p.capacity} "
        f"({p.current_density:.1%} density), state={p.state}, closed={p.is_closed}, "
        f"inflow={p.inflow_rate:.1f}/s, outflow={p.outflow_rate:.1f}/s"
        for p in state.platforms
    ])

    train_state = "\n".join([
        f"Train {t.id} ({t.name}): status={t.status}, platform={t.platform_id}, "
        f"delay={t.delay_minutes:.0f}min, passengers={t.passenger_load}"
        for t in state.trains
    ])

    track_state = "\n".join([
        f"Track {t.id}: signal_failure={t.has_signal_failure}"
        for t in state.tracks
    ])

    incidents_text = "\n".join([
        f"[{i.severity}] {i.type}: {i.description}"
        for i in state.incidents
    ]) or "No active incidents"

    forecasts_text = "\n".join([
        f"Platform {f.platform_id} in {f.minutes_ahead}min: "
        f"density={f.predicted_density:.1%} ({f.predicted_state})"
        for f in state.forecasts
    ]) or "No forecasts available"

    plans_text = ""
    if state.candidate_plans:
        for plan in state.candidate_plans:
            ranked = next((r for r in state.ranked_plans if r.plan_id == plan.id), None)
            plans_text += (
                f"\n{plan.name} (id: {plan.id}): {plan.description}\n"
                f"  Actions: {', '.join(plan.actions)}\n"
            )
            if ranked:
                plans_text += f"  Rank: {ranked.rank}, Score: {ranked.overall_score:.2f}\n"

    if state.selected_plan_id:
        plans_text += f"\nSelected Plan: {state.selected_plan_id}\n"
    if state.explanation:
        plans_text += f"Explanation: {state.explanation}\n"

    context = (
        f"STATION STATE: {state.station_state}\n"
        f"CRISIS PROBABILITY: {state.crisis_probability:.1%}\n\n"
        f"PLATFORMS:\n{platform_state}\n\n"
        f"TRAINS:\n{train_state}\n\n"
        f"TRACKS:\n{track_state}\n\n"
        f"ACTIVE INCIDENTS:\n{incidents_text}\n\n"
        f"FORECASTS:\n{forecasts_text}\n\n"
        f"INTERVENTION PLANS:\n{plans_text or 'None generated'}\n\n"
        f"RELEVANT KNOWLEDGE BASE:\n" + "\n\n".join(knowledge_docs)
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=COPILOT_SYSTEM_PROMPT),
            HumanMessage(content=f"CURRENT STATE:\n{context}\n\nOPERATOR QUESTION: {state.copilot_query}"),
        ])

        return {"copilot_response": response.content.strip()}
    except Exception as e:
        return {"copilot_response": f"Copilot error: {str(e)}"}
