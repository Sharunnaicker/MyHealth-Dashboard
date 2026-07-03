// Proxy: GET /api/auth/status -> backend /auth/status. Keeps the backend URL server-side.
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/auth/status`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
