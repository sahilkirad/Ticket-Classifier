// This creates a single typed contract layer for all frontend-backend communication and matches your current backend response shapes.
export type TicketStatus = "auto_routed" | "pending_review" | "reviewed";

export interface ClassifyRequest {
  text: string;
}

export interface ClassifyResponse {
  ticket_id: string;
  category: string;
  category_confidence: number;
  urgency: string;
  urgency_confidence: number;
  combined_confidence: number;
  routing_team: string;
  status: TicketStatus;
  auto_routed: boolean;
}

export interface FeedbackRequest {
  ticket_id: string;
  agent_category: string;
  agent_urgency: string;
  agent_id: string;
}

export interface FeedbackResponse {
  feedback_id: string;
  ticket_id: string;
  was_correct: boolean;
  status: TicketStatus;
}

export interface Ticket {
  id: string;
  text: string;
  submitted_at?: string | null;
  predicted_category?: string | null;
  predicted_urgency?: string | null;
  category_confidence?: number | null;
  urgency_confidence?: number | null;
  combined_confidence?: number | null;
  routing_destination?: string | null;
  status: TicketStatus;
  model_version?: string | null;
}

export interface RoutedTicketsResponse {
  routed_tickets: Record<string, Ticket[]>;
}

export interface MetricsResponse {
  total_tickets: number;
  auto_routed: number;
  pending_review: number;
  reviewed: number;
  auto_route_percentage: number;
  override_rate: number;
  category_distribution: Record<string, number>;
  avg_confidence: number;
  model_version: string;
}

export interface ModelInfoResponse {
  category_model_version: string;
  urgency_model_version: string;
  category_accuracy?: number | null;
  category_f1?: number | null;
  urgency_accuracy?: number | null;
  urgency_f1?: number | null;
  category_mlflow_run_id?: string | null;
  urgency_mlflow_run_id?: string | null;
  last_trained?: string | null;
}

export interface RetrainTriggerResponse {
  status: string;
  message: string;
}
