from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Ticket
from schemas import RoutedTicketsResponse, TicketResponse

router = APIRouter(tags=["tickets"])


@router.get("/tickets", response_model=list[TicketResponse])
def get_all_tickets(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).order_by(Ticket.submitted_at.desc()).all()
    return tickets


@router.get("/tickets/pending", response_model=list[TicketResponse])
def get_pending_tickets(db: Session = Depends(get_db)):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.status == "pending_review")
        .order_by(Ticket.submitted_at.desc())
        .all()
    )
    return tickets


@router.get("/tickets/routed", response_model=RoutedTicketsResponse)
def get_routed_tickets(db: Session = Depends(get_db)):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.routing_destination.isnot(None))
        .order_by(Ticket.submitted_at.desc())
        .all()
    )

    grouped: dict[str, list[Ticket]] = defaultdict(list)
    for ticket in tickets:
        grouped[ticket.routing_destination or "Unassigned"].append(ticket)

    return RoutedTicketsResponse(routed_tickets=grouped)
