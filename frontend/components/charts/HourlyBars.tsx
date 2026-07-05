"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Per-hour distribution (e.g. steps per hour). Expects 24 slots but tolerates fewer.
export default function HourlyBars({
  data,
  color = "var(--chart-1)",
  height = 200,
}: {
  data: { hour: number; value: number }[];
  color?: string;
  height?: number;
}) {
  const rows = data.map((d) => ({
    label: `${String(d.hour).padStart(2, "0")}:00`,
    value: d.value,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          ticks={["00:00", "04:00", "08:00", "12:00", "16:00", "23:00"]}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          contentStyle={{
            fontSize: 12,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--popover-foreground)",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
