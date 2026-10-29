"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/actions/account";
import { initialActionState } from "@/lib/actions/types";

const FIELDS = [
  {
    name: "currentPassword",
    label: "Contraseña actual",
    autoComplete: "current-password",
  },
  {
    name: "newPassword",
    label: "Nueva contraseña",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirmar nueva contraseña",
    autoComplete: "new-password",
  },
] as const;

export function PasswordForm() {
  const [state, action, isPending] = useActionState(
    changePassword,
    initialActionState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      {FIELDS.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={`password-${field.name}`}>{field.label}</Label>
          <Input
            id={`password-${field.name}`}
            name={field.name}
            type="password"
            autoComplete={field.autoComplete}
            aria-invalid={Boolean(state.fieldErrors?.[field.name])}
          />
          {state.fieldErrors?.[field.name] ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors[field.name]?.[0]}
            </p>
          ) : null}
        </div>
      ))}

      <p className="text-xs text-muted-foreground">
        Mínimo 8 caracteres. Al cambiarla se cerrarán las demás sesiones.
      </p>

      <FormMessage state={state} />

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {isPending ? "Actualizando…" : "Actualizar contraseña"}
      </Button>
    </form>
  );
}
