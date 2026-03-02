import os
import sys
import asyncio
import logging

# Ensure project root is in path if script is run outside of module structure
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agent.workflow import create_sre_workflow
from src.agent.state import SREState

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

async def main():
    print("\n" + "="*50)
    print("🤖 Starting Autonomous SRE Agent Execution...")
    print("="*50 + "\n")
    
    # Compile the LangGraph application
    app = create_sre_workflow()
    
    # Initialize the state dictionary
    initial_state: SREState = {
        "current_step": "init",
        "drift_detected": False,
        "drift_report": {},
        "retrain_successful": False,
        "new_model_path": None
    }
    
    print("🧠 Agent thought process trace:")
    
    # Iterate through the execution graph. 
    # astream yields the state updates from each node as they complete.
    async for event in app.astream(initial_state):
        for node_name, state_update in event.items():
            print(f"\n[Node Execution Completed]: {node_name}")
            
            step = state_update.get('current_step')
            
            if step == "evaluate_drift":
                print("   Evaluating data drift against historical baseline...")
                if state_update.get("drift_detected"):
                    print("   🚨 ALERT: Statistical Drift Detected!")
                    print("   Routing to Retrain Node...")
                else:
                    print("   ✅ Data distributions are stable. No action required.")
                    
            elif step == "retrain_model":
                if state_update.get("retrain_successful"):
                    print("   🔨 Retraining complete. New optimal XGBoost model generated.")
                    print(f"   Model Artifact: {state_update.get('new_model_path')}")
                else:
                    print("   ❌ Retraining failed. Escalating to human SRE.")
                    
            elif step == "deploy_model":
                print("   🚀 Deployment Complete. Updated production_registry.json.")
                
            # Print full state payload for debugging visibility
            print(f"   Current State: {state_update}")

    print("\n" + "="*50)
    print("🏁 SRE Agent Execution Finished")
    print("="*50 + "\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Agent execution stopped.")
