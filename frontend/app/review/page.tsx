// explanation about why those changes were done.
// Builds the review queue page and connects it to /tickets/pending + feedback workflow.

// Internal working of code
// It fetches pending tickets on mount, renders ReviewCard list, and reloads after each feedback submission
"use client";

import { useEffect, useState } from "react";
import ReviewCard from "../../components/ReviewCard";
import { getPendingTickets } from "../../lib/api";
import type { Ticket } from "../../types";

export default function ReviewPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Pending Review</h1>
        <button onClick={() => void loadPending()} className="rounded-md border px-3 py-1 text-sm">
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-slate-600">Loading...</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && tickets.length === 0 && <div className="text-sm text-slate-600">No pending tickets.</div>}

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <ReviewCard key={ticket.id} ticket={ticket} onSubmitted={() => void loadPending()} />
        ))}
      </div>
    </section>
  );
}
