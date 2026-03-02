import os
import asyncpg
import logging
from src.core.config import settings

logger = logging.getLogger(__name__)

DSN = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

async def get_db_pool():
    """Create and return an asyncpg connection pool."""
    pool = await asyncpg.create_pool(dsn=DSN)
    return pool

async def init_db():
    """Initialize the database schema and TimescaleDB hypertable."""
    logger.info("Initializing database...")
    conn = await asyncpg.connect(dsn=DSN)
    
    try:
        # Create the timescale extension just in case (usually comes pre-installed in the timescale image)
        await conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")
        
        # Create server_metrics table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS server_metrics (
                timestamp TIMESTAMPTZ NOT NULL,
                server_id TEXT NOT NULL,
                cpu_usage_percent DOUBLE PRECISION NOT NULL,
                memory_usage_mb DOUBLE PRECISION NOT NULL,
                active_connections INTEGER NOT NULL,
                response_time_ms DOUBLE PRECISION NOT NULL
            );
        """)
        
        # Convert to TimescaleDB hypertable
        await conn.execute("""
            SELECT create_hypertable(
                'server_metrics', 
                'timestamp', 
                if_not_exists => TRUE
            );
        """)
        
        logger.info("Database schema and hypertable initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing DB: {e}")
        raise e
    finally:
        await conn.close()
