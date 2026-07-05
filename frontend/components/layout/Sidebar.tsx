"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { NAV_GROUPS } from "./nav";
import { useDashboard } from "./DashboardProvider";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { setSidebarOpen } = useDashboard();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span
          className="flex size-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <HeartPulse size={18} />
        </span>
        <div className="leading-tight">
          <div className="font-heading text-sm font-semibold">OpenFit</div>
          <div className="text-xs text-muted-foreground">Health dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon
                        size={16}
                        style={active && item.accent ? { color: item.accent } : undefined}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account footer */}
      <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          ●
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium">Signed in</div>
          <div className="truncate text-xs text-muted-foreground">Google Health</div>
        </div>
      </div>
    </aside>
  );
}
