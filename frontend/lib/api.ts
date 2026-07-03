// Client-side fetchers. These hit the Next.js server-side proxy routes (under /api/*),
// which forward to the FastAPI backend. The one exception is the login link, which must
// navigate the browser straight to the backend so Google's redirect chain works.

import type { AllMetrics, AuthStatus } from "./types";

const PUBLIC_BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export function loginUrl(): string {
  return `${PUBLIC_BACKEND}/auth/login`;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const res = await fetch("/api/auth/status", { cache: "no-store" });
  if (!res.ok) return { authenticated: false };
  return res.json();
}

export async function getAllMetrics(): Promise<AllMetrics> {
  const res = await fetch("/api/health/all", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load metrics: HTTP ${res.status}`);
  return res.json();
}
