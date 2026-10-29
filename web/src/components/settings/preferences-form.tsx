"use client";

import { Loader2, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updatePreferences } from "@/lib/actions/account";
import {
  initialActionState,
  type ThemeValue,
} from "@/lib/actions/types";
import { RANGE_LABELS, type ChartType, type Range } from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

const THEMES: Array<{ value: ThemeValue; label: string; icon: LucideIcon }> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const CHART_LABELS: Record<ChartType, string> = {
  area: "Área",
  line: "Línea",
  bar: "Barras",
};

export function PreferencesForm({
  defaults,
}: {
  defaults: {
    theme: ThemeValue;
    dashboardRange: Range;
    chartType: ChartType;
  };
}) {
  const [state, action, isPending] = useActionState(
    updatePreferences,
    initialActionState,
  );
  const { setTheme } = useTheme();
  const [theme, setThemeValue] = useState<ThemeValue>(defaults.theme);

  useEffect(() => {
    if (state.status === "success" && state.theme) {
      setTheme(state.theme);
    }
  }, [setTheme, state]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Tema de la interfaz</legend>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-2 py-3 text-xs font-medium transition-colors",
                theme === option.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={theme === option.value}
                onChange={() => {
                  setThemeValue(option.value);
                  setTheme(option.value);
                }}
                className="sr-only"
              />
              <option.icon className="size-4" aria-hidden />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="dashboardRange">Rango inicial del panel</Label>
        <Select
          id="dashboardRange"
          name="dashboardRange"
          defaultValue={defaults.dashboardRange}
        >
          {(Object.keys(RANGE_LABELS) as Range[]).map((range) => (
            <option key={range} value={range}>
              {RANGE_LABELS[range]}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Periodo que se carga por defecto al abrir el panel.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chartType">Tipo de gráfica</Label>
        <Select
          id="chartType"
          name="chartType"
          defaultValue={defaults.chartType}
        >
          {(Object.keys(CHART_LABELS) as ChartType[]).map((chart) => (
            <option key={chart} value={chart}>
              {CHART_LABELS[chart]}
            </option>
          ))}
        </Select>
      </div>

      <FormMessage state={state} />

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {isPending ? "Guardando…" : "Guardar preferencias"}
      </Button>
    </form>
  );
}
