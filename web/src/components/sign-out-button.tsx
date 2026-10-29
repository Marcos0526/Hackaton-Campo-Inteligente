"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant={compact ? "ghost" : "outline"}
      size={compact ? "icon" : "md"}
      onClick={handleSignOut}
      disabled={isPending}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className={compact ? "shrink-0" : "w-full"}
    >
      <LogOut aria-hidden />
      {compact ? null : isPending ? "Saliendo…" : "Cerrar sesión"}
    </Button>
  );
}
