"use client";

import { AlertCircle, Database } from "lucide-react";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import SimpleLineChart from "@/components/charts/SimpleLineChart";
import RawDataBlock from "@/components/ui/RawDataBlock";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractSeries, type Extracted } from "@/lib/extract";
import type { MetricDef } from "@/lib/metrics";
import type { MetricEnvelope } from "@/lib/types";

function fmt(n: number): string {
  const abs = Math.abs(n);
  const decimals = abs >= 100 || Number.isInteger(n) ? 0 : abs >= 1 ? 1 : 2;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function StatLine({ series }: { series: Extracted }) {
  const vals = series.points.map((p) => p.value);
  if (vals.length === 0) return null;
  const latest = vals[vals.length - 1];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      <span>
        <span className="font-medium text-foreground">{fmt(latest)}</span> latest
      </span>
      {vals.length > 1 && <span>avg {fmt(avg)}</span>}
      <span>· {series.count} pts</span>
    </div>
  );
}

function Body({ metric, env }: { metric: MetricDef; env: MetricEnvelope }) {
  if (!env.ok) {
    const msg = env.error === "not_connected" ? "Not connected" : env.error ?? "Unknown error";
    return (
      <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span className="break-words">{msg}</span>
      </div>
    );
  }

  const series = extractSeries(env);

  if (series.count === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        <Database size={14} /> No data in range
      </div>
    );
  }

  // Single numeric reading (e.g. height) — show it big.
  if (metric.chart === "value" || series.points.length === 1) {
    const last = series.points[series.points.length - 1];
    return (
      <div>
        <div className="text-3xl font-semibold tracking-tight">
          {last ? fmt(last.value) : "—"}
          {series.unitHint && (
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              {series.unitHint}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {series.count} point{series.count === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  if (series.points.length >= 2) {
    return (
      <div>
        {metric.chart === "line" ? (
          <SimpleLineChart data={series.points} />
        ) : (
          <SimpleBarChart data={series.points} />
        )}
        <StatLine series={series} />
      </div>
    );
  }

  return (
    <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
      {series.count} data point{series.count === 1 ? "" : "s"} — open Raw JSON to inspect.
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
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{metric.title}</CardTitle>
          {env.record && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {env.record}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <Body metric={metric} env={env} />
        <RawDataBlock data={env.ok ? env.data : { error: env.error }} />
      </CardContent>
    </Card>
  );
}
