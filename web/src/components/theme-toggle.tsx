"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateTheme } from "@/lib/actions/account";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted
    ? "Cambiar tema"
    : isDark
      ? "Activar modo claro"
      : "Activar modo oscuro";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={!mounted || isPending}
      onClick={() => {
        const next = isDark ? "light" : "dark";
        setTheme(next);
        startTransition(() => {
          void updateTheme(next);
        });
      }}
    >
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="dark:hidden" aria-hidden />
    </Button>
  );
}
