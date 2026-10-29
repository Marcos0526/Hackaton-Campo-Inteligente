"use client";

import {
  RANGE_IDS,
  RANGE_LABELS,
  type Range,
} from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

export function RangeFilter({
  value,
  onChange,
}: {
  value: Range;
  onChange: (range: Range) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-card p-1"
      role="group"
      aria-label="Rango de fechas"
    >
      {RANGE_IDS.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          aria-pressed={value === range}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === range
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}
