// Series extraction, targeted at the real Google Health dataPoint shape.
//
// Every dataPoint looks like:
//   { dataSource: {...}, name?: "...", <camelType>: { <timeContainer>, <valueField> } }
// where:
//   - <camelType>       is the data type key, e.g. steps / heartRate / dailyRestingHeartRate
//   - <timeContainer>   is `interval` (startTime), `sampleTime` (physicalTime), or `date` (y/m/d)
//   - <valueField>      is a scalar SIBLING of the time container, often a numeric STRING,
//                       e.g. steps.count="51", distance.millimeters="37600",
//                       heartRate.beatsPerMinute="85", weight.weightGrams=80286.
//
// Sessions (sleep) carry no scalar — we derive duration in minutes from the interval.
// The raw-JSON toggle on each card remains the source of truth; this just gives a useful chart.

import type { DataPoint, MetricEnvelope } from "./types";

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface Extracted {
  points: SeriesPoint[];
  count: number; // total data points returned (pre-downsample)
  valuePath: string | null; // e.g. "steps.count" — shown on the card for transparency
  unitHint: string | null; // the value field name, e.g. "millimeters"
}

const TIME_CONTAINER_KEYS = new Set([
  "interval",
  "sampleTime",
  "date",
  "civilTime",
  "civilStartTime",
  "civilEndTime",
]);

const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;
const MAX_POINTS = 180; // downsample dense per-minute series to keep charts readable

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && NUMERIC_STRING.test(v.trim())) return parseFloat(v);
  return null;
}

// The data-type payload is the one top-level object key that isn't metadata.
function getPayload(dp: DataPoint): { key: string; obj: Record<string, unknown> } | null {
  for (const [k, v] of Object.entries(dp)) {
    if (k === "dataSource" || k === "name") continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return { key: k, obj: v as Record<string, unknown> };
    }
  }
  return null;
}

interface Stamp {
  iso: string;
  sortKey: number;
  hasTime: boolean;
}

function getTimestamp(obj: Record<string, unknown>): Stamp | null {
  const interval = obj.interval as Record<string, unknown> | undefined;
  if (interval?.startTime && typeof interval.startTime === "string") {
    return { iso: interval.startTime, sortKey: Date.parse(interval.startTime), hasTime: true };
  }
  const sampleTime = obj.sampleTime as Record<string, unknown> | undefined;
  if (sampleTime?.physicalTime && typeof sampleTime.physicalTime === "string") {
    return {
      iso: sampleTime.physicalTime,
      sortKey: Date.parse(sampleTime.physicalTime),
      hasTime: true,
    };
  }
  const date = obj.date as { year?: number; month?: number; day?: number } | undefined;
  if (date?.year && date.month && date.day) {
    const iso = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
    return { iso, sortKey: Date.parse(iso), hasTime: false };
  }
  return null;
}

// The measurement: first numeric(-string) scalar sibling of the time container.
// Falls back to interval duration (minutes) for sessions like sleep.
function getValue(obj: Record<string, unknown>): { key: string; value: number } | null {
  for (const [k, v] of Object.entries(obj)) {
    if (TIME_CONTAINER_KEYS.has(k)) continue;
    if (k.endsWith("Metadata")) continue;
    const n = toNumber(v);
    if (n !== null) return { key: k, value: n };
  }
  const interval = obj.interval as Record<string, unknown> | undefined;
  if (
    interval?.startTime &&
    interval?.endTime &&
    typeof interval.startTime === "string" &&
    typeof interval.endTime === "string"
  ) {
    const mins = (Date.parse(interval.endTime) - Date.parse(interval.startTime)) / 60000;
    if (Number.isFinite(mins)) return { key: "durationMin", value: Math.round(mins) };
  }
  return null;
}

function shortLabel(iso: string, hasTime: boolean): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!m) return iso;
  const [, , mm, dd, hm] = m;
  return hasTime && hm ? `${mm}-${dd} ${hm}` : `${mm}-${dd}`;
}

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

export function extractSeries(env: MetricEnvelope): Extracted {
  const dps = env.data?.dataPoints ?? [];
  const empty: Extracted = { points: [], count: dps.length, valuePath: null, unitHint: null };
  if (dps.length === 0) return empty;

  let valuePath: string | null = null;
  let unitHint: string | null = null;

  const raw: { sortKey: number; label: string; value: number }[] = [];
  for (const dp of dps) {
    const payload = getPayload(dp);
    if (!payload) continue;
    const stamp = getTimestamp(payload.obj);
    const val = getValue(payload.obj);
    if (!val) continue;
    if (!valuePath) {
      valuePath = `${payload.key}.${val.key}`;
      unitHint = val.key;
    }
    raw.push({
      sortKey: stamp ? stamp.sortKey : raw.length,
      label: stamp ? shortLabel(stamp.iso, stamp.hasTime) : String(raw.length + 1),
      value: val.value,
    });
  }

  if (raw.length === 0) return empty;

  // Oldest -> newest so charts read left (past) to right (present).
  raw.sort((a, b) => a.sortKey - b.sortKey);
  const points = downsample(raw, MAX_POINTS).map((p) => ({ label: p.label, value: p.value }));

  return { points, count: dps.length, valuePath, unitHint };
}
