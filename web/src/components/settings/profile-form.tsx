"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/account";
import { initialActionState } from "@/lib/actions/types";

export function ProfileForm({
  name,
  email,
  memberSince,
}: {
  name: string;
  email: string;
  memberSince: string;
}) {
  const [state, action, isPending] = useActionState(
    updateProfile,
    initialActionState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="profile-name">Nombre</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">Correo electrónico</Label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          readOnly
          disabled
          aria-describedby="profile-email-help"
        />
        <p id="profile-email-help" className="text-xs text-muted-foreground">
          El correo identifica tu cuenta y no se puede cambiar aquí.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Miembro desde {memberSince}.
      </p>

      <FormMessage state={state} />

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
