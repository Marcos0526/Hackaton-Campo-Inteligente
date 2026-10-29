import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MODULE_IDS,
  moduleMeta,
  type MetricsResponse,
} from "@/lib/api/contracts";
import { formatSeriesValue } from "@/lib/format";
import { moduleColor } from "@/lib/series";

export function BreakdownCard({
  breakdown,
}: {
  breakdown: MetricsResponse["breakdown"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Composición por módulo</CardTitle>
        <CardDescription>
          Cómo se reparte cada flujo durante el periodo seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        {MODULE_IDS.map((module) => {
          const items = breakdown.filter((item) => item.module === module);
          const color = moduleColor[module];
          const unit = module === "campo" ? "kg" : "mxn";

          return (
            <div key={module}>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <p className="text-sm font-medium">{moduleMeta[module].label}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {moduleMeta[module].description}
              </p>

              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span>{item.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatSeriesValue(item.value, unit)} ·{" "}
                        {item.share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.share}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
