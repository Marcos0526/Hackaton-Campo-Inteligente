import {
  Landmark,
  Minus,
  Scale,
  TrendingDown,
  TrendingUp,
  Truck,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MetricKpi } from "@/lib/api/contracts";
import { formatDelta, formatKpiParts, isFavorable } from "@/lib/format";
import { cn } from "@/lib/utils";

const KPI_ICONS: Record<string, LucideIcon> = {
  produccion: Wheat,
  logistica: Truck,
  ingreso: Landmark,
  "costo-kg": Scale,
};

export function KpiCard({ kpi }: { kpi: MetricKpi }) {
  const Icon = KPI_ICONS[kpi.id] ?? Scale;
  const favorable = isFavorable(kpi);
  const parts = formatKpiParts(kpi);

  return (
    <Card className="p-5" title={kpi.hint}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{kpi.label}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 text-2xl font-semibold tracking-tight tabular-nums">
            <span className="whitespace-nowrap">{parts.value}</span>
            {parts.suffix ? (
              <span className="text-sm font-medium text-muted-foreground">
                {parts.suffix}
              </span>
            ) : null}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
            favorable === null
              ? "bg-muted text-muted-foreground"
              : favorable
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive",
          )}
        >
          {favorable === null ? (
            <Minus className="size-3" aria-hidden />
          ) : kpi.delta > 0 ? (
            <TrendingUp className="size-3" aria-hidden />
          ) : (
            <TrendingDown className="size-3" aria-hidden />
          )}
          {formatDelta(kpi.delta)}
        </span>
        <span className="text-muted-foreground">vs. periodo anterior</span>
      </div>
    </Card>
  );
}
