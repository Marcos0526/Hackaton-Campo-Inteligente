"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";
import { useState } from "react";
import { BreakdownCard } from "@/components/dashboard/breakdown-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MetricChart } from "@/components/dashboard/metric-chart";
import { RangeFilter } from "@/components/dashboard/range-filter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMetrics } from "@/lib/api/client";
import {
  metricsQueryKey,
  type ChartType,
  type Range,
} from "@/lib/api/contracts";
import { formatLongDate } from "@/lib/api/period";
import { formatSeriesValue, formatUpdatedAt } from "@/lib/format";
import { seriesTotal } from "@/lib/series";
import { cn } from "@/lib/utils";

export function DashboardView({
  userName,
  initialRange,
  chartType,
}: {
  userName: string;
  initialRange: Range;
  chartType: ChartType;
}) {
  const [range, setRange] = useState<Range>(initialRange);

  const query = useQuery({
    queryKey: metricsQueryKey(range),
    queryFn: ({ signal }) => fetchMetrics(range, signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const firstName = userName.trim().split(/\s+/)[0] || "productor";

  if (query.isPending) {
    return <DashboardSkeleton />;
  }

  if (query.isError && !data) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold">
            No se pudieron cargar las métricas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "Ocurrió un error inesperado."}
          </p>
        </div>
        <Button variant="outline" onClick={() => void query.refetch()}>
          <RefreshCw aria-hidden />
          Reintentar
        </Button>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const campo = data.series.find((serie) => serie.id === "campo");
  const transporte = data.series.find((serie) => serie.id === "transporte");
  const financiamiento = data.series.find(
    (serie) => serie.id === "financiamiento",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Hola, {firstName}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                data.source === "live"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground",
              )}
              title={
                data.source === "live"
                  ? "Datos servidos por la API configurada."
                  : "Datos generados localmente para demostración."
              }
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  data.source === "live" ? "bg-primary" : "bg-muted-foreground",
                )}
                aria-hidden
              />
              {data.source === "live" ? "API en vivo" : "Datos demo"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatLongDate(data.period.from)} –{" "}
            {formatLongDate(data.period.to)} · Actualizado{" "}
            {formatUpdatedAt(data.generatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RangeFilter value={range} onChange={setRange} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            aria-label="Actualizar datos"
            title="Actualizar datos"
          >
            <RefreshCw
              className={query.isFetching ? "animate-spin" : undefined}
              aria-hidden
            />
          </Button>
        </div>
      </div>

      {data.source === "mock" ? (
        <div className="flex gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm">
          <Info
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              Datos de demostración.
            </span>{" "}
            El panel consume <code className="font-mono text-xs">/api/metrics</code>
            . Define{" "}
            <code className="font-mono text-xs">METRICS_API_URL</code> y, si hace
            falta,{" "}
            <code className="font-mono text-xs">METRICS_API_KEY</code> para
            conectar tu API real sin cambiar el frontend.
          </p>
        </div>
      ) : null}

      {query.isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          No se pudo actualizar la información. Se muestran los últimos datos
          disponibles.
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
          query.isPlaceholderData && "opacity-60 transition-opacity",
        )}
      >
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div
        className={cn(
          "grid gap-4 xl:grid-cols-2",
          query.isPlaceholderData && "opacity-60 transition-opacity",
        )}
      >
        {campo ? (
          <ChartCard
            className="xl:col-span-2"
            title="Producción y rendimiento"
            description="Volumen de cosecha estimado por día."
            total={formatSeriesValue(seriesTotal(campo.points), campo.unit)}
          >
            <MetricChart series={campo} chartType={chartType} />
          </ChartCard>
        ) : null}

        {transporte ? (
          <ChartCard
            title="Costo de transporte"
            description="Costo logístico diario según la ruta de venta."
            total={formatSeriesValue(
              seriesTotal(transporte.points),
              transporte.unit,
            )}
          >
            <MetricChart series={transporte} chartType={chartType} />
          </ChartCard>
        ) : null}

        {financiamiento ? (
          <ChartCard
            title="Capacidad de ingreso"
            description="Ingreso proyectado para respaldar financiamiento."
            total={formatSeriesValue(
              seriesTotal(financiamiento.points),
              financiamiento.unit,
            )}
          >
            <MetricChart series={financiamiento} chartType={chartType} />
          </ChartCard>
        ) : null}
      </div>

      <BreakdownCard breakdown={data.breakdown} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[124px] rounded-xl" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[380px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>

      <Skeleton className="h-[260px] rounded-xl" />
    </div>
  );
}
