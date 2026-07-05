"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  RANGES,
  type RangeKey,
  getAllMetrics,
  getAuthStatus,
  startDateForDays,
} from "@/lib/api";
import type { AllMetrics } from "@/lib/types";

export type Phase = "checking" | "disconnected" | "loading" | "ready" | "error";

function daysFor(key: RangeKey): number {
  return RANGES.find((r) => r.key === key)?.days ?? 7;
}

interface DashboardCtx {
  phase: Phase;
  metrics: AllMetrics;
  error: string | null;
  range: RangeKey;
  setRange: (r: RangeKey) => void;
  reload: () => void;
  startDate: string;
  withData: number;
  total: number;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const Ctx = createContext<DashboardCtx | null>(null);

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

export default function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [metrics, setMetrics] = useState<AllMetrics>({});
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("7d");
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Async first statement (await) keeps this out of the "synchronous setState in effect" path.
  const load = useCallback(async (rangeKey: RangeKey) => {
    const status = await getAuthStatus();
    if (!status.authenticated) {
      setPhase("disconnected");
      return;
    }
    setPhase("loading");
    setError(null);
    try {
      setMetrics(await getAllMetrics(startDateForDays(daysFor(rangeKey))));
      setPhase("ready");
    } catch (e) {
      setError(String(e));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    // Client-side data fetch on mount / range change. The setState here is the fetch result,
    // not synchronous render-loop state, so the cascading-render concern doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(range);
  }, [load, range]);

  const withData = Object.values(metrics).filter(
    (m) => m.ok && (m.data?.dataPoints?.length ?? 0) > 0,
  ).length;

  const value: DashboardCtx = {
    phase,
    metrics,
    error,
    range,
    setRange,
    reload: () => load(range),
    startDate: startDateForDays(daysFor(range)),
    withData,
    total: Object.keys(metrics).length,
    chatOpen,
    setChatOpen,
    sidebarOpen,
    setSidebarOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
