import type { MetricPoint, ModuleId } from "@/lib/api/contracts";

export const moduleColor: Record<ModuleId, string> = {
  campo: "var(--chart-1)",
  transporte: "var(--chart-2)",
  financiamiento: "var(--chart-3)",
};

export function seriesTotal(points: MetricPoint[]): number {
  return points.reduce((total, point) => total + point.value, 0);
}

/**
 * Keeps long ranges readable by summing consecutive days into buckets.
 * Values are totals per bucket, which is appropriate for production, cost and
 * income series.
 */
export function bucketPoints(
  points: MetricPoint[],
  maxPoints = 46,
): { points: MetricPoint[]; bucketSize: number } {
  if (points.length <= maxPoints) {
    return { points, bucketSize: 1 };
  }

  const bucketSize = Math.ceil(points.length / maxPoints);
  const buckets: MetricPoint[] = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const chunk = points.slice(index, index + bucketSize);

    buckets.push({
      date: chunk[0].date,
      value: Math.round(seriesTotal(chunk)),
    });
  }

  return { points: buckets, bucketSize };
}
