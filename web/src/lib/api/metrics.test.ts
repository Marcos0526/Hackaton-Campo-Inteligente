import { describe, expect, it } from "vitest";
import {
  metricsResponseSchema,
  type Period,
} from "@/lib/api/contracts";
import { generateMockMetrics } from "@/lib/api/mock";
import { resolvePeriod } from "@/lib/api/period";
import { bucketPoints } from "@/lib/series";

const period: Period = {
  from: "2026-09-01",
  to: "2026-09-30",
  days: 30,
};

describe("resolvePeriod", () => {
  it("builds a 30 day window ending on the given date", () => {
    const result = resolvePeriod({ range: "30d", to: "2026-09-30" });

    expect(result).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
      days: 30,
    });
  });

  it("honours explicit from/to dates", () => {
    const result = resolvePeriod({
      range: "7d",
      from: "2026-01-01",
      to: "2026-01-10",
    });

    expect(result.days).toBe(10);
  });

  it("rejects inverted and oversized ranges", () => {
    expect(() =>
      resolvePeriod({ range: "7d", from: "2026-02-10", to: "2026-02-01" }),
    ).toThrow();

    expect(() =>
      resolvePeriod({ range: "365d", from: "2024-01-01", to: "2026-01-01" }),
    ).toThrow();
  });
});

describe("generateMockMetrics", () => {
  it("returns a payload that matches the API contract", () => {
    const result = generateMockMetrics(period);
    const parsed = metricsResponseSchema.safeParse(result);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe("mock");
    expect(result.series).toHaveLength(3);
    expect(result.kpis).toHaveLength(4);
    expect(result.series.every((serie) => serie.points.length === 30)).toBe(
      true,
    );
  });

  it("is deterministic for the same period", () => {
    const first = generateMockMetrics(period);
    const second = generateMockMetrics(period);

    expect(first.series).toEqual(second.series);
    expect(first.kpis).toEqual(second.kpis);
  });

  it("keeps breakdown shares at 100% per module", () => {
    const result = generateMockMetrics(period);

    for (const moduleId of [
      "campo",
      "transporte",
      "financiamiento",
    ] as const) {
      const total = result.breakdown
        .filter((item) => item.module === moduleId)
        .reduce((sum, item) => sum + item.share, 0);

      expect(total).toBe(100);
    }
  });
});

describe("bucketPoints", () => {
  it("leaves short series untouched", () => {
    const points = generateMockMetrics(period).series[0].points;
    const result = bucketPoints(points);

    expect(result.bucketSize).toBe(1);
    expect(result.points).toHaveLength(points.length);
  });

  it("reduces long series without losing totals", () => {
    const long = generateMockMetrics({
      from: "2025-10-01",
      to: "2026-09-30",
      days: 365,
    }).series[0].points;
    const result = bucketPoints(long, 46);

    expect(result.points.length).toBeLessThanOrEqual(46);
    expect(result.bucketSize).toBeGreaterThan(1);

    const originalTotal = long.reduce((sum, point) => sum + point.value, 0);
    const bucketedTotal = result.points.reduce(
      (sum, point) => sum + point.value,
      0,
    );

    expect(Math.abs(originalTotal - bucketedTotal)).toBeLessThanOrEqual(
      result.points.length,
    );
  });
});
