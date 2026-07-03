// Proxy: GET /api/health/{slug} -> backend /health/{slug}. Per-type fetch (used for
// refresh/debug; the page itself uses /api/health/all).
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const qs = new URL(request.url).search;
  try {
    const res = await fetch(`${BACKEND}/health/${slug}${qs}`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: `backend unreachable: ${String(err)}` },
      { status: 502 },
    );
  }
}
