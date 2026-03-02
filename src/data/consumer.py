import os
import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer
from pydantic import ValidationError
from src.data.database import get_db_pool
from src.core.schemas import ServerMetrics
from src.core.config import settings

logger = logging.getLogger(__name__)

KAFKA_BROKER = settings.KAFKA_BROKER
TOPIC = "server-telemetry"
GROUP_ID = "metrics-consumer-group"
BATCH_SIZE = 100
BATCH_TIMEOUT_SEC = 1.0

async def consume_metrics():
    """Consume metrics from Kafka and batch insert into TimescaleDB."""
    
    pool = await get_db_pool()
    
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        group_id=GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode('utf-8')),
        auto_offset_reset="earliest"
    )
    
    logger.info(f"Connecting to Kafka at {KAFKA_BROKER}...")
    await consumer.start()
    logger.info(f"Subscribed to topic: {TOPIC}")

    try:
        batch = []
        last_flush = asyncio.get_event_loop().time()
        
        # Use a connection from the pool for efficient executemany
        async with pool.acquire() as conn:
            async for msg in consumer:
                payload = msg.value
                
                try:
                    # Validate and re-hydrate using Pydantic
                    # This safely converts the string timestamp to a datetime object
                    metric = ServerMetrics(**payload)
                    
                    batch.append((
                        metric.timestamp,
                        metric.server_id,
                        metric.cpu_usage_percent,
                        metric.memory_usage_mb,
                        metric.active_connections,
                        metric.response_time_ms
                    ))
                except ValidationError as e:
                    logger.error(f"Failed to validate incoming metric payload. Skipping msg. Error: {e}")
                    continue

                now = asyncio.get_event_loop().time()
                
                # Flush batch if it reaches BATCH_SIZE or BATCH_TIMEOUT_SEC has elapsed
                if len(batch) >= BATCH_SIZE or (now - last_flush) >= BATCH_TIMEOUT_SEC:
                    if batch:
                        try:
                            await conn.executemany("""
                                INSERT INTO server_metrics (
                                    timestamp, server_id, cpu_usage_percent, 
                                    memory_usage_mb, active_connections, response_time_ms
                                ) VALUES ($1, $2, $3, $4, $5, $6)
                            """, batch)
                            logger.info(f"Inserted batch of {len(batch)} metrics.")
                        except Exception as e:
                            logger.error(f"Failed to insert batch into TimescaleDB. Error: {e}")
                        finally:
                            batch.clear()
                    last_flush = now
    except Exception as e:
        logger.error(f"Error in Kafka consumer: {e}")
    finally:
        await consumer.stop()
        await pool.close()
