import { ArrowDown, ArrowUp } from "lucide-react";
import { signed } from "@/lib/derive/format";
import { cn } from "@/lib/utils";

// A "+6,380 steps · 7 days" style delta line. Subtle by default (matches the design);
// pass `goodDirection` to tint improvements green / regressions red.
export default function DeltaBadge({
  diff,
  suffix,
  goodDirection = "none",
  className,
}: {
  diff: number | null;
  suffix?: string; // e.g. "steps · 7 days"
  goodDirection?: "up" | "down" | "none";
  className?: string;
}) {
  if (diff === null) return null;
  const rounded = Math.round(diff);
  const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const Arrow = dir === "down" ? ArrowDown : ArrowUp;

  const good =
    goodDirection === "none" || dir === "flat"
      ? null
      : goodDirection === dir;
  const tone =
    good === null ? "text-muted-foreground" : good ? "text-emerald-500" : "text-rose-500";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", tone, className)}>
      {dir !== "flat" && <Arrow size={12} className="shrink-0" />}
      <span className="font-medium">{signed(rounded)}</span>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}
