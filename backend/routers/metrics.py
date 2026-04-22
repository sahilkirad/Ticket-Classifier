from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Feedback, Ticket
from schemas import MetricsResponse

router = APIRouter(tags=["metrics"])


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(request: Request, db: Session = Depends(get_db)):
    total_tickets = db.query(func.count(Ticket.id)).scalar() or 0
    auto_routed = db.query(func.count(Ticket.id)).filter(Ticket.status == "auto_routed").scalar() or 0
    pending_review = db.query(func.count(Ticket.id)).filter(Ticket.status == "pending_review").scalar() or 0
    reviewed = db.query(func.count(Ticket.id)).filter(Ticket.status == "reviewed").scalar() or 0

    auto_route_percentage = round((auto_routed / total_tickets) * 100, 2) if total_tickets else 0.0

    total_feedback = db.query(func.count(Feedback.id)).scalar() or 0
    total_overrides = (
        db.query(func.count(Feedback.id))
        .filter(Feedback.was_correct.is_(False))
        .scalar()
        or 0
    )
    override_rate = round((total_overrides / total_feedback) * 100, 2) if total_feedback else 0.0

    category_rows = (
        db.query(Ticket.predicted_category, func.count(Ticket.id))
        .group_by(Ticket.predicted_category)
        .all()
    )
    category_distribution = {category or "Unknown": count for category, count in category_rows}
    avg_confidence = db.query(func.avg(Ticket.combined_confidence)).scalar() or 0.0

    cat_v = str(request.app.state.ml_bundle["category"]["metadata"].get("version", "1.0.0"))
    urg_v = str(request.app.state.ml_bundle["urgency"]["metadata"].get("version", "1.0.0"))
    model_version = f"category:{cat_v}|urgency:{urg_v}"

    return MetricsResponse(
        total_tickets=int(total_tickets),
        auto_routed=int(auto_routed),
        pending_review=int(pending_review),
        reviewed=int(reviewed),
        auto_route_percentage=float(auto_route_percentage),
        override_rate=float(override_rate),
        category_distribution=category_distribution,
        avg_confidence=float(round(avg_confidence, 3)),
        model_version=model_version,
    )
