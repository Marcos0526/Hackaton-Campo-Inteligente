"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartType, MetricSeries } from "@/lib/api/contracts";
import { formatLongDate, formatShortDate } from "@/lib/api/period";
import { formatSeriesValue } from "@/lib/format";
import { bucketPoints, moduleColor } from "@/lib/series";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
  fontSize: 12,
  boxShadow: "var(--shadow-card)",
} as const;

function ChartTooltip({ series }: { series: MetricSeries }) {
  return (
    <Tooltip
      cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
      contentStyle={tooltipStyle}
      labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
      formatter={(value) => [
        formatSeriesValue(Number(value), series.unit),
        series.label,
      ]}
      labelFormatter={(label) => formatLongDate(String(label))}
    />
  );
}

export function MetricChart({
  series,
  chartType,
}: {
  series: MetricSeries;
  chartType: ChartType;
}) {
  const { points, bucketSize } = bucketPoints(series.points);
  const color = moduleColor[series.id];
  const gradientId = `metric-gradient-${series.id}`;
  const showDots = points.length <= 14;

  return (
    <div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(value) =>
                  formatSeriesValue(Number(value), series.unit, true)
                }
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={64}
              />
              <ChartTooltip series={series} />
              <Bar
                dataKey="value"
                fill={color}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(value) =>
                  formatSeriesValue(Number(value), series.unit, true)
                }
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={64}
              />
              <ChartTooltip series={series} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                animationDuration={700}
                animationEasing="ease-out"
                dot={
                  showDots
                    ? { r: 3, strokeWidth: 0, fill: color }
                    : false
                }
                activeDot={{ r: 4 }}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              accessibilityLayer
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(value) =>
                  formatSeriesValue(Number(value), series.unit, true)
                }
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={64}
              />
              <ChartTooltip series={series} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                animationDuration={700}
                animationEasing="ease-out"
                fill={`url(#${gradientId})`}
                dot={
                  showDots
                    ? { r: 3, strokeWidth: 0, fill: color }
                    : false
                }
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {bucketSize > 1 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Valores agregados en bloques de {bucketSize} días para mantener la
          lectura.
        </p>
      ) : null}
    </div>
  );
}
