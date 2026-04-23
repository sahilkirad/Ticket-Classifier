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
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Routing Queues</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Live queue grouped by destination teams from model category decisions.
          </p>
        </div>
        <button onClick={() => void loadRouted()} className="btn-ui btn-ghost">
          RF Refresh
        </button>
      </div>

      {loading && <div className="shimmer h-32 rounded-2xl" />}
      {error && (
        <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "color-mix(in srgb, var(--error) 35%, transparent)", color: "var(--error)" }}>
          {error}
        </div>
      )}

      {!loading && !error && Object.keys(groups).length === 0 && (
        <div className="card-ui text-sm" style={{ color: "var(--text-secondary)" }}>
          No routed tickets yet.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {Object.entries(groups).map(([team, tickets]) => (
          <div key={team} className="card-ui fade-in-up space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{team}</h2>
              <span className="badge-ui" style={{ color: "var(--info)", backgroundColor: "color-mix(in srgb, var(--info) 15%, transparent)" }}>
                Q {tickets.length}
              </span>
            </div>

            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--bg-secondary) 65%, transparent)" }}>
                  <div className="mb-1 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {ticket.id}
                  </div>
                  <p className="mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                    {ticket.text}
                  </p>
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
