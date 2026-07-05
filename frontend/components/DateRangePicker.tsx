"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANGES, type RangeKey } from "@/lib/api";

export default function DateRangePicker({
  value,
  onChange,
  disabled,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RangeKey)} disabled={disabled}>
      <SelectTrigger size="sm" className="w-[130px]">
        <SelectValue placeholder="Range" />
      </SelectTrigger>
      <SelectContent>
        {RANGES.map((r) => (
          <SelectItem key={r.key} value={r.key}>
            Last {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
