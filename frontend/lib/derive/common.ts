// Raw dataPoint parsing shared by the derivation layer. Mirrors the value/timestamp logic in
// `lib/extract.ts` but keeps per-point day + hour so we can aggregate by calendar day (daily
// totals, per-hour distribution) — which `extractSeries` flattens away.
//
// Scope: only the HIGH-CONFIDENCE shapes documented in extract.ts (a scalar sibling of a time
// container, or interval duration in minutes). Nested session detail (sleep stages, workout
// distance/bpm) is intentionally NOT parsed here — see the plan's "exact data or nothing" policy.

import type { AllMetrics, DataPoint, MetricEnvelope } from "@/lib/types";

const TIME_CONTAINER_KEYS = new Set([
  "interval",
  "sampleTime",
  "date",
  "civilTime",
  "civilStartTime",
  "civilEndTime",
]);
const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;

export interface Point {
  t: number; // sort key (ms epoch, or index when undated)
  day: string; // local "YYYY-MM-DD", "" when undated
  hour: number; // local hour 0–23
  value: number;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && NUMERIC_STRING.test(v.trim())) return parseFloat(v);
  return null;
}

function payload(dp: DataPoint): Record<string, unknown> | null {
  for (const [k, v] of Object.entries(dp)) {
    if (k === "dataSource" || k === "name") continue;
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  return null;
}

function isoOf(obj: Record<string, unknown>): string | null {
  const interval = obj.interval as Record<string, unknown> | undefined;
  if (typeof interval?.startTime === "string") return interval.startTime;
  const sample = obj.sampleTime as Record<string, unknown> | undefined;
  if (typeof sample?.physicalTime === "string") return sample.physicalTime;
  const date = obj.date as { year?: number; month?: number; day?: number } | undefined;
  if (date?.year && date.month && date.day) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  }
  return null;
}

function valueOf(obj: Record<string, unknown>): number | null {
  for (const [k, v] of Object.entries(obj)) {
    if (TIME_CONTAINER_KEYS.has(k) || k.endsWith("Metadata")) continue;
    const n = toNumber(v);
    if (n !== null) return n;
  }
  const interval = obj.interval as Record<string, unknown> | undefined;
  if (typeof interval?.startTime === "string" && typeof interval?.endTime === "string") {
    const mins = (Date.parse(interval.endTime) - Date.parse(interval.startTime)) / 60000;
    if (Number.isFinite(mins)) return Math.round(mins);
  }
  return null;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse an envelope into dated, sorted points (oldest → newest). Empty when missing/errored. */
export function points(env: MetricEnvelope | undefined): Point[] {
  if (!env || !env.ok) return [];
  const dps = env.data?.dataPoints ?? [];
  const out: Point[] = [];
  for (const dp of dps) {
    const obj = payload(dp);
    if (!obj) continue;
    const value = valueOf(obj);
    if (value === null) continue;
    const iso = isoOf(obj);
    const d = iso ? new Date(iso) : null;
    const valid = d && !Number.isNaN(d.getTime());
    out.push({
      t: valid ? d.getTime() : out.length,
      day: valid ? dayKey(d) : "",
      hour: valid ? d.getHours() : 0,
      value,
    });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

export interface DayValue {
  day: string;
  value: number;
}

/** Sum values per calendar day (steps/distance/minutes intervals → daily totals). */
export function dailyTotals(m: AllMetrics, slug: string): DayValue[] {
  const byDay = new Map<string, number>();
  for (const p of points(m[slug])) {
    if (!p.day) continue;
    byDay.set(p.day, (byDay.get(p.day) ?? 0) + p.value);
  }
  return [...byDay.entries()].map(([day, value]) => ({ day, value })).sort((a, b) => a.day.localeCompare(b.day));
}

/** Last value per calendar day (for daily records like resting-heart-rate). */
export function dailyLast(m: AllMetrics, slug: string): DayValue[] {
  const byDay = new Map<string, number>();
  for (const p of points(m[slug])) {
    if (!p.day) continue;
    byDay.set(p.day, p.value); // points are sorted, so the last write wins
  }
  return [...byDay.entries()].map(([day, value]) => ({ day, value })).sort((a, b) => a.day.localeCompare(b.day));
}

/** Total for the most recent day present in a summed series. */
export function todayTotal(days: DayValue[]): number | null {
  return days.length ? days[days.length - 1].value : null;
}

/** Mean across days, optionally excluding the most recent (for "vs N-day average"). */
export function meanOfDays(days: DayValue[], excludeLast = false): number | null {
  const arr = excludeLast ? days.slice(0, -1) : days;
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b.value, 0) / arr.length;
}

/** The single most-recent sample value (for scalars like HRV / SpO₂ / temperature). */
export function latestValue(m: AllMetrics, slug: string): number | null {
  const pts = points(m[slug]);
  return pts.length ? pts[pts.length - 1].value : null;
}

/** 24-slot per-hour totals for the most recent day (steps-per-hour distribution). */
export function hourlyForLatestDay(m: AllMetrics, slug: string): { hour: number; value: number }[] {
  const pts = points(m[slug]);
  const dated = pts.filter((p) => p.day);
  if (dated.length === 0) return [];
  const lastDay = dated[dated.length - 1].day;
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
  for (const p of dated) {
    if (p.day === lastDay) hours[p.hour].value += p.value;
  }
  return hours;
}
