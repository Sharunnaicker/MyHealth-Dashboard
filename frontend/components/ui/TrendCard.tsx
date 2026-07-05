import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCol {
  label: string;
  value: string;
}

// A titled card with an optional uppercase micro-label, a right-aligned value badge, an optional
// row of small stat columns, a chart (children), and an optional footer. Used across every page's
// trend / detail cards so they read as one system.
export default function TrendCard({
  icon: Icon,
  title,
  microLabel,
  accent = "var(--primary)",
  valueBadge,
  cols,
  footer,
  children,
  className,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  microLabel?: string;
  accent?: string;
  valueBadge?: ReactNode;
  cols?: StatCol[];
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {microLabel && (
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {microLabel}
            </div>
          )}
          <div className="flex items-center gap-2">
            {Icon && (
              <span
                className="flex size-6 items-center justify-center rounded-md"
                style={{ color: accent, backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)` }}
              >
                <Icon size={13} />
              </span>
            )}
            <span className="font-heading text-sm font-semibold tracking-tight">{title}</span>
          </div>
        </div>
        {valueBadge && (
          <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {valueBadge}
          </span>
        )}
      </div>

      {cols && cols.length > 0 && (
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {cols.map((c) => (
            <div key={c.label} className="min-w-0">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {children}

      {footer && <div className="border-t border-border/60 pt-3">{footer}</div>}
    </Card>
  );
}
