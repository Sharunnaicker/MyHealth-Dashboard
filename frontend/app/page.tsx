"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import Section from "@/components/Section";
import { getAllMetrics, getAuthStatus, loginUrl } from "@/lib/api";
import { SECTIONS } from "@/lib/metrics";
import type { AllMetrics } from "@/lib/types";

type Phase = "checking" | "disconnected" | "loading" | "ready" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [metrics, setMetrics] = useState<AllMetrics>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPhase("checking");
    setError(null);
    const status = await getAuthStatus();
    if (!status.authenticated) {
      setPhase("disconnected");
      return;
    }
    setPhase("loading");
    try {
      setMetrics(await getAllMetrics());
      setPhase("ready");
    } catch (e) {
      setError(String(e));
      setPhase("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const okCount = Object.values(metrics).filter((m) => m.ok).length;
  const withData = Object.values(metrics).filter(
    (m) => m.ok && (m.data?.dataPoints?.length ?? 0) > 0,
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Fitbit Air — Health Dashboard</h1>
        </div>
        {phase === "ready" && (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              {withData}/{Object.keys(metrics).length} types with data · {okCount} fetched OK
            </span>
            <button
              onClick={load}
              className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        )}
      </header>

      {phase === "checking" && <p className="text-gray-500">Checking connection…</p>}

      {phase === "disconnected" && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="mb-4 text-gray-600">
            Connect your Google / Fitbit account to load your health data.
          </p>
          <a
            href={loginUrl()}
            className="inline-block rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Connect Fitbit
          </a>
        </div>
      )}

      {phase === "loading" && (
        <p className="text-gray-500">Loading all data types from the Google Health API…</p>
      )}

      {phase === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">Failed to load data.</p>
          <p className="mt-1 text-sm break-words">{error}</p>
          <button
            onClick={load}
            className="mt-3 rounded border border-red-300 px-3 py-1 text-sm hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {phase === "ready" && (
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <Section key={section.id} section={section} metrics={metrics} />
          ))}
        </div>
      )}
    </main>
  );
}
