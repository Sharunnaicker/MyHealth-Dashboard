"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Section from "@/components/Section";
import SummaryStrip from "@/components/SummaryStrip";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/layout/DashboardProvider";
import { SECTIONS } from "@/lib/metrics";

// The original raw-data explorer, preserved. It reads the same fetched metrics as every other
// page and is the ground-truth inspector used to confirm derived numbers.
export default function DataPage() {
  const { metrics } = useDashboard();
  const [onlyWithData, setOnlyWithData] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setOnlyWithData((v) => !v)}
        >
          {onlyWithData ? <Eye size={14} /> : <EyeOff size={14} />}
          {onlyWithData ? "With data" : "Show all"}
        </Button>
      </div>
      <SummaryStrip metrics={metrics} />
      {SECTIONS.map((section) => (
        <Section key={section.id} section={section} metrics={metrics} onlyWithData={onlyWithData} />
      ))}
    </div>
  );
}
