import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const { next } = await searchParams;

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      description="Ingresa con tu cuenta para consultar el panel de tu operación."
    >
      <LoginForm next={next} />

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Crear una cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
