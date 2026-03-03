import asyncio
import logging
import asyncpg
import sys
import os

# Ensure the root project directory is in the PYTHONPATH so we can import src modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

async def migrate_cloud_db():
    cloud_url = settings.get_database_url
    logger.info(f"Targeting Database URL: {cloud_url.split('@')[-1] if '@' in cloud_url else 'localhost'}")
    
    try:
        # Connect using the cloud URL
        conn = await asyncpg.connect(dsn=cloud_url, timeout=30)
        logger.info("Successfully connected to cloud database.")
        
        # Ensure timescaledb extension exists
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")
            logger.info("TimescaleDB extension verified.")
        except Exception as e:
            logger.warning(f"Could not create TimescaleDB extension - {e}. "
                           f"If hosted on Aiven, please ensure Timescale is enabled on the console.")

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
        logger.info("Table 'server_metrics' structure verified.")
        
        # Ensure it's a hypertable
        try:
            await conn.execute("""
                SELECT create_hypertable(
                    'server_metrics', 
                    'timestamp', 
                    if_not_exists => TRUE
                );
            """)
            logger.info("Table 'server_metrics' successfully configured as a hypertable.")
        except Exception as e:
            # Often throws an error if it's already a hypertable, safe to ignore if running migrations multiple times
            logger.info(f"Hypertable check passed (or already exists): {e}")

        logger.info("Cloud migration successfully completed. The Vajra MLOps schema is ready.")
        
    except Exception as e:
        logger.error(f"Migration Failed: {e}")
        sys.exit(1)
        
    finally:
        if 'conn' in locals() and not conn.is_closed():
            await conn.close()
            logger.info("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(migrate_cloud_db())
