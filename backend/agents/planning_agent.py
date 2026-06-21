"""RailGuard AI — Planning Agent (Real LLM + RAG)"""

from __future__ import annotations
from agents.state import AgentState, CandidatePlan
from agents.llm import get_llm
from knowledge.knowledge_base import knowledge_base
from langchain_core.messages import SystemMessage, HumanMessage
import json


PLANNING_SYSTEM_PROMPT = """You are the Planning Agent of RailGuard AI, a railway operations intelligence platform.

Your job: Generate 3 distinct intervention strategies to address the current situation.

You have access to railway operations knowledge, safety rules, and historical incidents.

Available interventions:
1. HOLD TRAIN — Hold a train at platform or approaching position to reduce passenger discharge
2. REDIRECT PASSENGERS — Redirect passengers from one platform to another
3. OPEN OVERFLOW GATE — Open overflow gates to increase outflow to concourse
4. RESTRICT ENTRY — Reduce or stop station entry at gates
5. DEPLOY MARSHALS — Send crowd management personnel
6. CANCEL/REROUTE TRAIN — Cancel or reroute a train
7. EMERGENCY ANNOUNCEMENT — Make public announcements

For each plan, return a JSON object:
{
  "id": "plan-a" | "plan-b" | "plan-c",
  "name": "<short descriptive name>",
  "description": "<detailed description of the intervention>",
  "actions": ["<action 1>", "<action 2>", ...],
  "rationale": "<why this plan would work, referencing knowledge base if relevant>"
}

Generate exactly 3 plans:
- Plan A: Most aggressive/effective (fastest recovery)
- Plan B: Balanced approach (moderate disruption)
- Plan C: Minimal intervention (least disruptive but slower)

Return ONLY a JSON array of 3 plans, no markdown."""


async def planning_agent(state: AgentState) -> dict:
    """Planning Agent: Generates intervention strategies using LLM + RAG knowledge."""
    llm = get_llm(temperature=0.4)

    # RAG: Retrieve relevant knowledge
    query_parts = []
    for incident in state.incidents:
        query_parts.append(incident.description)
    for forecast in state.forecasts:
        if forecast.predicted_state in ("WARNING", "CRITICAL"):
            query_parts.append(
                f"Platform {forecast.platform_id} predicted {forecast.predicted_state} "
                f"density {forecast.predicted_density:.0%} in {forecast.minutes_ahead} minutes"
            )

    rag_query = " ".join(query_parts) if query_parts else "general crowd management railway operations"
    knowledge_docs = await knowledge_base.search(rag_query, top_k=6)
    knowledge_context = "\n\n".join(knowledge_docs)

    # Build context
    incident_summary = "\n".join([
        f"[{i.severity}] {i.type}: {i.description}"
        for i in state.incidents
    ]) or "No active incidents"

    forecast_summary = "\n".join([
        f"Platform {f.platform_id} ({f.platform_name}) in {f.minutes_ahead}min: "
        f"density={f.predicted_density:.1%} ({f.predicted_state}), confidence={f.confidence:.0%}"
        for f in state.forecasts
        if f.predicted_state in ("WARNING", "CRITICAL", "CONGESTING")
    ]) or "No concerning forecasts"

    platform_summary = "\n".join([
        f"Platform {p.id} ({p.name}): {p.passenger_count}/{p.capacity} "
        f"({p.current_density:.1%}), state={p.state}, closed={p.is_closed}"
        for p in state.platforms
    ])

    train_summary = "\n".join([
        f"Train {t.id} ({t.name}): status={t.status}, delay={t.delay_minutes:.0f}min, "
        f"platform={t.platform_id}, passengers={t.passenger_load}"
        for t in state.trains
    ])

    context = (
        f"ACTIVE INCIDENTS:\n{incident_summary}\n\n"
        f"CONCERNING FORECASTS:\n{forecast_summary}\n\n"
        f"CURRENT PLATFORMS:\n{platform_summary}\n\n"
        f"TRAINS:\n{train_summary}\n\n"
        f"RAILWAY OPERATIONS KNOWLEDGE:\n{knowledge_context}"
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=PLANNING_SYSTEM_PROMPT),
            HumanMessage(content=f"Generate 3 intervention plans for:\n\n{context}"),
        ])

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]

        plans_raw = json.loads(content)
        plans = [CandidatePlan(**p) for p in plans_raw]

        return {
            "candidate_plans": plans,
            "knowledge_context": knowledge_docs,
        }
    except Exception as e:
        return {"errors": [f"Planning Agent error: {str(e)}"]}
