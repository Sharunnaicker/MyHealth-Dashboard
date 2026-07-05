// Client-side fetchers. These hit the Next.js server-side proxy routes (under /api/*),
// which forward to the FastAPI backend. The one exception is the login link, which must
// navigate the browser straight to the backend so Google's redirect chain works.

import type { AllMetrics, AuthStatus } from "./types";

const PUBLIC_BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export function loginUrl(): string {
  return `${PUBLIC_BACKEND}/auth/login`;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const res = await fetch("/api/auth/status", { cache: "no-store" });
  if (!res.ok) return { authenticated: false };
  return res.json();
}

// `startDate` (YYYY-MM-DD) overrides the per-metric default lookback for all types.
export async function getAllMetrics(startDate?: string): Promise<AllMetrics> {
  const qs = startDate ? `?start_date=${encodeURIComponent(startDate)}` : "";
  const res = await fetch(`/api/health/all${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load metrics: HTTP ${res.status}`);
  return res.json();
}

// Presets for the date-range control. `days` is the lookback window; start date
// is computed client-side so the backend gets an explicit start_date.
export const RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export function startDateForDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
