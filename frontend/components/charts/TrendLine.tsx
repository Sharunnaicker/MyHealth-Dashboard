"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "./TrendBars";

let uid = 0;

export default function TrendLine({
  data,
  color = "var(--chart-1)",
  height = 180,
  mini = false,
  area = true,
  referenceY,
  referenceLabel,
  domain = ["auto", "auto"],
}: {
  data: ChartPoint[];
  color?: string;
  height?: number;
  mini?: boolean;
  area?: boolean;
  referenceY?: number;
  referenceLabel?: string;
  domain?: [number | "auto", number | "auto"];
}) {
  const gradId = `grad-${uid++}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={mini ? { top: 4, right: 2, bottom: 0, left: 2 } : { top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={area ? 0.28 : 0} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
            domain={domain}
          />
        )}
        <Tooltip
          contentStyle={{
            fontSize: 12,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--popover-foreground)",
          }}
        />
        {referenceY !== undefined && (
          <ReferenceLine
            y={referenceY}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={
              referenceLabel && !mini
                ? { value: referenceLabel, position: "insideBottomRight", fontSize: 10, fill: "var(--muted-foreground)" }
                : undefined
            }
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
