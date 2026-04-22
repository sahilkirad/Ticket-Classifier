// explanation about why those changes were done.
// Centralized API helpers avoid repeated fetch logic and ensure everything uses NEXT_PUBLIC_API_URL only.

// Internal working of code
// requestJson builds URL, sends request, parses errors, and returns typed JSON; each endpoint wrapper calls it with correct path/method/payload
import type {
  ClassifyResponse,
  FeedbackRequest,
  FeedbackResponse,
  MetricsResponse,
  ModelInfoResponse,
  RetrainTriggerResponse,
  RoutedTicketsResponse,
  Ticket,
} from "../types";

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  return base.replace(/\/+$/, "");
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) message = body.detail;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export async function classifyTicket(text: string): Promise<ClassifyResponse> {
  return requestJson<ClassifyResponse>("/classify", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function submitFeedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
  return requestJson<FeedbackResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAllTickets(): Promise<Ticket[]> {
  return requestJson<Ticket[]>("/tickets");
}

export async function getPendingTickets(): Promise<Ticket[]> {
  return requestJson<Ticket[]>("/tickets/pending");
}

export async function getRoutedTickets(): Promise<RoutedTicketsResponse> {
  return requestJson<RoutedTicketsResponse>("/tickets/routed");
}

export async function getMetrics(): Promise<MetricsResponse> {
  return requestJson<MetricsResponse>("/metrics");
}

export async function getModelInfo(): Promise<ModelInfoResponse> {
  return requestJson<ModelInfoResponse>("/model-info");
}

export async function triggerRetrain(): Promise<RetrainTriggerResponse> {
  return requestJson<RetrainTriggerResponse>("/retrain", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
