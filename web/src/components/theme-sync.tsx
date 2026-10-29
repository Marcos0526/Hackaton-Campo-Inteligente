"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import type { ThemeValue } from "@/lib/actions/types";

/**
 * Applies the account-level theme once per browser tab session. After that the
 * user's local choice (header toggle) wins until they sign in again.
 */
export function ThemeSync({
  theme,
  userId,
}: {
  theme: ThemeValue;
  userId: string;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const key = `campo-theme-synced:${userId}`;

    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    setTheme(theme);
  }, [setTheme, theme, userId]);

  return null;
}
