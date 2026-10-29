import { z } from "zod";

export const MODULE_IDS = ["campo", "transporte", "financiamiento"] as const;
export const RANGE_IDS = ["7d", "30d", "90d", "365d"] as const;
export const CHART_TYPES = ["area", "line", "bar"] as const;

export const moduleSchema = z.enum(MODULE_IDS);
export const rangeSchema = z.enum(RANGE_IDS);
export const chartTypeSchema = z.enum(CHART_TYPES);

export type ModuleId = z.infer<typeof moduleSchema>;
export type Range = z.infer<typeof rangeSchema>;
export type ChartType = z.infer<typeof chartTypeSchema>;

export const RANGE_LABELS: Record<Range, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  "365d": "12 meses",
};

export const RANGE_DAYS: Record<Range, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

export const moduleMeta: Record<
  ModuleId,
  { label: string; shortLabel: string; description: string }
> = {
  campo: {
    label: "El campo",
    shortLabel: "Campo",
    description: "Producción, rendimiento y capacidad operativa",
  },
  transporte: {
    label: "Transporte",
    shortLabel: "Transporte",
    description: "Costo logístico según origen y destino",
  },
  financiamiento: {
    label: "Financiamiento",
    shortLabel: "Financiamiento",
    description: "Capacidad de ingreso para respaldar crédito",
  },
};

export const metricsQuerySchema = z.object({
  range: rangeSchema.default("30d"),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

const pointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

const kpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  previousValue: z.number(),
  delta: z.number(),
  format: z.enum(["currency", "number", "decimal"]),
  unit: z.string(),
  goodWhenDown: z.boolean(),
  hint: z.string(),
});

const seriesSchema = z.object({
  id: moduleSchema,
  label: z.string(),
  unit: z.enum(["kg", "mxn"]),
  points: z.array(pointSchema).min(1),
});

const breakdownSchema = z.object({
  module: moduleSchema,
  label: z.string(),
  value: z.number(),
  share: z.number(),
});

export const metricsResponseSchema = z.object({
  generatedAt: z.string(),
  // Optional so upstream APIs do not need to know about the demo flag.
  source: z.enum(["live", "mock"]).default("live"),
  period: z.object({
    from: z.string(),
    to: z.string(),
    days: z.number().int().positive(),
  }),
  kpis: z.array(kpiSchema),
  series: z.array(seriesSchema),
  breakdown: z.array(breakdownSchema),
});

export type MetricsResponse = z.infer<typeof metricsResponseSchema>;
export type MetricKpi = MetricsResponse["kpis"][number];
export type MetricSeries = MetricsResponse["series"][number];
export type MetricPoint = MetricSeries["points"][number];
export type Period = MetricsResponse["period"];

export const metricsQueryKey = (range: Range) =>
  ["metrics", range] as const;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
