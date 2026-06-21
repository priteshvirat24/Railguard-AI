"""RailGuard AI — LangGraph Orchestrator

Real multi-agent workflow using LangGraph StateGraph.

Workflow:
  Observe → Forecast → Detect Incidents → (conditional) →
  Generate Plans → Simulate → Analyze Risk → Decide → Explain → Done
"""

from __future__ import annotations
from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.forecast_agent import forecast_agent
from agents.incident_agent import incident_agent
from agents.planning_agent import planning_agent
from agents.simulation_agent import simulation_agent
from agents.risk_agent import risk_agent
from agents.decision_agent import decision_agent
from agents.explainability_agent import explainability_agent
from agents.copilot_agent import copilot_agent


def should_generate_plans(state: AgentState) -> str:
    """
    Conditional edge: only generate plans if there are significant incidents
    or high-risk forecasts.
    """
    # Check if any incidents are HIGH or CRITICAL severity
    high_severity = any(
        i.severity in ("HIGH", "CRITICAL") for i in state.incidents
    )

    # Check if any forecast predicts WARNING or CRITICAL
    high_risk_forecast = any(
        f.predicted_state in ("WARNING", "CRITICAL") for f in state.forecasts
    )

    # Check if crisis probability is elevated
    elevated_crisis = state.crisis_probability > 0.4

    if high_severity or high_risk_forecast or elevated_crisis:
        return "generate_plans"
    else:
        return "end"


def build_agent_graph() -> StateGraph:
    """Build the LangGraph multi-agent workflow."""

    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("forecast", forecast_agent)
    graph.add_node("detect_incidents", incident_agent)
    graph.add_node("generate_plans", planning_agent)
    graph.add_node("simulate_plans", simulation_agent)
    graph.add_node("analyze_risk", risk_agent)
    graph.add_node("decide", decision_agent)
    graph.add_node("explain", explainability_agent)

    # Set entry point
    graph.set_entry_point("forecast")

    # Add edges
    graph.add_edge("forecast", "detect_incidents")

    # Conditional: only plan if incidents warrant it
    graph.add_conditional_edges(
        "detect_incidents",
        should_generate_plans,
        {
            "generate_plans": "generate_plans",
            "end": END,
        }
    )

    graph.add_edge("generate_plans", "simulate_plans")
    graph.add_edge("simulate_plans", "analyze_risk")
    graph.add_edge("analyze_risk", "decide")
    graph.add_edge("decide", "explain")
    graph.add_edge("explain", END)

    return graph


def build_copilot_graph() -> StateGraph:
    """Build a simple graph for copilot queries."""
    graph = StateGraph(AgentState)
    graph.add_node("copilot", copilot_agent)
    graph.set_entry_point("copilot")
    graph.add_edge("copilot", END)
    return graph


# Compile graphs
agent_workflow = build_agent_graph().compile()
copilot_workflow = build_copilot_graph().compile()
