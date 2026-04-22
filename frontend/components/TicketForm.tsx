// explanation about why those changes were done.
// This implements your submission entry point with validation, API call, and full prediction display.

// Internal working of code
// On submit, it validates text, calls /classify, handles loading/error, and renders the returned prediction payload

"use client";

import { useState } from "react";
import { classifyTicket } from "../lib/api";
import type { ClassifyResponse } from "../types";
import CategoryBadge from "./CategoryBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import UrgencyBadge from "./UrgencyBadge";

export default function TicketForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClassifyResponse | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!text.trim()) {
      setError("Ticket text is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await classifyTicket(text.trim());
      setResult(response);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to classify ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-white p-4">
        <label className="block text-sm font-medium">Ticket Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I was charged twice for my subscription this month, please help"
          className="min-h-[120px] w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Classifying..." : "Submit Ticket"}
        </button>
      </form>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-semibold">Prediction Result</h3>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="mr-2 text-slate-600">Ticket ID:</span>
              <span className="font-mono text-xs">{result.ticket_id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Category:</span>
              <CategoryBadge value={result.category} />
              <ConfidenceBadge value={result.category_confidence} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Urgency:</span>
              <UrgencyBadge value={result.urgency} />
              <ConfidenceBadge value={result.urgency_confidence} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Combined Confidence:</span>
              <ConfidenceBadge value={result.combined_confidence} />
            </div>
            <div>
              <span className="mr-2 text-slate-600">Routing Team:</span>
              <span>{result.routing_team}</span>
            </div>
            <div>
              <span className="mr-2 text-slate-600">Status:</span>
              <span>{result.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
