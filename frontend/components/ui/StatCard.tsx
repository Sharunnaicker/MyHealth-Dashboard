import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/card";

// Overview stat: icon + label header, a big value + unit, and an optional delta line.
export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  accent = "var(--primary)",
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  unit?: string;
  delta?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ color: accent, backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)` }}
        >
          <Icon size={15} />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {delta && <div className="mt-1.5">{delta}</div>}
    </Card>
  );
}
