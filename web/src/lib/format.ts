import type { MetricKpi, MetricSeries } from "@/lib/api/contracts";
import type { ThemeValue } from "@/lib/actions/types";

const numberFormat = new Intl.NumberFormat("es-MX");
const currencyFormat = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function trimDecimal(value: number): string {
  return Number(value.toFixed(1)).toString();
}

/**
 * Hand-rolled compact formatting. Intl compact notation differs between Node
 * and browsers (e.g. "$27.0 k" vs "$27 k"), which breaks hydration, so the
 * dashboard uses this deterministic version instead.
 */
function compactAmount(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1_000_000) {
    return `${sign}${trimDecimal(absolute / 1_000_000)} M`;
  }

  if (absolute >= 1_000) {
    return `${sign}${trimDecimal(absolute / 1_000)} k`;
  }

  return numberFormat.format(value);
}

export function formatSeriesValue(
  value: number,
  unit: MetricSeries["unit"],
  compact = false,
): string {
  if (compact) {
    return unit === "mxn" ? `$${compactAmount(value)}` : compactAmount(value);
  }

  return unit === "mxn"
    ? currencyFormat.format(value)
    : `${numberFormat.format(value)} kg`;
}

export function formatKpiParts(kpi: MetricKpi): {
  value: string;
  suffix?: string;
} {
  switch (kpi.format) {
    case "currency":
      return { value: currencyFormat.format(kpi.value) };
    case "decimal":
      return { value: kpi.value.toFixed(2), suffix: kpi.unit };
    default:
      return { value: numberFormat.format(kpi.value), suffix: kpi.unit };
  }
}

export function formatKpiValue(kpi: MetricKpi): string {
  const parts = formatKpiParts(kpi);
  return parts.suffix ? `${parts.value} ${parts.suffix}` : parts.value;
}

export function formatDelta(delta: number): string {
  return `${Math.abs(delta).toFixed(1)}%`;
}

export function isFavorable(kpi: MetricKpi): boolean | null {
  if (kpi.delta === 0) return null;
  return kpi.goodWhenDown ? kpi.delta < 0 : kpi.delta > 0;
}

export function formatUpdatedAt(iso: string): string {
  const time = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));

  return `${time} UTC`;
}

export const themeLabels: Record<ThemeValue, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};
