import logging
from typing import Literal
from langgraph.graph import StateGraph, END
from src.agent.state import SREState
from src.agent.nodes import evaluate_drift_node, retrain_model_node, deploy_model_node

logger = logging.getLogger(__name__)

def route_drift_decision(state: SREState) -> Literal["retrain_model_node", "__end__"]:
    """
    Conditional routing logic based on the output of the evaluate_drift_node.
    """
    if state.get("drift_detected", False):
        logger.info("Router: Drift detected -> Routing to Retraining Node.")
        return "retrain_model_node"
    
    logger.info("Router: No drift detected -> Ending Workflow.")
    return END

def create_sre_workflow() -> StateGraph:
    """
    Compile and return the Autonomous SRE LangGraph.
    """
    workflow = StateGraph(SREState)
    
    # Add nodes
    workflow.add_node("evaluate_drift_node", evaluate_drift_node)
    workflow.add_node("retrain_model_node", retrain_model_node)
    workflow.add_node("deploy_model_node", deploy_model_node)
    
    # Set entry point
    workflow.set_entry_point("evaluate_drift_node")
    
    # Add conditional edge from drift evaluation
    workflow.add_conditional_edges(
        "evaluate_drift_node",
        route_drift_decision,
        {
            "retrain_model_node": "retrain_model_node",
            END: END
        }
    )
    
    # Add normal edges to complete the retraining pipeline
    workflow.add_edge("retrain_model_node", "deploy_model_node")
    workflow.add_edge("deploy_model_node", END)
    
    return workflow.compile()
