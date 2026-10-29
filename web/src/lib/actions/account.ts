"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { getSession, requireSession } from "@/lib/session";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe al menos 2 caracteres.")
    .max(60, "El nombre no puede superar los 60 caracteres."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual."),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .max(128, "La contraseña es demasiado larga."),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "La nueva contraseña debe ser diferente a la actual.",
    path: ["newPassword"],
  });

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  dashboardRange: z.enum(["7d", "30d", "90d", "365d"]),
  chartType: z.enum(["area", "line", "bar"]),
});

const themeSchema = z.enum(["light", "dark", "system"]);

function messageFromError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      body?: { message?: string };
      message?: string;
    };

    if (candidate.body?.message) return candidate.body.message;
    if (candidate.message) return candidate.message;
  }

  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function updateProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa el nombre ingresado.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await auth.api.updateUser({
      body: { name: parsed.data.name },
      headers: await headers(),
    });
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { status: "success", message: "Perfil actualizado correctamente." };
}

export async function changePassword(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos de la contraseña.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }

  return {
    status: "success",
    message: "Contraseña actualizada. Cerramos las demás sesiones.",
  };
}

export async function updatePreferences(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = preferencesSchema.safeParse({
    theme: formData.get("theme"),
    dashboardRange: formData.get("dashboardRange"),
    chartType: formData.get("chartType"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Selecciona preferencias válidas.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await db
    .insert(userPreferences)
    .values({ userId: session.user.id, ...parsed.data })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    });

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return {
    status: "success",
    message: "Preferencias guardadas.",
    theme: parsed.data.theme,
  };
}

/** Persists a theme switch made from the header toggle. */
export async function updateTheme(theme: string): Promise<void> {
  const parsed = themeSchema.safeParse(theme);

  if (!parsed.success) return;

  const session = await getSession();

  if (!session) return;

  await db
    .update(userPreferences)
    .set({ theme: parsed.data, updatedAt: new Date() })
    .where(eq(userPreferences.userId, session.user.id));
}
