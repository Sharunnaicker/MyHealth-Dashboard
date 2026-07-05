// Today (overview) view-model — composed strictly from HIGH-CONFIDENCE scalar/interval series.
// Deliberately omits sleep-stage composition, efficiency, and the workouts list: those depend on
// nested session shapes we haven't confirmed against real payloads yet (see plan's data policy).

import {
  dailyLast,
  dailyTotals,
  hourlyForLatestDay,
  latestValue,
  meanOfDays,
  todayTotal,
  type DayValue,
} from "./common";
import { dayLabel } from "./format";
import type { AllMetrics } from "@/lib/types";

export interface StatBlock {
  value: number | null; // most recent day's value
  avg: number | null; // mean of prior days in window
  diff: number | null; // value − avg
  avgDays: number; // number of days the average is built from
}

export interface TrendBlock extends StatBlock {
  series: { label: string; value: number }[];
}

function blockFromDays(days: DayValue[]): StatBlock {
  const value = todayTotal(days);
  const avg = meanOfDays(days, true);
  return {
    value,
    avg,
    diff: value !== null && avg !== null ? value - avg : null,
    avgDays: Math.max(0, days.length - 1),
  };
}

function trendFromDays(days: DayValue[]): TrendBlock {
  return {
    ...blockFromDays(days),
    series: days.map((d) => ({ label: dayLabel(d.day), value: d.value })),
  };
}

export interface TodayVM {
  steps: TrendBlock;
  sleepMinutes: TrendBlock;
  restingHr: TrendBlock;
  // Movement detail (today's totals)
  activeMinutes: number | null;
  zoneMinutes: number | null;
  distanceKm: number | null;
  sedentaryMinutes: number | null;
  calories: number | null;
  floors: number | null;
  stepsByHour: { hour: number; value: number }[];
  // Nightly signals (latest sample of each)
  hrv: number | null;
  spo2: number | null;
  breathing: number | null;
  tempDeviation: number | null;
}

export function deriveToday(m: AllMetrics): TodayVM {
  const distanceDays = dailyTotals(m, "distance");
  return {
    steps: trendFromDays(dailyTotals(m, "steps")),
    sleepMinutes: trendFromDays(dailyTotals(m, "sleep")),
    restingHr: trendFromDays(dailyLast(m, "resting-heart-rate")),

    activeMinutes: todayTotal(dailyTotals(m, "active-minutes")),
    zoneMinutes: todayTotal(dailyTotals(m, "active-zone-minutes")),
    distanceKm: (() => {
      const mm = todayTotal(distanceDays);
      return mm === null ? null : mm / 1_000_000;
    })(),
    sedentaryMinutes: todayTotal(dailyTotals(m, "sedentary-period")),
    calories: todayTotal(dailyTotals(m, "total-calories")),
    floors: todayTotal(dailyTotals(m, "floors")),
    stepsByHour: hourlyForLatestDay(m, "steps"),

    hrv: latestValue(m, "hrv"),
    spo2: latestValue(m, "daily-spo2"),
    breathing: latestValue(m, "respiratory-rate"),
    tempDeviation: latestValue(m, "sleep-temp"),
  };
}
