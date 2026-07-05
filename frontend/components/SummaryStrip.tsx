"use client";

import { Activity, HeartPulse, Moon, Scale } from "lucide-react";
import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { extractSeries } from "@/lib/extract";
import type { AllMetrics, MetricEnvelope } from "@/lib/types";

interface Stat {
  slug: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  format: (latest: number) => string;
}

const STATS: Stat[] = [
  { slug: "resting-heart-rate", label: "Resting HR", icon: HeartPulse, format: (v) => `${Math.round(v)} bpm` },
  {
    slug: "sleep",
    label: "Last sleep",
    icon: Moon,
    format: (v) => `${Math.floor(v / 60)}h ${Math.round(v % 60)}m`,
  },
  { slug: "weight", label: "Weight", icon: Scale, format: (v) => `${(v / 1000).toFixed(1)} kg` },
  { slug: "daily-spo2", label: "SpO₂", icon: Activity, format: (v) => `${v.toFixed(0)}%` },
];

function latestOf(env: MetricEnvelope | undefined): number | null {
  if (!env || !env.ok) return null;
  const s = extractSeries(env);
  if (s.points.length === 0) return null;
  return s.points[s.points.length - 1].value;
}

export default function SummaryStrip({ metrics }: { metrics: AllMetrics }) {
  const cards = STATS.map((stat) => ({ stat, value: latestOf(metrics[stat.slug]) })).filter(
    (c) => c.value !== null,
  );
  if (cards.length === 0) return null;

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ stat, value }) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.slug} className="flex-row items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs text-muted-foreground">{stat.label}</div>
              <div className="text-xl font-semibold tracking-tight">{stat.format(value!)}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
