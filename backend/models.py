# backend/models.py
import uuid
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    submitted_at: Mapped[DateTime] = mapped_column(DateTime(timezone=False), server_default=func.now())
    predicted_category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    predicted_urgency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    category_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    urgency_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    combined_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    routing_destination: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending_review")
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    model_category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    model_urgency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    agent_category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    agent_urgency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    was_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    corrected_at: Mapped[DateTime] = mapped_column(DateTime(timezone=False), server_default=func.now())
    agent_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mlflow_run_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    version_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    category_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    category_f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    urgency_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    urgency_f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    deployed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=False), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    trained_on_rows: Mapped[int | None] = mapped_column(nullable=True)
