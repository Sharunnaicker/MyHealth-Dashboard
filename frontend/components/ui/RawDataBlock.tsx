"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// Collapsible raw-JSON viewer. This is the key Phase-1 tool: it shows exactly what the
// Google Health API returned for a data type, so you can decide how to model it in Phase 2.
export default function RawDataBlock({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-border pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Raw JSON
      </button>
      {open && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
