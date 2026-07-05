"""AI health assistant chat.

The backend owns the Anthropic call so the API key never reaches the browser (same
principle as the OAuth secret). Each request builds a compact digest of the user's
health data and passes it as system context, then streams Claude's answer back as
plain-text chunks the frontend reads incrementally.
"""

from __future__ import annotations

import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.health_digest import build_digest

load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])

MODEL = "claude-opus-4-8"

SYSTEM_TEMPLATE = """You are a friendly personal health-data assistant embedded in a \
Fitbit dashboard. You help the user understand their own health and activity data.

{digest}

Guidelines:
- Answer using the data above whenever the question is about the user's metrics. Cite \
the concrete numbers.
- If the data needed to answer isn't present, say so plainly.
- Be concise and conversational. Use short paragraphs or tight bullet lists.
- You are NOT a doctor. Do not diagnose or prescribe. For anything concerning, suggest \
they consult a healthcare professional.
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    start_date: Optional[str] = None


@router.post("")
async def chat(req: ChatRequest) -> StreamingResponse:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or api_key.startswith("sk-ant-...") or api_key == "sk-ant-...":
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY is not set. Add it to backend/.env to enable the assistant.",
        )

    # Import lazily so the app still boots if the package isn't installed yet.
    from anthropic import AsyncAnthropic

    digest = await build_digest(req.start_date)
    system = SYSTEM_TEMPLATE.format(digest=digest)

    # Only user/assistant turns go to the API; drop anything empty.
    api_messages = [
        {"role": m.role, "content": m.content}
        for m in req.messages
        if m.role in ("user", "assistant") and m.content.strip()
    ]
    if not api_messages:
        raise HTTPException(status_code=400, detail="No message to respond to.")

    client = AsyncAnthropic(api_key=api_key)

    async def token_stream():
        try:
            async with client.messages.stream(
                model=MODEL,
                max_tokens=2048,
                thinking={"type": "adaptive"},
                system=system,
                messages=api_messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as exc:  # surface a readable error into the stream
            yield f"\n\n[assistant error: {exc}]"

    return StreamingResponse(token_stream(), media_type="text/plain; charset=utf-8")
