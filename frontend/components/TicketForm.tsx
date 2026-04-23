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
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="gradient-border fade-in-up space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="tabular-nums text-[10px]">ML</span>
          <span>Smart Ticket Intake</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Ticket Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I was charged twice for my subscription this month, please help"
            className="input-ui min-h-[130px] resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading} className="btn-ui btn-primary disabled:cursor-not-allowed disabled:opacity-60">
            <span className="tabular-nums text-[10px]">{loading ? ".." : "GO"}</span>
            {loading ? "Classifying..." : "Submit Ticket"}
          </button>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Confidence gate auto-routes tickets above your configured threshold.
          </p>
        </div>
      </form>

      {error && (
        <div className="card-ui glow-red border" style={{ borderColor: "color-mix(in srgb, var(--error) 35%, transparent)", color: "var(--error)" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="card-ui fade-in-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Prediction Result</h3>
            <span className="tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
              ID: {result.ticket_id}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                Category
              </div>
              <div className="flex items-center gap-2">
                <CategoryBadge value={result.category} />
                <ConfidenceBadge value={result.category_confidence} />
              </div>
            </div>

            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                Urgency
              </div>
              <div className="flex items-center gap-2">
                <UrgencyBadge value={result.urgency} />
                <ConfidenceBadge value={result.urgency_confidence} />
              </div>
            </div>

            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                Combined Confidence
              </div>
              <ConfidenceBadge value={result.combined_confidence} />
            </div>

            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                Routing Outcome
              </div>
              <div className="text-sm font-medium">{result.routing_team}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                Status: {result.status}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
