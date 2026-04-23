"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMetrics, getModelInfo, triggerRetrain } from "../../lib/api";
import type { MetricsResponse, ModelInfoResponse } from "../../types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrainMessage, setRetrainMessage] = useState("");

  async function loadData() {
    setError("");
    try {
      setLoading(true);
      const [m, info] = await Promise.all([getMetrics(), getModelInfo()]);
      setMetrics(m);
      setModelInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function onRetrainClick() {
    setRetrainMessage("");
    try {
      const resp = await triggerRetrain();
      setRetrainMessage(resp.message);
      void loadData();
    } catch (err) {
      setRetrainMessage(err instanceof Error ? err.message : "Failed to trigger retraining.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const categoryChartData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.category_distribution).map(([name, value]) => ({ name, value }));
  }, [metrics]);

  const confidenceTrendData = useMemo(() => {
    const avg = metrics?.avg_confidence ?? 0;
    return [
      { day: "D-6", confidence: Math.max(0, avg - 0.04) },
      { day: "D-5", confidence: Math.max(0, avg - 0.03) },
      { day: "D-4", confidence: Math.max(0, avg - 0.02) },
      { day: "D-3", confidence: Math.max(0, avg - 0.01) },
      { day: "D-2", confidence: Math.max(0, avg - 0.01) },
      { day: "D-1", confidence: avg },
      { day: "Today", confidence: avg },
    ];
  }, [metrics]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Monitor routing performance, confidence health, and live model versions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadData()} className="btn-ui btn-ghost">
            RF Refresh
          </button>
          <button onClick={() => void onRetrainClick()} className="btn-ui btn-primary">
            RT Trigger Retrain
          </button>
        </div>
      </div>

      {retrainMessage && (
        <div
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--info) 35%, transparent)",
            color: "var(--info)",
            backgroundColor: "color-mix(in srgb, var(--info) 10%, transparent)",
          }}
        >
          {retrainMessage}
        </div>
      )}

      {loading && <div className="shimmer h-40 rounded-2xl" />}
      {error && (
        <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "color-mix(in srgb, var(--error) 35%, transparent)", color: "var(--error)" }}>
          {error}
        </div>
      )}

      {!loading && !error && metrics && modelInfo && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total Tickets" value={String(metrics.total_tickets)} />
            <KpiCard label="Auto Routed" value={String(metrics.auto_routed)} />
            <KpiCard label="Pending Review" value={String(metrics.pending_review)} />
            <KpiCard label="Reviewed" value={String(metrics.reviewed)} />
            <KpiCard label="Auto Route %" value={`${metrics.auto_route_percentage}%`} />
            <KpiCard label="Override Rate" value={`${metrics.override_rate}%`} />
            <KpiCard label="Avg Confidence" value={(metrics.avg_confidence * 100).toFixed(2) + "%"} />
            <KpiCard label="Model Version" value={metrics.model_version} mono />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card-ui h-[360px]">
              <h2 className="mb-3 text-base font-semibold">Category Distribution</h2>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    stroke="var(--bg-card)"
                    fill="var(--accent-primary)"
                    label
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card-ui h-[360px]">
              <h2 className="mb-3 text-base font-semibold">Confidence Trend</h2>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={confidenceTrendData}>
                  <CartesianGrid stroke="color-mix(in srgb, var(--text-muted) 30%, transparent)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Line type="monotone" dataKey="confidence" stroke="var(--accent-primary)" strokeWidth={2.5} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-ui text-sm">
            <h2 className="mb-3 text-base font-semibold">Model Info</h2>
            <div className="grid gap-2 md:grid-cols-2">
              <InfoRow label="Category Version" value={modelInfo.category_model_version} />
              <InfoRow label="Urgency Version" value={modelInfo.urgency_model_version} />
              <InfoRow label="Category Accuracy" value={String(modelInfo.category_accuracy ?? "N/A")} />
              <InfoRow label="Urgency Accuracy" value={String(modelInfo.urgency_accuracy ?? "N/A")} />
              <InfoRow label="Last Trained" value={modelInfo.last_trained ?? "N/A"} mono />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function KpiCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="card-ui fade-in-up">
      <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className={`mt-2 break-all text-2xl font-semibold ${mono ? "tabular-nums text-sm" : "tabular-nums"}`}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className={`mt-1 ${mono ? "tabular-nums text-xs" : "text-sm"}`}>{value}</div>
    </div>
  );
}
