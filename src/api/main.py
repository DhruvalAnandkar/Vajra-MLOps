import os
import json
import asyncio
from fastapi import FastAPI, status, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.core.schemas import ServerMetrics
from src.data.producer import produce_metric, get_kafka_producer, close_kafka_producer
from src.data.database import DSN
import asyncpg
from src.agent.workflow import create_sre_workflow
from src.agent.state import SREState

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the Kafka producer
    await get_kafka_producer()
    yield
    # Shutdown: Close the Kafka producer gracefully
    await close_kafka_producer()

app = FastAPI(
    title="The Vajra MLOps API",
    description="FastAPI serving for Autonomous MLOps & Self-Healing Data Pipeline",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "api"}

@app.post("/ingest", status_code=status.HTTP_200_OK)
async def ingest_metrics(metrics: ServerMetrics, background_tasks: BackgroundTasks):
    """
    Ingest server telemetry data.
    Will be published to Kafka matching the ServerMetrics schema.
    """
    # Asynchronously publish to Kafka
    background_tasks.add_task(produce_metric, "server-telemetry", metrics)
    
    return {"status": "success", "message": "Metrics received", "data": metrics}

@app.get("/api/telemetry")
async def get_telemetry():
    """Fetch the latest 100 metrics asynchronously from TimescaleDB."""
    try:
        conn = await asyncpg.connect(dsn=DSN)
        rows = await conn.fetch("SELECT timestamp, cpu_usage_percent FROM server_metrics ORDER BY timestamp DESC LIMIT 100")
        await conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

def sanitize_path(raw_path: str) -> str:
    """Strip absolute local paths to prevent leaking internal directory structures."""
    if not raw_path:
        return "Unknown"
    return os.path.basename(raw_path)

@app.get("/api/registry")
async def get_registry():
    """Read local production registry JSON securely."""
    registry_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'production_registry.json')
    if os.path.exists(registry_path):
        try:
            with open(registry_path, 'r') as f:
                data = json.load(f)
            if "production_model_path" in data:
                data["production_model_path"] = sanitize_path(data["production_model_path"])
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read registry: {str(e)}")
    raise HTTPException(status_code=404, detail="Registry not found")

@app.post("/api/agent/trigger")
async def trigger_agent():
    """Run the Agent graph asynchronously and return the trace."""
    try:
        app_workflow = create_sre_workflow()
        initial_state: SREState = {
            "current_step": "init",
            "drift_detected": False,
            "drift_report": {},
            "retrain_successful": False,
            "new_model_path": None
        }
        
        trace_logs = []
        
        async for state_update in app_workflow.astream(initial_state):
            for node_name, state in state_update.items():
                step = state.get("current_step")
                trace_logs.append(f"> [Node Completed]: {node_name}")
                
                if step == "evaluate_drift":
                    trace_logs.append("  [Vajra-SRE] Evaluating data drift against historical baseline...")
                    if state.get("drift_detected"):
                        trace_logs.append("  [Vajra-SRE] ALERT: Statistical Drift Detected. Routing to Retrain Node...")
                    else:
                        trace_logs.append("  [Vajra-SRE] INFO: Data distributions stable.")
                        
                elif step == "retrain_model":
                    if state.get("retrain_successful"):
                        safe_path = sanitize_path(state.get('new_model_path'))
                        trace_logs.append(f"  [Vajra-SRE] SUCCESS: Retraining complete. Artifact: {safe_path}")
                    else:
                        trace_logs.append("  [Vajra-SRE] ERROR: Retraining failed.")
                        
                elif step == "deploy_model":
                    trace_logs.append("  [Vajra-SRE] SUCCESS: Deployment Complete. Updated production_registry.json.")
                    
                trace_logs.append("-" * 40)
                
        return {"logs": trace_logs, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed internally: {str(e)}")
