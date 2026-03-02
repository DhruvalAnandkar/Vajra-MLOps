import os
import json
from aiokafka import AIOKafkaProducer
from src.core.schemas import ServerMetrics
from src.core.config import settings

KAFKA_BROKER = settings.KAFKA_BROKER

producer = None

async def get_kafka_producer():
    global producer
    if producer is None:
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await producer.start()
    return producer

async def produce_metric(topic: str, metric: ServerMetrics):
    prod = await get_kafka_producer()
    # Convert Pydantic model to dictionary compatible with JSON serialization
    # datetime will be encoded as ISO 8601 string in mode='json'
    payload = metric.model_dump(mode='json')
    await prod.send_and_wait(topic, payload)

async def close_kafka_producer():
    global producer
    if producer is not None:
        await producer.stop()
