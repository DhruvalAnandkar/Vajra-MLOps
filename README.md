# ⚡ Auto-Deployer: Autonomous MLOps & Self-Healing AI Pipeline

## 🧠 The Vision
Standard Machine Learning models are "static"—they are trained once and then slowly become inaccurate as the real world changes. This project solves that problem by building a **Self-Healing AI Brain**. 

When server environments hit periods of **Data Drift** (like a massive Black Friday traffic spike), the Auto-Deployer detects the drop in predictive accuracy and autonomously triggers a retraining and deployment sequence to adapt to the new reality—zero human intervention required.

## 🏗️ Architecture
This system is a decoupled, event-driven microservices architecture:

- **Data Ingestion:** FastAPI & Redpanda (Kafka) for high-speed server telemetry streaming.
- **Time-Series Storage:** TimescaleDB (PostgreSQL) optimized for high-volume metrics.
- **Predictive AI:** XGBoost model trained to forecast server CPU/Memory loads.
- **Drift Detection:** SciPy-powered Kolmogorov-Smirnov statistical testing.
- **Autonomous Orchestration:** **LangGraph** SRE Agent that acts as the "Manager" for model retraining and deployment.
- **Modern Frontend:** React & Framer Motion for a venture-grade, animated Command Center.



## 🛠️ Key MLOps Features
- **Deterministic Scaling:** Moves beyond LLM "hallucinations" by using hard math (KS-Tests) to govern system decisions.
- **Automated Retraining:** The LangGraph agent detects performance degradation and autonomously trains a "challenger" model on live situational data.
- **Containerized Infrastructure:** Orchestrated via Docker Compose for production-ready portability.

## 🚀 Quick Start
1. **Clone & Boot:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/Auto-Deployer.git](https://github.com/YOUR_USERNAME/Auto-Deployer.git)
   cd Auto-Deployer
   docker compose up --build -d