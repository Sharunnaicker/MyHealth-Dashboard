"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// Collapsible raw-JSON viewer. This is the key Phase-1 tool: it shows exactly what the
// Google Health API returned for a data type, so you can decide how to model it in Phase 2.
export default function RawDataBlock({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-gray-100 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Raw JSON
      </button>
      {open && (
        <pre className="mt-2 max-h-72 overflow-auto rounded bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
