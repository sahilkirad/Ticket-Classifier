// explanation about why those changes were done.
// This implements the human review interaction: agent can confirm/correct labels and submit feedback.

// Internal working of code
// The card shows model output, captures agent labels/ID, posts to /feedback, and triggers parent refresh callback.
// "use client";

import { useState } from "react";
import { submitFeedback } from "../lib/api";
import type { Ticket } from "../types";
import CategoryBadge from "./CategoryBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import UrgencyBadge from "./UrgencyBadge";

interface Props {
  ticket: Ticket;
  onSubmitted: () => void;
}

const categoryOptions = [
  "Billing",
  "Refund",
  "Technical Issue",
  "Cancellation",
  "Product Inquiry",
  "General",
];

const urgencyOptions = ["Critical", "High", "Medium", "Low"];

export default function ReviewCard({ ticket, onSubmitted }: Props) {
  const [agentCategory, setAgentCategory] = useState(ticket.predicted_category || "General");
  const [agentUrgency, setAgentUrgency] = useState(ticket.predicted_urgency || "Low");
  const [agentId, setAgentId] = useState("agent_001");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      setLoading(true);
      await submitFeedback({
        ticket_id: ticket.id,
        agent_category: agentCategory,
        agent_urgency: agentUrgency,
        agent_id: agentId || "agent_001",
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <div className="text-xs text-slate-500">Ticket ID: {ticket.id}</div>
      <p className="text-sm">{ticket.text}</p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Model Category:</span>
        <CategoryBadge value={ticket.predicted_category} />
        <ConfidenceBadge value={ticket.category_confidence} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Model Urgency:</span>
        <UrgencyBadge value={ticket.predicted_urgency} />
        <ConfidenceBadge value={ticket.urgency_confidence} />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <select
          value={agentCategory}
          onChange={(e) => setAgentCategory(e.target.value)}
          className="rounded-md border p-2 text-sm"
        >
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={agentUrgency}
          onChange={(e) => setAgentUrgency(e.target.value)}
          className="rounded-md border p-2 text-sm"
        >
          {urgencyOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="agent_001"
          className="rounded-md border p-2 text-sm"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
