// Shared display formatters. Lifted so pages, stat cards, and the /data explorer format
// numbers the same way.

export function fmt(n: number): string {
  const abs = Math.abs(n);
  const decimals = abs >= 100 || Number.isInteger(n) ? 0 : abs >= 1 ? 1 : 2;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

// Minutes → "5h 40m" (or "40m" when under an hour).
export function hm(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

// A signed delta like "+6,380" / "−105" (unicode minus for alignment).
export function signed(n: number): string {
  const rounded = Math.round(n);
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${fmt(rounded)}` : `−${fmt(Math.abs(rounded))}`;
}

// "Saturday, July 4" — the Today page subtitle.
export function longDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// "Jul 4" — compact date used in the top bar.
export function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// A "YYYY-MM-DD" (local) → "Jul 4" axis label.
export function dayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return dayKey;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
