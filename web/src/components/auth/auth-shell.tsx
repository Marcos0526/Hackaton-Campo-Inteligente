import { Landmark, Sprout, Tractor, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { ThemeToggle } from "@/components/theme-toggle";

const PILLARS = [
  {
    icon: Tractor,
    title: "El campo",
    description: "Producción, rendimiento y capacidad operativa.",
  },
  {
    icon: Truck,
    title: "Transporte",
    description: "Rutas y costos según origen y punto de venta.",
  },
  {
    icon: Landmark,
    title: "Financiamiento",
    description: "Información de ingresos que respalda tu crédito.",
  },
];

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_15%,white,transparent_45%),radial-gradient(circle_at_85%_75%,white,transparent_40%)]"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25">
            <Sprout className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">
              Campo Inteligente
            </p>
            <p className="text-xs text-primary-foreground/70">
              Panel de decisiones
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
            Decisiones del campo, respaldadas por datos.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            Conecta producción, logística y capacidad financiera en un solo
            panel para planear con números, no con suposiciones.
          </p>

          <ul className="mt-10 space-y-5">
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                  <pillar.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{pillar.title}</p>
                  <p className="text-xs text-primary-foreground/70">
                    {pillar.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Hackatón Campo Inteligente · Datos de demostración
        </p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold">Campo Inteligente</span>
          </div>
          <div className="flex items-center gap-1">
            <InstallAppButton />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
