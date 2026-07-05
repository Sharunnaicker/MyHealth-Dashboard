"use client";

import ChatPanel from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loginUrl } from "@/lib/api";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useDashboard } from "./DashboardProvider";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { phase, error, reload, startDate, chatOpen, setChatOpen, sidebarOpen, setSidebarOpen } =
    useDashboard();

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-40 md:static md:z-auto">
            <Sidebar />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
            {phase === "checking" && (
              <p className="text-muted-foreground">Checking connection…</p>
            )}

            {phase === "disconnected" && (
              <div className="mx-auto mt-16 max-w-md rounded-xl border border-border bg-card p-10 text-center">
                <p className="mb-4 text-muted-foreground">
                  Connect your Google / Fitbit account to load your health data.
                </p>
                <Button size="lg" onClick={() => (window.location.href = loginUrl())}>
                  Connect Fitbit
                </Button>
              </div>
            )}

            {phase === "loading" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            )}

            {phase === "error" && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
                <p className="font-medium">Failed to load data.</p>
                <p className="mt-1 text-sm break-words">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
                  Retry
                </Button>
              </div>
            )}

            {phase === "ready" && children}
          </div>
        </main>
      </div>

      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} startDate={startDate} />
    </div>
  );
}
