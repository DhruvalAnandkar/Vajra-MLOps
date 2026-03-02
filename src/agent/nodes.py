import os
import json
import logging
import datetime
import pandas as pd
import numpy as np
from src.agent.state import SREState
from src.models.drift_detector import DriftMonitor
from src.models.baseline import BaselineModel

logger = logging.getLogger(__name__)

# Mock data generation for the workflow example
def get_mock_reference_data() -> pd.DataFrame:
    """Mock reference baseline data."""
    return pd.DataFrame({
        "memory_usage_mb": np.random.normal(4000, 500, 100),
        "active_connections": np.random.normal(100, 20, 100),
        "response_time_ms": np.random.normal(50, 10, 100)
    })

def get_mock_current_data(should_drift: bool = True) -> pd.DataFrame:
    """Mock current data, potentially with shifted distributions."""
    if should_drift:
        # Generate drifted data
        return pd.DataFrame({
            "memory_usage_mb": np.random.normal(8000, 1000, 100), # Huge drift
            "active_connections": np.random.normal(300, 50, 100),   # Drift
            "response_time_ms": np.random.normal(200, 50, 100)      # Drift
        })
    else:
        # Generate non-drifted data (similar to reference)
        return get_mock_reference_data()

async def evaluate_drift_node(state: SREState) -> SREState:
    """
    Node 1: Evaluates statistical drift using KS test on recent data vs baseline.
    """
    logger.info("[Vajra-SRE] Executing Node: evaluate_drift_node")
    state["current_step"] = "evaluate_drift"
    
    # 1. Pull mock reference and current data
    ref_data = get_mock_reference_data()
    # Randomly decide if we mock drifted data or not for this execution simulation
    cur_data = get_mock_current_data(should_drift=True) 
    
    # 2. Run the KS Test
    drift_detected, report = DriftMonitor.detect_drift(ref_data, cur_data)
    
    state["drift_detected"] = drift_detected
    state["drift_report"] = report
    
    if drift_detected:
        logger.warning("Drift evaluation completed: ALERT! Drift Detected.")
    else:
        logger.info("Drift evaluation completed: Data distributions are stable.")
        
    return state

async def retrain_model_node(state: SREState) -> SREState:
    """
    Node 2: If drift is detected, train a new XGBoost model.
    """
    logger.info("[Vajra-SRE] Initializing autonomous recovery: retrain_model_node")
    state["current_step"] = "retrain_model"
    
    try:
        # Mock recent data extraction for training
        X_train = get_mock_current_data()
        y_train = pd.Series(np.random.normal(50, 15, len(X_train)), name="cpu_usage_percent")
        
        # Train new model
        model = BaselineModel()
        model.train(X_train, y_train)
        
        # Save model with timestamp
        model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models")
        os.makedirs(model_dir, exist_ok=True)
        
        timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = os.path.join(model_dir, f"xgboost_v{timestamp_str}.json")
        
        model.save_model(model_path)
        
        state["new_model_path"] = model_path
        state["retrain_successful"] = True
        logger.info(f"Retraining successful. New model saved to: {model_path}")
        
    except Exception as e:
        logger.error(f"Retraining failed: {e}")
        state["retrain_successful"] = False
        state["new_model_path"] = None

    return state

async def deploy_model_node(state: SREState) -> SREState:
    """
    Node 3: Simulate promoting the retrained model to the production registry.
    """
    logger.info("[Vajra-SRE] Executing Node: deploy_model_node")
    state["current_step"] = "deploy_model"
    
    if not state.get("retrain_successful") or not state.get("new_model_path"):
        logger.error("Cannot deploy: Retraining was unsuccessful.")
        return state
        
    registry_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "production_registry.json")
    
    registry_data = {
        "production_model_path": state["new_model_path"],
        "deployment_timestamp": datetime.datetime.now().isoformat(),
        "drift_report": state["drift_report"]
    }
    
    with open(registry_path, "w") as f:
        json.dump(registry_data, f, indent=4)
        
    logger.info(f"Deployment successful. production_registry.json updated to point to {state['new_model_path']}.")
    
    return state
