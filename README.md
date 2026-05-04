# AI-Powered Support Ticket Classifier & Auto-Router (MLOps Project)

A project-grade end-to-end MLOps system that classifies incoming support tickets by **category** and **urgency**, auto-routes high-confidence tickets to the correct team, and sends low-confidence tickets to a **human review** workflow. Agent feedback is stored in PostgreSQL and used for retraining. Retraining activity is tracked in **MLflow** for traceability and demo-proof.

---

## What This Solves

Support teams often waste time reading and routing tickets before doing resolution work. This system removes the triage bottleneck by:

- Predicting ticket **Category** and **Urgency**
- Computing a **combined confidence**
- Auto-routing when confidence is above a threshold
- Escalating uncertain cases to a human review queue
- Storing human corrections for retraining
- Logging retraining runs in MLflow

---

## Core Features

- **Dual-model inference**
  - Category classifier
  - Urgency classifier
- **Shared TF-IDF vectorizer** for both models
- **Confidence gate**
  - Combined confidence = geometric mean: `sqrt(category_conf * urgency_conf)`
  - If `combined_confidence >= threshold` -> auto-route
  - Else -> pending human review
- **Human-in-the-loop review**
  - UI to confirm/correct category + urgency
  - Saves feedback to DB
- **Metrics dashboard**
  - Auto-routed vs pending vs reviewed
  - Override rate
  - Category distribution
  - Average confidence
  - Current model versions
- **Retraining**
  - Uses base dataset + feedback corrections
  - Can retrain category and urgency independently
  - Hot-swaps updated artifacts (project behavior)
- **MLflow Tracking UI**
  - Retrain run payload logged as JSON artifact (proof)
  - Experiment separation for clean tracking

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts

**Backend**
- FastAPI + Uvicorn
- SQLAlchemy + PostgreSQL
- Docker containerization

**ML**
- TF-IDF vectorizer (shared)
- Logistic Regression for category + urgency
- Artifacts loaded once at startup

**Tracking**
- MLflow server (running via Docker)

**Cloud (Project Deployment)**
- AWS EC2 (Ubuntu)
- AWS RDS (PostgreSQL)

---

## Project Architecture

### Ticket Flow (End-to-End)

1. Agent submits ticket text on frontend (`/`)
2. Frontend calls FastAPI `POST /classify`
3. Backend:
   - Cleans text
   - TF-IDF transforms it
   - Predicts category + urgency
   - Computes combined confidence
   - Applies confidence threshold
   - Stores ticket row in DB
4. If low confidence -> appears on `/review`
5. Agent confirms/corrects -> frontend calls `POST /feedback`
6. Feedback is stored in DB for retraining
7. Retraining runs:
   - On schedule (APScheduler) and/or manually (`POST /retrain`)
   - Logs proof to MLflow

---

## Routing Rules

| Category | Routing Destination |
|---|---|
| Billing | Finance Team |
| Refund | Finance Team |
| Technical Issue | Engineering Team |
| Cancellation | Customer Success Team |
| Product Inquiry | Product Team |
| General | General Support Queue |

---

## Repository Structure (Key Folders)

```txt
backend/
  main.py
  database.py
  models.py
  schemas.py
  routers/
  ml/
  artifacts/
  data/
  Dockerfile
  requirements.txt
  .env

frontend/
  app/
  components/
  lib/
  types/
  .env.local
  package.json
```

---

## Backend API (FastAPI)

Base URL: `http://<BACKEND_HOST>:8000`

- `GET /health` -> health check
- `POST /classify` -> classify + store ticket
- `POST /feedback` -> store agent correction
- `GET /tickets` -> all tickets
- `GET /tickets/pending` -> pending review tickets
- `GET /tickets/routed` -> grouped by routing team
- `GET /metrics` -> dashboard metrics
- `GET /model-info` -> model metadata + versions
- `POST /retrain` -> trigger retrain (background)

---

## Environment Variables

### Backend (`backend/.env`)

Required:
- `DATABASE_URL=postgresql://...`
- `MLFLOW_TRACKING_URI=http://ticket-mlflow:5000` (recommended when both containers share a Docker network)
- `BASE_DATASET_PATH=/app/data/bitext_support_dataset.csv`
- `MLFLOW_EXPERIMENT=ticket-classifier-bitext`

Optional:
- `CONFIDENCE_THRESHOLD=0.75`
- `MODEL_VERSION=1.0.0`
- `SCHEDULER_TIMEZONE=UTC`
- `RETRAIN_DAY_OF_WEEK=sun`
- `RETRAIN_HOUR=2`
- `RETRAIN_MINUTE=0`
- `RETRAIN_MODEL_CONFIDENCE_THRESHOLD=0.75`

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>:8000`

---

## Running Locally (Developer Workflow)

### Backend
From `backend/`:
- Ensure PostgreSQL is running locally (or point `DATABASE_URL` to RDS)
- Build/run via Docker

### Frontend
From `frontend/`:
- Set `NEXT_PUBLIC_API_URL` to backend URL
- Run:
  - `npm install`
  - `npm run dev` (or build/start for production-style run)

---

## AWS Deployment (Project Mode)

Typical externally accessible URLs (from your EC2 Public IPv4):

- Frontend: `http://<EC2_PUBLIC_IP>:3000`
- Backend health: `http://<EC2_PUBLIC_IP>:8000/health`
- Backend docs: `http://<EC2_PUBLIC_IP>:8000/docs`
- MLflow UI: `http://<EC2_PUBLIC_IP>:5000`

### Important Note About EC2 IP

If you stop/start EC2, the **public IP can change**. If it changes:
- Update `frontend/.env.local` with the new backend URL and rebuild frontend
- Optionally attach an Elastic IP to keep it stable

---

## MLflow Setup (Recommended Docker Networking)

Run MLflow via Docker and connect backend to it via a shared Docker network.

Create network:
```bash
docker network create ticket-net 2>/dev/null || true
```

Run MLflow:
```bash
docker rm -f ticket-mlflow 2>/dev/null || true
mkdir -p ~/Ticket-Classifier/mlflow_data

docker run -d --name ticket-mlflow --network ticket-net -p 5000:5000 \
  -v ~/Ticket-Classifier/mlflow_data:/mlflow_data \
  ticket-classifier-api \
  mlflow server --host 0.0.0.0 --port 5000 \
  --backend-store-uri sqlite:////mlflow_data/mlflow.db \
  --default-artifact-root /mlflow_data \
  --gunicorn-opts "--workers 1 --timeout 120"
```

Backend connects using:
```env
MLFLOW_TRACKING_URI=http://ticket-mlflow:5000
```

---

## Retraining Behavior (Independent Retraining)

Retraining can retrain **category** and **urgency** independently based on weekly confidence checks. Example output:

- `retrained_category: True`
- `retrained_urgency: False`
- `deployed_category: True`
- `deployed_urgency: False`

This is intentional for efficiency and clarity.

---

## How To Demo "Retraining Works" (Proof)

### UI proof
- Submit some tickets
- Force some low-confidence tickets into `/review`
- Submit corrections
- Trigger retrain via dashboard button or API
- Observe updates in:
  - `/dashboard` metrics
  - `/model-info` response

### MLflow proof
1. Open MLflow UI: `http://<EC2_PUBLIC_IP>:5000`
2. Trigger retrain: `POST http://<EC2_PUBLIC_IP>:8000/retrain`
3. Refresh experiment `ticket-classifier-bitext`
4. Open the latest run and check:
   - **Artifacts**: `retrain_payload.json` (proof)

---

## Common Troubleshooting

### Frontend fails to start (`EADDRINUSE :::3000`)

Port 3000 is already used by another Next.js process.

Check PID:
```bash
sudo ss -ltnp | grep ':3000'
```

Kill PID:
```bash
sudo kill -9 <PID>
```

Restart:
```bash
cd ~/Ticket-Classifier/frontend
nohup npm run start > frontend.log 2>&1 &
```

### Backend startup fails (RDS timeout)

Ensure:
- RDS security group allows inbound `5432` from the EC2 security group
- RDS is `Available`
- `DATABASE_URL` is correct

### MLflow UI blank page

Run MLflow with:
- `--gunicorn-opts "--workers 1 --timeout 120"`

### No MLflow runs visible

Check:
- `MLFLOW_TRACKING_URI` is reachable from backend container (use Docker network + `ticket-mlflow`)
- `BASE_DATASET_PATH` is set
- Retraining isn't being skipped/failed (check retrain output/logs)


