import json
import logging
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaConnectionError, KafkaError
from src.core.schemas import ServerMetrics
from src.core.config import settings

logger = logging.getLogger(__name__)

KAFKA_BROKER = settings.KAFKA_BROKER

# Global state
producer = None
is_kafka_available = False  # Flag used by the API as a fallback signal

async def get_kafka_producer():
    """
    Attempts to connect to the Kafka broker.
    On failure, logs a warning and sets is_kafka_available=False.
    The API will fall back to direct DB writes in degraded mode.
    """
    global producer, is_kafka_available
    if producer is not None:
        return producer

    try:
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            request_timeout_ms=5000,   # Fail fast — don't block startup for 30s
            connections_max_idle_ms=10000
        )
        await producer.start()
        is_kafka_available = True
        logger.info(f"[Vajra-SRE] Kafka producer connected to: {KAFKA_BROKER}")
    except (KafkaConnectionError, KafkaError, OSError, Exception) as e:
        is_kafka_available = False
        producer = None
        logger.warning(
            f"[Vajra-SRE] Kafka broker unavailable at {KAFKA_BROKER}. "
            f"Running in degraded mode (Database only). Reason: {e}"
        )

    return producer

async def produce_metric(topic: str, metric: ServerMetrics):
    """Publishes a metric to Kafka. Silently skips if Kafka is unavailable."""
    global is_kafka_available
    if not is_kafka_available or producer is None:
        return  # Caller handles fallback — just exit cleanly

    try:
        payload = metric.model_dump(mode='json')
        await producer.send_and_wait(topic, payload)
    except (KafkaConnectionError, KafkaError, Exception) as e:
        is_kafka_available = False
        logger.warning(f"[Vajra-SRE] Kafka send failed, entering degraded mode: {e}")

async def close_kafka_producer():
    global producer, is_kafka_available
    if producer is not None:
        try:
            await producer.stop()
        except Exception:
            pass
        finally:
            producer = None
            is_kafka_available = False
