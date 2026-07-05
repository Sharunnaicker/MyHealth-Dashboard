"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, PanelLeft, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/DateRangePicker";
import { PAGE_META } from "./nav";
import { useDashboard } from "./DashboardProvider";
import { longDate, shortDate } from "@/lib/derive/format";

export default function TopBar() {
  const pathname = usePathname();
  const { range, setRange, reload, phase, setChatOpen, sidebarOpen, setSidebarOpen } =
    useDashboard();

  const meta = PAGE_META[pathname] ?? { title: "OpenFit" };
  const now = new Date();
  const description = pathname === "/today" ? longDate(now) : meta.description;
  const controls = phase === "ready" || phase === "loading";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <PanelLeft size={16} />
      </Button>

      <div className="min-w-0">
        <h1 className="truncate font-heading text-lg font-semibold leading-tight tracking-tight">
          {meta.title}
        </h1>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {controls && (
          <>
            <span className="hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-sm text-muted-foreground sm:inline-flex">
              <CalendarDays size={14} />
              {shortDate(now)}
            </span>
            <DateRangePicker value={range} onChange={setRange} />
            <Button size="sm" className="gap-1.5" onClick={() => setChatOpen(true)}>
              <Sparkles size={14} /> Assistant
            </Button>
            <Button variant="outline" size="icon-sm" onClick={reload} aria-label="Refresh">
              <RefreshCw size={14} />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
