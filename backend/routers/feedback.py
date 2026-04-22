from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Feedback, Ticket
from schemas import FeedbackRequest, FeedbackResponse

router = APIRouter(tags=["feedback"])


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    was_correct = (
        ticket.predicted_category == payload.agent_category
        and ticket.predicted_urgency == payload.agent_urgency
    )

    feedback = Feedback(
        ticket_id=ticket.id,
        model_category=ticket.predicted_category,
        model_urgency=ticket.predicted_urgency,
        agent_category=payload.agent_category,
        agent_urgency=payload.agent_urgency,
        was_correct=was_correct,
        agent_id=payload.agent_id,
    )

    ticket.status = "reviewed"

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackResponse(
        feedback_id=feedback.id,
        ticket_id=ticket.id,
        was_correct=was_correct,
        status=ticket.status,
    )
