"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How did I sleep this week?",
  "What's my resting heart rate trend?",
  "Summarize my activity.",
];

export default function ChatPanel({
  open,
  onOpenChange,
  startDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  startDate?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, start_date: startDate }),
      });

      if (!res.ok || !res.body) {
        let detail = `Error ${res.status}`;
        try {
          detail = (await res.json()).detail ?? detail;
        } catch {}
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${detail}` };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${String(err)}` };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Health Assistant
          </SheetTitle>
          <SheetDescription>
            Asks about your own data. Not medical advice.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="flex flex-col gap-3 p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                {m.content || (busy && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
          </div>
        </ScrollArea>

        <form
          className="flex items-center gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health data…"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
