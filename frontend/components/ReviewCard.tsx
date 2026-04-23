"use client";

import { useMemo, useState } from "react";
import { submitFeedback } from "../lib/api";
import type { Ticket } from "../types";
import CategoryBadge from "./CategoryBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import UrgencyBadge from "./UrgencyBadge";

interface Props {
  ticket: Ticket;
  onSubmitted: (mode: "confirmed" | "corrected") => void;
}

const categoryOptions = ["Billing", "Refund", "Technical Issue", "Cancellation", "Product Inquiry", "General"];
const urgencyOptions = ["Critical", "High", "Medium", "Low"];

export default function ReviewCard({ ticket, onSubmitted }: Props) {
  const initialCategory = ticket.predicted_category || "General";
  const initialUrgency = ticket.predicted_urgency || "Low";

  const [agentCategory, setAgentCategory] = useState(initialCategory);
  const [agentUrgency, setAgentUrgency] = useState(initialUrgency);
  const [agentId, setAgentId] = useState("agent_001");
  const [loadingMode, setLoadingMode] = useState<"confirmed" | "corrected" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const isChanged = useMemo(
    () => agentCategory !== initialCategory || agentUrgency !== initialUrgency,
    [agentCategory, agentUrgency, initialCategory, initialUrgency],
  );

  async function handleSubmit(mode: "confirmed" | "corrected") {
    setError("");
    setLoadingMode(mode);

    try {
      await submitFeedback({
        ticket_id: ticket.id,
        agent_category: agentCategory,
        agent_urgency: agentUrgency,
        agent_id: agentId || "agent_001",
      });

      setDone(true);
      if (mode === "corrected") {
        setShowToast(true);
        window.setTimeout(() => setShowToast(false), 1800);
      }

      window.setTimeout(() => onSubmitted(mode), 320);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <div className="relative">
      {showToast && (
        <div
          className="fade-in-up absolute -top-3 right-0 z-10 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{
            color: "var(--success)",
            borderColor: "color-mix(in srgb, var(--success) 35%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)",
          }}
        >
          Correction submitted successfully
        </div>
      )}

      <div className={`card-ui transition-all duration-300 ${done ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
            Ticket ID: {ticket.id}
          </span>
          <ConfidenceBadge value={ticket.combined_confidence} />
        </div>

        <p className="mb-4 text-sm leading-6" style={{ color: "var(--text-primary)" }}>
          {ticket.text}
        </p>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
              Model Category
            </div>
            <div className="flex items-center gap-2">
              <CategoryBadge value={ticket.predicted_category} />
              <ConfidenceBadge value={ticket.category_confidence} />
            </div>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
              Model Urgency
            </div>
            <div className="flex items-center gap-2">
              <UrgencyBadge value={ticket.predicted_urgency} />
              <ConfidenceBadge value={ticket.urgency_confidence} />
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <select value={agentCategory} onChange={(e) => setAgentCategory(e.target.value)} className="input-ui">
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={agentUrgency} onChange={(e) => setAgentUrgency(e.target.value)} className="input-ui">
            {urgencyOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent_001" className="input-ui" />
        </div>

        {error && (
          <div className="mb-3 text-sm" style={{ color: "var(--error)" }}>
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("confirmed")}
            disabled={loadingMode !== null}
            className="btn-ui btn-success disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="tabular-nums text-[10px]">{loadingMode === "confirmed" ? ".." : "OK"}</span>
            Confirm
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("corrected")}
            disabled={!isChanged || loadingMode !== null}
            className="btn-ui btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="tabular-nums text-[10px]">{loadingMode === "corrected" ? ".." : "ED"}</span>
            Submit Correction
          </button>

          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {isChanged ? "Correction detected" : "No changes from model prediction"}
          </span>
        </div>
      </div>
    </div>
  );
}
