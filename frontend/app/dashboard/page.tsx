// explanation about why those changes were done.
// Implements dashboard KPIs + charts + model info + manual retrain trigger with project-level simplified confidence trend.

// Internal working of code
// Loads metrics/model-info in parallel, converts distribution into chart data, generates simple trend points from current avg confidence, and renders charts with Recharts.
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={() => void loadData()} className="rounded-md border px-3 py-1 text-sm">
          Refresh
        </button>
        <button onClick={() => void onRetrainClick()} className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white">
          Trigger Retrain
        </button>
      </div>

      {retrainMessage && <div className="rounded-md border bg-blue-50 p-3 text-sm text-blue-700">{retrainMessage}</div>}
      {loading && <div className="text-sm text-slate-600">Loading...</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && metrics && modelInfo && (
        <>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Card label="Total Tickets" value={String(metrics.total_tickets)} />
            <Card label="Auto Routed" value={String(metrics.auto_routed)} />
            <Card label="Pending Review" value={String(metrics.pending_review)} />
            <Card label="Reviewed" value={String(metrics.reviewed)} />
            <Card label="Auto Route %" value={`${metrics.auto_route_percentage}%`} />
            <Card label="Override Rate" value={`${metrics.override_rate}%`} />
            <Card label="Avg Confidence" value={(metrics.avg_confidence * 100).toFixed(2) + "%"} />
            <Card label="Model Version" value={metrics.model_version} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 font-semibold">Category Distribution</h2>
              <PieChart width={420} height={280}>
                <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 font-semibold">Confidence Trend (Simplified)</h2>
              <LineChart width={460} height={280} data={confidenceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="confidence" stroke="#2563eb" />
              </LineChart>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 text-sm">
            <h2 className="mb-2 font-semibold">Model Info</h2>
            <div>Category Version: {modelInfo.category_model_version}</div>
            <div>Urgency Version: {modelInfo.urgency_model_version}</div>
            <div>Category Accuracy: {modelInfo.category_accuracy ?? "N/A"}</div>
            <div>Urgency Accuracy: {modelInfo.urgency_accuracy ?? "N/A"}</div>
            <div>Last Trained: {modelInfo.last_trained ?? "N/A"}</div>
          </div>
        </>
      )}
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-all text-lg font-semibold">{value}</div>
    </div>
  );
}
