import os
from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from ml.predictor import load_artifacts
from ml.retrain import run_retraining
from routers.classify import router as classify_router
from routers.feedback import router as feedback_router
from routers.metrics import router as metrics_router
from routers.model_info import router as model_info_router
from routers.tickets import router as tickets_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    artifacts_dir = Path(__file__).resolve().parent / "artifacts"
    app.state.ml_bundle = load_artifacts(artifacts_dir)
    Base.metadata.create_all(bind=engine)

    scheduler = BackgroundScheduler(timezone=os.getenv("SCHEDULER_TIMEZONE", "UTC"))
    scheduler.add_job(
        lambda: run_retraining(app=app),
        trigger=CronTrigger(
            day_of_week=os.getenv("RETRAIN_DAY_OF_WEEK", "sun"),
            hour=int(os.getenv("RETRAIN_HOUR", "2")),
            minute=int(os.getenv("RETRAIN_MINUTE", "0")),
        ),
        id="weekly_retrain_job",
        replace_existing=True,
    )
    scheduler.start()
    app.state.scheduler = scheduler

    yield

    scheduler.shutdown(wait=False)


app = FastAPI(
    title="AI Support Ticket Classifier API",
    version=os.getenv("MODEL_VERSION", "1.0.0"),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify_router)
app.include_router(feedback_router)
app.include_router(tickets_router)
app.include_router(metrics_router)
app.include_router(model_info_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
