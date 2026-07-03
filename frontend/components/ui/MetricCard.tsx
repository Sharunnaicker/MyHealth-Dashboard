"use client";

import { AlertCircle, Database } from "lucide-react";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import SimpleLineChart from "@/components/charts/SimpleLineChart";
import RawDataBlock from "@/components/ui/RawDataBlock";
import { extractSeries } from "@/lib/extract";
import type { MetricDef } from "@/lib/metrics";
import type { MetricEnvelope } from "@/lib/types";

function Body({ metric, env }: { metric: MetricDef; env: MetricEnvelope }) {
  // Error (anything other than a clean fetch). "not_connected" is handled at page level,
  // but keep a friendly fallback here too.
  if (!env.ok) {
    const msg = env.error === "not_connected" ? "Not connected" : env.error ?? "Unknown error";
    return (
      <div className="flex items-start gap-2 rounded bg-amber-50 p-3 text-xs text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span className="break-words">{msg}</span>
      </div>
    );
  }

  const series = extractSeries(env);

  if (series.count === 0) {
    return (
      <div className="flex items-center gap-2 rounded bg-gray-50 p-3 text-xs text-gray-400">
        <Database size={14} /> No data in range
      </div>
    );
  }

  // A single numeric reading (e.g. height) — show it big.
  if (metric.chart === "value" || series.points.length === 1) {
    const last = series.points[series.points.length - 1];
    return (
      <div>
        <div className="text-3xl font-semibold text-gray-900">
          {last ? last.value.toLocaleString() : "—"}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {series.count} point{series.count === 1 ? "" : "s"}
          {series.valuePath ? ` · ${series.valuePath}` : ""}
        </div>
      </div>
    );
  }

  // A chartable series.
  if (series.points.length >= 2) {
    return (
      <div>
        {metric.chart === "line" ? (
          <SimpleLineChart data={series.points} />
        ) : (
          <SimpleBarChart data={series.points} />
        )}
        <div className="mt-1 text-xs text-gray-400">
          {series.count} points · charting{" "}
          <code className="text-gray-500">{series.valuePath}</code>
        </div>
      </div>
    );
  }

  // Data exists but we couldn't pull a clean series — point the user at the raw JSON.
  return (
    <div className="rounded bg-gray-50 p-3 text-xs text-gray-500">
      {series.count} data point{series.count === 1 ? "" : "s"} returned — open Raw JSON to inspect.
    </div>
  );
}

export default function MetricCard({
  metric,
  env,
}: {
  metric: MetricDef;
  env: MetricEnvelope;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{metric.title}</h3>
        <span className="text-[10px] uppercase tracking-wide text-gray-400">
          {env.record ?? ""}
        </span>
      </div>
      <Body metric={metric} env={env} />
      <RawDataBlock data={env.ok ? env.data : { error: env.error }} />
    </div>
  );
}
