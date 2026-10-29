import type { Period, Range } from "./contracts";
import { RANGE_DAYS } from "./contracts";

const DAY_MS = 86_400_000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function resolvePeriod(input: {
  range: Range;
  from?: string;
  to?: string;
}): Period {
  const to = input.to ? fromIsoDate(input.to) : startOfUtcDay(new Date());

  if (Number.isNaN(to.getTime())) {
    throw new Error("La fecha final no es válida.");
  }

  const from = input.from
    ? fromIsoDate(input.from)
    : new Date(to.getTime() - (RANGE_DAYS[input.range] - 1) * DAY_MS);

  if (Number.isNaN(from.getTime()) || from > to) {
    throw new Error("El rango de fechas no es válido.");
  }

  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;

  if (days > 366) {
    throw new Error("El rango no puede superar los 366 días.");
  }

  return { from: toIsoDate(from), to: toIsoDate(to), days };
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function eachDay(from: string, days: number): Date[] {
  const start = fromIsoDate(from);
  return Array.from({ length: days }, (_, index) => addDays(start, index));
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(fromIsoDate(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fromIsoDate(iso));
}
