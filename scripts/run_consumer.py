import sys
import os
import asyncio
import logging

# Ensure project root is in path if script is run outside of module structure
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data.database import init_db
from src.data.consumer import consume_metrics

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting Consumer Service...")
    
    # Optional: Wait a moment to ensure TimescaleDB is fully ready even though docker healthchecks help
    await asyncio.sleep(2)
    
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return
        
    logger.info("Starting Kafka Metrics Consumer...")
    await consume_metrics()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Consumer service stopped.")
