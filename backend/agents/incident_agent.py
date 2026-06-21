"""RailGuard AI — Incident Detection Agent (Real LLM)"""

from __future__ import annotations
from agents.state import AgentState, Incident
from agents.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
import json


INCIDENT_SYSTEM_PROMPT = """You are the Incident Detection Agent of RailGuard AI.

Your job: Monitor the current station state and recent events to detect active incidents.

Analyze:
- Signal failures on tracks
- Train delays
- Platform closures
- Abnormal crowd density (>70% is WARNING, >85% is CRITICAL)
- Rapid density increases (high inflow with low outflow)

For each detected incident, return a JSON object:
{
  "type": "<SIGNAL_FAILURE|TRAIN_DELAY|PLATFORM_CLOSURE|OVERCROWDING|CROWD_SURGE|CASCADING_FAILURE>",
  "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "description": "<clear description of the incident>",
  "affected_platform_ids": [<int>],
  "affected_train_ids": ["<string>"]
}

Severity guide:
- LOW: Minor issue, no immediate risk
- MEDIUM: Developing situation, monitor closely
- HIGH: Active risk, intervention recommended
- CRITICAL: Immediate danger, intervention required

Return a JSON array of all detected incidents. If no incidents, return [].
Return ONLY the JSON array, no markdown."""


async def incident_agent(state: AgentState) -> dict:
    """Incident Detection Agent: Monitors for delays, closures, signal failures, overcrowding."""
    llm = get_llm(temperature=0.1)

    # Build context
    platform_data = "\n".join([
        f"Platform {p.id} ({p.name}): density={p.current_density:.1%}, "
        f"passengers={p.passenger_count}/{p.capacity}, state={p.state}, closed={p.is_closed}"
        for p in state.platforms
    ])

    train_data = "\n".join([
        f"Train {t.id} ({t.name}): status={t.status}, delay={t.delay_minutes:.0f}min, platform={t.platform_id}"
        for t in state.trains
    ])

    track_data = "\n".join([
        f"Track {t.id}: signal_failure={t.has_signal_failure}, platforms={t.platform_ids}"
        for t in state.tracks
    ])

    recent_events = "\n".join([
        f"[{e.get('severity', 'INFO')}] {e.get('message', '')}"
        for e in state.recent_events[-10:]
    ])

    context = (
        f"Station State: {state.station_state}\n"
        f"Crisis Probability: {state.crisis_probability:.1%}\n\n"
        f"PLATFORMS:\n{platform_data}\n\n"
        f"TRAINS:\n{train_data}\n\n"
        f"TRACKS:\n{track_data}\n\n"
        f"RECENT EVENTS:\n{recent_events or 'None'}"
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=INCIDENT_SYSTEM_PROMPT),
            HumanMessage(content=f"Detect all active incidents:\n\n{context}"),
        ])

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]

        incidents_raw = json.loads(content)
        incidents = [Incident(**i) for i in incidents_raw]

        return {"incidents": incidents}
    except Exception as e:
        return {"errors": [f"Incident Agent error: {str(e)}"]}
