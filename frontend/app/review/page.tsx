"use client";

import { useEffect, useState } from "react";
import ReviewCard from "../../components/ReviewCard";
import { getPendingTickets } from "../../lib/api";
import type { Ticket } from "../../types";

export default function ReviewPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function loadPending() {
    setError("");
    try {
      setLoading(true);
      const data = await getPendingTickets();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPending();
  }, []);

  function handleSubmitted(mode: "confirmed" | "corrected") {
    setToast(mode === "corrected" ? "Correction stored and queued for retraining." : "Ticket confirmed by agent.");
    window.setTimeout(() => setToast(""), 1800);
    void loadPending();
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Pending Review</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Validate low-confidence predictions and feed corrections back to the model loop.
          </p>
        </div>
        <button onClick={() => void loadPending()} className="btn-ui btn-ghost">
          RF Refresh
        </button>
      </div>

      {toast && (
        <div
          className="fade-in-up rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--success) 35%, transparent)",
            color: "var(--success)",
            backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
          }}
        >
          {toast}
        </div>
      )}

      {loading && (
        <div className="grid gap-3">
          <div className="shimmer h-28 rounded-2xl" />
          <div className="shimmer h-28 rounded-2xl" />
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--error) 35%, transparent)",
            color: "var(--error)",
            backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="card-ui text-sm" style={{ color: "var(--text-secondary)" }}>
          No pending tickets. The model is routing confidently right now.
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <ReviewCard key={ticket.id} ticket={ticket} onSubmitted={handleSubmitted} />
        ))}
      </div>
    </section>
  );
}
