import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from ml.predictor import predict_ticket
from models import Ticket
from schemas import ClassifyRequest, ClassifyResponse

router = APIRouter(tags=["classify"])


@router.post("/classify", response_model=ClassifyResponse)
def classify_ticket(payload: ClassifyRequest, request: Request, db: Session = Depends(get_db)):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Ticket text cannot be empty.")

    threshold = float(os.getenv("CONFIDENCE_THRESHOLD", "0.75"))
    model_version = os.getenv("MODEL_VERSION", "1.0.0")

    prediction = predict_ticket(text=text, threshold=threshold, bundle=request.app.state.ml_bundle)

    ticket = Ticket(
        text=text,
        predicted_category=prediction["category"],
        predicted_urgency=prediction["urgency"],
        category_confidence=prediction["category_confidence"],
        urgency_confidence=prediction["urgency_confidence"],
        combined_confidence=prediction["combined_confidence"],
        routing_destination=prediction["routing_team"],
        status=prediction["status"],
        model_version=model_version,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ClassifyResponse(
        ticket_id=ticket.id,
        category=prediction["category"],
        category_confidence=prediction["category_confidence"],
        urgency=prediction["urgency"],
        urgency_confidence=prediction["urgency_confidence"],
        combined_confidence=prediction["combined_confidence"],
        routing_team=prediction["routing_team"],
        status=prediction["status"],
        auto_routed=prediction["auto_routed"],
    )
