"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/extract";

export default function SimpleBarChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={16} />
        <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={40} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--popover-foreground)",
          }}
          cursor={{ fill: "var(--muted)" }}
        />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
