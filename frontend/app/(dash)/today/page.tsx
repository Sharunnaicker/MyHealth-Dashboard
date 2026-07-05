"use client";

import { Footprints, HeartPulse, Moon, Wind } from "lucide-react";
import { useMemo } from "react";
import HourlyBars from "@/components/charts/HourlyBars";
import TrendBars from "@/components/charts/TrendBars";
import TrendLine from "@/components/charts/TrendLine";
import { useDashboard } from "@/components/layout/DashboardProvider";
import DeltaBadge from "@/components/ui/DeltaBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import StatCard from "@/components/ui/StatCard";
import TrendCard from "@/components/ui/TrendCard";
import { Card } from "@/components/ui/card";
import { deriveToday } from "@/lib/derive/today";
import { fmt, hm } from "@/lib/derive/format";

const ACTIVITY = "var(--accent-activity)";
const SLEEP = "var(--accent-sleep)";
const HEALTH = "var(--accent-health)";

function num(n: number | null, suffix = ""): string {
  return n === null ? "—" : `${fmt(n)}${suffix}`;
}

function signedHm(min: number): string {
  return `${min >= 0 ? "+" : "−"}${hm(Math.abs(min))}`;
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function TodayPage() {
  const { metrics } = useDashboard();
  const t = useMemo(() => deriveToday(metrics), [metrics]);

  const avgLabel = (days: number) => (days > 0 ? `${days}-day avg` : "average");

  return (
    <div className="space-y-8">
      {/* Overview */}
      <section>
        <SectionHeading title="Overview" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Footprints}
            accent={ACTIVITY}
            label="Movement"
            value={num(t.steps.value)}
            delta={
              <DeltaBadge
                diff={t.steps.diff}
                suffix={`steps · ${t.steps.avgDays} days`}
                goodDirection="up"
              />
            }
          />
          <StatCard
            icon={Moon}
            accent={SLEEP}
            label="Sleep"
            value={t.sleepMinutes.value === null ? "—" : hm(t.sleepMinutes.value)}
            delta={
              t.sleepMinutes.diff === null ? undefined : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-medium">{signedHm(Math.round(t.sleepMinutes.diff))}</span>
                  <span>· {t.sleepMinutes.avgDays} nights</span>
                </span>
              )
            }
          />
          <StatCard
            icon={HeartPulse}
            accent={HEALTH}
            label="Resting heart rate"
            value={num(t.restingHr.value)}
            unit="bpm"
            delta={
              <DeltaBadge
                diff={t.restingHr.diff}
                suffix={`bpm · ${t.restingHr.avgDays} days`}
                goodDirection="down"
              />
            }
          />
        </div>
      </section>

      {/* Activity and recovery */}
      <section>
        <SectionHeading title="Activity and recovery" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendCard
            icon={Footprints}
            title="Movement"
            accent={ACTIVITY}
            footer={
              <div className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
                <Signal label="Active minutes" value={num(t.activeMinutes, " min")} />
                <Signal label="Zone minutes" value={num(t.zoneMinutes, " min")} />
                <Signal
                  label="Distance"
                  value={t.distanceKm === null ? "—" : `${fmt(t.distanceKm)} km`}
                />
                <Signal
                  label="Sedentary time"
                  value={t.sedentaryMinutes === null ? "—" : hm(t.sedentaryMinutes)}
                />
              </div>
            }
          >
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-semibold tabular-nums">
                  {num(t.steps.value)}
                </span>
                <span className="text-sm text-muted-foreground">steps</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Steps per hour</div>
              <div className="mt-2">
                <HourlyBars data={t.stepsByHour} color={ACTIVITY} />
              </div>
            </div>
          </TrendCard>

          <div className="flex flex-col gap-4">
            {/* Nightly signals — high-confidence scalars */}
            <TrendCard icon={Wind} title="Nightly signals" accent={HEALTH}>
              <div className="grid grid-cols-2 gap-y-4">
                <Signal label="HRV" value={num(t.hrv, " ms")} />
                <Signal label="SpO₂" value={num(t.spo2, "%")} />
                <Signal label="Breathing" value={num(t.breathing, " rpm")} />
                <Signal
                  label="Temperature"
                  value={t.tempDeviation === null ? "—" : `${fmt(t.tempDeviation)} °C`}
                />
              </div>
            </TrendCard>

            <Card className="gap-1 p-5 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">Sleep stages &amp; efficiency</div>
              <p>
                Stage breakdown, the hypnogram, and efficiency arrive in a later pass — once the raw
                sleep-session shape is confirmed against your live data. No estimates are shown here.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Personal trends */}
      <section>
        <SectionHeading title="Personal trends" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TrendCard
            icon={Footprints}
            title="Steps"
            accent={ACTIVITY}
            cols={[
              { label: "Today", value: num(t.steps.value) },
              { label: avgLabel(t.steps.avgDays), value: num(t.steps.avg) },
              { label: "vs average", value: t.steps.diff === null ? "—" : `${t.steps.diff >= 0 ? "+" : "−"}${fmt(Math.abs(t.steps.diff))}` },
            ]}
          >
            <TrendBars data={t.steps.series} color={ACTIVITY} height={96} mini />
          </TrendCard>

          <TrendCard
            icon={Moon}
            title="Sleep"
            accent={SLEEP}
            cols={[
              { label: "Today", value: t.sleepMinutes.value === null ? "—" : hm(t.sleepMinutes.value) },
              { label: avgLabel(t.sleepMinutes.avgDays), value: t.sleepMinutes.avg === null ? "—" : hm(t.sleepMinutes.avg) },
              { label: "vs average", value: t.sleepMinutes.diff === null ? "—" : signedHm(Math.round(t.sleepMinutes.diff)) },
            ]}
          >
            <TrendBars data={t.sleepMinutes.series} color={SLEEP} height={96} mini />
          </TrendCard>

          <TrendCard
            icon={HeartPulse}
            title="Resting heart rate"
            accent={HEALTH}
            cols={[
              { label: "Today", value: num(t.restingHr.value, " bpm") },
              { label: avgLabel(t.restingHr.avgDays), value: num(t.restingHr.avg, " bpm") },
              { label: "vs average", value: t.restingHr.diff === null ? "—" : `${t.restingHr.diff >= 0 ? "+" : "−"}${fmt(Math.abs(t.restingHr.diff))} bpm` },
            ]}
          >
            <TrendLine data={t.restingHr.series} color={HEALTH} height={96} mini />
          </TrendCard>
        </div>
      </section>
    </div>
  );
}
