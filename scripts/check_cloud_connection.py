import os
import sys
import asyncio
import logging
import asyncpg

try:
    from dotenv import load_dotenv
    # Load .env file explicitly
    load_dotenv()
except ImportError:
    print("[WARNING] python-dotenv not installed. If .env is not loaded, install it via 'pip install python-dotenv'")

# Ensure the root project directory is in the PYTHONPATH so we can import src modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

def mask_url(url: str) -> str:
    """Masks the password in the database URL for safe printing."""
    if not url:
        return "None"
    try:
        # Expected format: postgresql://user:password@host:port/dbname...
        parts = url.split("@")
        if len(parts) > 1:
            credentials = parts[0]
            host_info = parts[1]
            cred_parts = credentials.split(":")
            if len(cred_parts) >= 3: # e.g. postgresql://user:password
                return f"{cred_parts[0]}:{cred_parts[1]}:****@{host_info}"
        return url # fallback if parsing fails
    except Exception:
        return "*****"

async def check_connection():
    db_url = settings.get_database_url
    masked_url = mask_url(db_url)
    
    logger.info(f"Target Database URL: {masked_url}")
    
    if "localhost" in db_url or "127.0.0.1" in db_url:
        logger.warning("The connection string is pointing to LOCALHOST. Please check your .env file to ensure DATABASE_URL is set correctly for Aiven.")
        
    try:
        logger.info("Attempting to connect...")
        conn = await asyncpg.connect(dsn=db_url, timeout=15)
        logger.info("[SUCCESS] Connected to PostgreSQL!")
        
        # Test 1: PostgreSQL Version
        version = await conn.fetchval("SELECT version();")
        logger.info(f"[DB VERSION] {version}")
        
        # Test 2: Server Metrics Count
        try:
            count = await conn.fetchval("SELECT count(*) FROM server_metrics;")
            logger.info(f"[metrics_db] Found {count} rows in 'server_metrics' table.")
        except asyncpg.exceptions.UndefinedTableError:
            logger.warning("[metrics_db] 'server_metrics' table does not exist. Please run the migration script first.")
            
        await conn.close()
        logger.info("Diagnostics completed successfully.")
        
    except asyncpg.exceptions.InvalidAuthorizationSpecificationError as e:
        logger.error(f"[AUTH FAILED] Invalid credentials or missing SSL mode: {e}")
        logger.error("Hint: Ensure your Aiven URI has '?sslmode=require' appended to to it.")
    except asyncio.TimeoutError:
        logger.error("[TIMEOUT] Connection timed out. Check if the host and port are correct and accessible via network firewall rules.")
    except Exception as e:
        logger.error(f"[CONNECTION FAILED] {e}")

if __name__ == "__main__":
    asyncio.run(check_connection())
