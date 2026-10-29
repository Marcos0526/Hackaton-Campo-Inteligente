import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ThemeSync } from "@/components/theme-sync";
import { getPreferences } from "@/lib/preferences";
import { requireSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  const preferences = await getPreferences(session.user.id);

  return (
    <>
      <ThemeSync theme={preferences.theme} userId={session.user.id} />
      <AppShell
        user={{ name: session.user.name, email: session.user.email }}
      >
        {children}
      </AppShell>
    </>
  );
}
