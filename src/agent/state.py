from typing import TypedDict, Dict, Any, Optional

class SREState(TypedDict):
    """
    State tracking dictionary passed between nodes in the LangGraph workflow.
    """
    current_step: str
    drift_detected: bool
    drift_report: Dict[str, Any]
    retrain_successful: bool
    new_model_path: Optional[str]
