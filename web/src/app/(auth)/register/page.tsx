import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/session";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      description="Configura tu acceso y empieza a monitorear producción, logística y financiamiento."
    >
      <RegisterForm />

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
