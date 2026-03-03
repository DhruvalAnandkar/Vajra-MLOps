"""
src/utils/notifications.py
Sidecar notification utility for Vajra-SRE.
Sends alerts to a Discord webhook. Fails silently — the main
application will NEVER crash due to a notification failure.
"""
import os
import logging
import asyncio
import httpx  # lightweight async-native HTTP client

logger = logging.getLogger(__name__)

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")


async def send_discord_alert(message: str) -> None:
    """
    POSTs a rich embed message to the configured Discord webhook.
    
    - Reads DISCORD_WEBHOOK_URL from environment at call time (no startup crash if missing).
    - Times out after 5 seconds so it never blocks the main event loop.
    - Catches ALL exceptions and logs a warning — the caller never sees an error.
    """
    if not DISCORD_WEBHOOK_URL:
        logger.debug("[Vajra-Notify] DISCORD_WEBHOOK_URL not set. Skipping Discord alert.")
        return

    payload = {
        "username": "Vajra SRE Bot",
        "avatar_url": "https://cdn-icons-png.flaticon.com/512/1803/1803494.png",
        "embeds": [
            {
                "description": message,
                "color": 0x2563EB,  # Tech blue — matches the Vajra brand
                "footer": {
                    "text": "Vajra | Autonomous MLOps Orchestrator"
                }
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(DISCORD_WEBHOOK_URL, json=payload)
            if response.status_code not in (200, 204):
                logger.warning(
                    f"[Vajra-Notify] Discord webhook returned unexpected status: {response.status_code}"
                )
            else:
                logger.debug("[Vajra-Notify] Discord alert sent successfully.")
    except asyncio.TimeoutError:
        logger.warning("[Vajra-Notify] Discord webhook timed out (5s). Alert skipped.")
    except Exception as e:
        logger.warning(f"[Vajra-Notify] Discord alert failed silently: {e}")
