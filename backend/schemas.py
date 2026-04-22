from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClassifyRequest(BaseModel):
    text: str = Field(min_length=1, description="Support ticket text")


class ClassifyResponse(BaseModel):
    ticket_id: UUID
    category: str
    category_confidence: float
    urgency: str
    urgency_confidence: float
    combined_confidence: float
    routing_team: str
    status: str
    auto_routed: bool


class FeedbackRequest(BaseModel):
    ticket_id: UUID
    agent_category: str
    agent_urgency: str
    agent_id: str


class FeedbackResponse(BaseModel):
    feedback_id: UUID
    ticket_id: UUID
    was_correct: bool
    status: str


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    text: str
    submitted_at: datetime | None = None
    predicted_category: str | None = None
    predicted_urgency: str | None = None
    category_confidence: float | None = None
    urgency_confidence: float | None = None
    combined_confidence: float | None = None
    routing_destination: str | None = None
    status: str
    model_version: str | None = None


class RoutedTicketsResponse(BaseModel):
    routed_tickets: dict[str, list[TicketResponse]]


class MetricsResponse(BaseModel):
    total_tickets: int
    auto_routed: int
    pending_review: int
    reviewed: int
    auto_route_percentage: float
    override_rate: float
    category_distribution: dict[str, int]
    avg_confidence: float
    model_version: str


class RetrainTriggerResponse(BaseModel):
    status: str
    message: str


class ModelInfoResponse(BaseModel):
    category_model_version: str
    urgency_model_version: str
    category_accuracy: float | None = None
    category_f1: float | None = None
    urgency_accuracy: float | None = None
    urgency_f1: float | None = None
    category_mlflow_run_id: str | None = None
    urgency_mlflow_run_id: str | None = None
    last_trained: datetime | None = None
