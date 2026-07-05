import {
  Activity,
  Database,
  HeartPulse,
  LayoutGrid,
  Moon,
  PersonStanding,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: string; // domain accent used for the active indicator / page chrome
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Wellbeing",
    items: [
      { href: "/today", label: "Today", icon: LayoutGrid, accent: "var(--brand)" },
      { href: "/activity", label: "Activity", icon: Activity, accent: "var(--accent-activity)" },
      { href: "/health", label: "Health", icon: HeartPulse, accent: "var(--accent-health)" },
      { href: "/sleep", label: "Sleep", icon: Moon, accent: "var(--accent-sleep)" },
      { href: "/body", label: "Body", icon: PersonStanding, accent: "var(--accent-body)" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/data", label: "Data", icon: Database },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export interface PageMeta {
  title: string;
  description?: string;
}

// Static per-route header text. The Today page's description (the date) is supplied at runtime.
export const PAGE_META: Record<string, PageMeta> = {
  "/today": { title: "Today" },
  "/activity": { title: "Activity", description: "Goals, hourly distribution, and workouts." },
  "/health": { title: "Health", description: "Cardiac and physiological signals over time." },
  "/sleep": {
    title: "Sleep",
    description: "Duration, quality, and composition of your latest night's sleep.",
  },
  "/body": { title: "Body", description: "Weight, body composition, and measurements." },
  "/data": { title: "Data", description: "Raw Google Health data explorer." },
  "/settings": { title: "Settings", description: "Connection and preferences." },
};
