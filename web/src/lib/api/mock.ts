import type {
  MetricsResponse,
  MetricSeries,
  ModuleId,
  Period,
} from "./contracts";
import { addDays, eachDay, fromIsoDate, toIsoDate } from "./period";

const DAY_MS = 86_400_000;

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result = (result ^ (result + Math.imul(result ^ (result >>> 7), 61 | result))) | 0;
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function noise(key: string, span: number): number {
  return (mulberry32(hashString(key))() * 2 - 1) * span;
}

/**
 * Deterministic demo data. The same date always produces the same value, so
 * refetches, range changes and SSR hydration stay consistent.
 */
function valueFor(module: ModuleId, isoDate: string): number {
  const date = fromIsoDate(isoDate);
  const epochDay = Math.floor(date.getTime() / DAY_MS);
  const dayOfYear = Math.floor(
    (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / DAY_MS,
  );

  switch (module) {
    case "campo": {
      // Seasonal harvest curve with a daily noise band.
      const season = Math.sin((dayOfYear / 365) * Math.PI * 2 - 1.1) * 170;
      return round(880 + season + noise(`campo:${isoDate}`, 110));
    }
    case "transporte": {
      // Weekly logistics cycle (fuel, carrier availability) plus noise.
      const week = Math.sin((epochDay / 7) * Math.PI * 2) * 420;
      const distance = 900 + Math.sin(epochDay / 23) * 260;
      return round(3_450 + week + distance + noise(`transporte:${isoDate}`, 380));
    }
    case "financiamiento": {
      // Slow financial cycle + steady growth in lending capacity.
      const cycle = Math.sin(epochDay / 58) * 1_150;
      const growth = ((epochDay % 365) / 365) * 2_200;
      return round(8_400 + cycle + growth + noise(`fin:${isoDate}`, 720));
    }
  }
}

function buildSeries(
  module: ModuleId,
  period: Period,
): MetricSeries {
  const points = eachDay(period.from, period.days).map((date) => ({
    date: toIsoDate(date),
    value: valueFor(module, toIsoDate(date)),
  }));

  return {
    id: module,
    label:
      module === "campo"
        ? "Producción diaria"
        : module === "transporte"
          ? "Costo logístico diario"
          : "Capacidad de ingreso diaria",
    unit: module === "campo" ? "kg" : "mxn",
    points,
  };
}

function sum(series: MetricSeries): number {
  return series.points.reduce((total, point) => total + point.value, 0);
}

function delta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return round(((current - previous) / previous) * 100, 1);
}

const BREAKDOWN: Record<
  ModuleId,
  Array<{ label: string; share: number }>
> = {
  campo: [
    { label: "Maíz", share: 42 },
    { label: "Frijol", share: 27 },
    { label: "Café", share: 19 },
    { label: "Agave", share: 12 },
  ],
  transporte: [
    { label: "Ruta local", share: 38 },
    { label: "Ruta regional", share: 41 },
    { label: "Ruta nacional", share: 21 },
  ],
  financiamiento: [
    { label: "Crédito de avío", share: 55 },
    { label: "Venta a futuro", share: 30 },
    { label: "Subsidio", share: 15 },
  ],
};

export function generateMockMetrics(period: Period): MetricsResponse {
  const series = {
    campo: buildSeries("campo", period),
    transporte: buildSeries("transporte", period),
    financiamiento: buildSeries("financiamiento", period),
  };

  const previousPeriod: Period = {
    from: toIsoDate(addDays(fromIsoDate(period.from), -period.days)),
    to: toIsoDate(addDays(fromIsoDate(period.from), -1)),
    days: period.days,
  };

  const previous = {
    campo: sum(buildSeries("campo", previousPeriod)),
    transporte: sum(buildSeries("transporte", previousPeriod)),
    financiamiento: sum(buildSeries("financiamiento", previousPeriod)),
  };

  const totals = {
    campo: sum(series.campo),
    transporte: sum(series.transporte),
    financiamiento: sum(series.financiamiento),
  };

  const costPerKg = totals.transporte / Math.max(totals.campo, 1);
  const previousCostPerKg = previous.transporte / Math.max(previous.campo, 1);

  const breakdown = (Object.keys(series) as ModuleId[]).flatMap((module) =>
    BREAKDOWN[module].map((item) => ({
      module,
      label: item.label,
      value: round((totals[module] * item.share) / 100),
      share: item.share,
    })),
  );

  return {
    generatedAt: new Date().toISOString(),
    source: "mock",
    period,
    kpis: [
      {
        id: "produccion",
        label: "Producción total",
        value: round(totals.campo),
        previousValue: round(previous.campo),
        delta: delta(totals.campo, previous.campo),
        format: "number",
        unit: "kg",
        goodWhenDown: false,
        hint: "Volumen estimado de cosecha en el periodo.",
      },
      {
        id: "logistica",
        label: "Costo logístico",
        value: round(totals.transporte),
        previousValue: round(previous.transporte),
        delta: delta(totals.transporte, previous.transporte),
        format: "currency",
        unit: "MXN",
        goodWhenDown: true,
        hint: "Costo acumulado de transporte de mercancía.",
      },
      {
        id: "ingreso",
        label: "Capacidad de ingreso",
        value: round(totals.financiamiento),
        previousValue: round(previous.financiamiento),
        delta: delta(totals.financiamiento, previous.financiamiento),
        format: "currency",
        unit: "MXN",
        goodWhenDown: false,
        hint: "Ingreso proyectado que respalda el acceso a financiamiento.",
      },
      {
        id: "costo-kg",
        label: "Costo por kg",
        value: round(costPerKg, 2),
        previousValue: round(previousCostPerKg, 2),
        delta: delta(costPerKg, previousCostPerKg),
        format: "decimal",
        unit: "MXN/kg",
        goodWhenDown: true,
        hint: "Costo logístico por kilogramo producido.",
      },
    ],
    series: [series.campo, series.transporte, series.financiamiento],
    breakdown,
  };
}

