# ⚡ Vajra: Autonomous MLOps & Self-Healing AI Pipeline

## 🧠 The Vision
Standard Machine Learning models are "static"—they are trained once and then slowly become inaccurate as the real world changes (Data Drift). 

**Vajra** (named after the indestructible, self-healing weapon) solves this by building a deterministic AI Brain. When server environments hit periods of Data Drift (like a massive traffic spike), Vajra detects the drop in predictive accuracy and autonomously triggers a retraining and deployment sequence to adapt to the new reality—zero human intervention required.

## 🏗️ Cloud-Native Architecture
This system is a decoupled, event-driven microservices architecture:
* **Data Ingestion:** FastAPI & Redpanda (Kafka) for high-speed server telemetry streaming.
* **Cloud Persistence:** Managed **TimescaleDB (PostgreSQL) on Aiven Cloud** optimized for high-volume time-series metrics.
* **Predictive AI:** XGBoost model trained to forecast server CPU/Memory loads.
* **Drift Detection:** SciPy-powered Kolmogorov-Smirnov (KS) statistical testing.
* **Autonomous Orchestration:** LangGraph SRE Agent that acts as the "Manager" for model retraining and deployment.
* **Modern Frontend:** React & Framer Motion for a venture-grade Command Center.

## 🛠️ Key Engineering Features
* **Environment-Agnostic:** Seamless migration from local Docker networks to managed cloud instances via DSN injection.
* **Deterministic Scaling:** Moves beyond LLM "hallucinations" by using hard math to govern SRE system decisions.
* **Automated Retraining:** The SRE Agent detects performance degradation and autonomously trains a "challenger" model on live cloud data.

## 🚀 Quick Start
```bash
git clone [https://github.com/DhruvalAnandkar/Vajra-MLOps.git](https://github.com/DhruvalAnandkar/Vajra-MLOps.git)
cd Vajra-MLOps
(Add your .env file with your Cloud Database URI, then run the services)