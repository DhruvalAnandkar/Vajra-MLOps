import time
import random
import requests
from datetime import datetime, timezone

API_URL = "http://localhost:8000/ingest"
SERVER_IDS = [f"server-{i:03d}" for i in range(1, 11)]

def generate_metric():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "server_id": random.choice(SERVER_IDS),
        "cpu_usage_percent": round(random.uniform(10.0, 90.0), 2),
        "memory_usage_mb": round(random.uniform(1024.0, 16384.0), 2),
        "active_connections": random.randint(10, 500),
        "response_time_ms": round(random.uniform(20.0, 500.0), 2)
    }

def main():
    print(f"Starting traffic simulation to {API_URL}...")
    try:
        while True:
            metric = generate_metric()
            try:
                response = requests.post(API_URL, json=metric, timeout=5)
                if response.status_code == 200:
                    print(f"Sent metric for {metric['server_id']} (CPU: {metric['cpu_usage_percent']}%)")
                else:
                    print(f"Failed to send: {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"Error connecting to API: {e}")
            
            # Sleep between 0.01 and 0.1 seconds to simulate high-volume traffic
            time.sleep(random.uniform(0.01, 0.1))
    except KeyboardInterrupt:
        print("\nTraffic simulation stopped by user.")

if __name__ == "__main__":
    main()
