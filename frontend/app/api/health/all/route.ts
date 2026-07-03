// Proxy: GET /api/health/all -> backend /health/all (every data type, fetched concurrently).
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  const qs = new URL(request.url).search; // forward optional start_date/end_date
  try {
    const res = await fetch(`${BACKEND}/health/all${qs}`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: `backend unreachable: ${String(err)}` },
      { status: 502 },
    );
  }
}
