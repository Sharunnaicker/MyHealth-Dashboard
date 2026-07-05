// Proxy: POST /api/chat -> backend /chat, streaming the plain-text response through
// unchanged so the ChatPanel can render tokens as they arrive.
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.text();
  try {
    const res = await fetch(`${BACKEND}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    // Non-streaming errors (e.g. missing API key) come back as JSON — pass through.
    if (!res.ok) {
      const text = await res.text();
      return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
    return new Response(res.body, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ detail: `backend unreachable: ${String(err)}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
