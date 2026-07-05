"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ChartPoint {
  label: string;
  value: number;
}

export default function TrendBars({
  data,
  color = "var(--chart-1)",
  height = 180,
  mini = false,
}: {
  data: ChartPoint[];
  color?: string;
  height?: number;
  mini?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={mini ? { top: 4, right: 2, bottom: 0, left: 2 } : { top: 8, right: 8, bottom: 0, left: -16 }}>
        {!mini && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
        <XAxis
          dataKey="label"
          hide={mini}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          interval="preserveStartEnd"
        />
        {!mini && (
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
        )}
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
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
