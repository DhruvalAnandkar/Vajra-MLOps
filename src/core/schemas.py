from datetime import datetime
from pydantic import BaseModel, Field

class ServerMetrics(BaseModel):
    timestamp: datetime = Field(..., description="Timestamp of the metrics in UTC")
    server_id: str = Field(..., description="Unique identifier for the server")
    cpu_usage_percent: float = Field(..., description="CPU usage percentage")
    memory_usage_mb: float = Field(..., description="Memory usage in megabytes")
    active_connections: int = Field(..., description="Number of active connections")
    response_time_ms: float = Field(..., description="Average response time in milliseconds")
