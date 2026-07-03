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

export default function Section({
  section,
  metrics,
}: {
  section: SectionDef;
  metrics: AllMetrics;
}) {
  return (
    <section id={section.id} className="scroll-mt-4">
      <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold text-gray-900">
        {section.title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.metrics.map((m) => (
          <MetricCard key={m.slug} metric={m} env={metrics[m.slug] ?? MISSING} />
        ))}
      </div>
    </section>
  );
}
