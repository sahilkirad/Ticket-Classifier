from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Request, status

from ml.retrain import run_retraining
from schemas import ModelInfoResponse, RetrainTriggerResponse

router = APIRouter(tags=["model"])


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info(request: Request):
    cat_meta = request.app.state.ml_bundle["category"]["metadata"]
    urg_meta = request.app.state.ml_bundle["urgency"]["metadata"]

    cat_trained = cat_meta.get("trained_at")
    urg_trained = urg_meta.get("trained_at")
    last_trained = None
    try:
        cdt = datetime.fromisoformat(cat_trained) if cat_trained else None
        udt = datetime.fromisoformat(urg_trained) if urg_trained else None
        if cdt and udt:
            last_trained = cdt if cdt > udt else udt
        else:
            last_trained = cdt or udt
    except Exception:
        last_trained = None

    return ModelInfoResponse(
        category_model_version=str(cat_meta.get("version", "1.0.0")),
        urgency_model_version=str(urg_meta.get("version", "1.0.0")),
        category_accuracy=cat_meta.get("accuracy"),
        category_f1=cat_meta.get("f1_weighted"),
        urgency_accuracy=urg_meta.get("accuracy"),
        urgency_f1=urg_meta.get("f1_weighted"),
        category_mlflow_run_id=cat_meta.get("mlflow_run_id"),
        urgency_mlflow_run_id=urg_meta.get("mlflow_run_id"),
        last_trained=last_trained,
    )


@router.post(
    "/retrain",
    response_model=RetrainTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def trigger_retrain(background_tasks: BackgroundTasks, request: Request):
    background_tasks.add_task(run_retraining, request.app)
    return RetrainTriggerResponse(
        status="accepted",
        message="Retraining started in background.",
    )
