"use client";

import MetricCard from "@/components/ui/MetricCard";
import type { SectionDef } from "@/lib/metrics";
import type { AllMetrics, MetricEnvelope } from "@/lib/types";

const MISSING: MetricEnvelope = {
  ok: false,
  data: null,
  error: "no response from backend",
  data_type: "",
  record: null,
};

function hasData(env: MetricEnvelope): boolean {
  return env.ok && (env.data?.dataPoints?.length ?? 0) > 0;
}

export default function Section({
  section,
  metrics,
  onlyWithData,
}: {
  section: SectionDef;
  metrics: AllMetrics;
  onlyWithData: boolean;
}) {
  const visible = section.metrics.filter(
    (m) => !onlyWithData || hasData(metrics[m.slug] ?? MISSING),
  );
  if (visible.length === 0) return null;

  return (
    <section id={section.id} className="scroll-mt-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-lg font-bold tracking-tight">{section.title}</h2>
        <span className="text-xs text-muted-foreground">{visible.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((m) => (
          <MetricCard key={m.slug} metric={m} env={metrics[m.slug] ?? MISSING} />
        ))}
      </div>
    </section>
  );
}
