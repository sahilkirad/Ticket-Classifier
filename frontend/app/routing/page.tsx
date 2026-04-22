// explanation about why those changes were done.
// Implements team-wise routed queue visualization from /tickets/routed.

// Internal working of code
// Fetches grouped payload, iterates by team, and renders ticket cards under each routing destination.
"use client";

import { useEffect, useState } from "react";
import CategoryBadge from "../../components/CategoryBadge";
import ConfidenceBadge from "../../components/ConfidenceBadge";
import UrgencyBadge from "../../components/UrgencyBadge";
import { getRoutedTickets } from "../../lib/api";
import type { RoutedTicketsResponse } from "../../types";

export default function RoutingPage() {
  const [data, setData] = useState<RoutedTicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRouted() {
    setError("");
    try {
      setLoading(true);
      const response = await getRoutedTickets();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routed tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRouted();
  }, []);

  const groups = data?.routed_tickets ?? {};

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Routing Queues</h1>
        <button onClick={() => void loadRouted()} className="rounded-md border px-3 py-1 text-sm">
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-slate-600">Loading...</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && Object.keys(groups).length === 0 && (
        <div className="text-sm text-slate-600">No routed tickets yet.</div>
      )}

      <div className="space-y-5">
        {Object.entries(groups).map(([team, tickets]) => (
          <div key={team} className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">{team}</h2>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-md border p-3">
                  <div className="mb-1 text-xs text-slate-500">{ticket.id}</div>
                  <p className="mb-2 text-sm">{ticket.text}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge value={ticket.predicted_category} />
                    <UrgencyBadge value={ticket.predicted_urgency} />
                    <ConfidenceBadge value={ticket.combined_confidence} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
