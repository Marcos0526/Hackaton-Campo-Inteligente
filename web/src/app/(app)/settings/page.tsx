import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordForm } from "@/components/settings/password-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { getPreferences } from "@/lib/preferences";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const session = await requireSession();
  const preferences = await getPreferences(session.user.id);

  const memberSince = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(session.user.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ajustes de cuenta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra tu perfil, tu contraseña y cómo se muestra el panel.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Datos básicos asociados a tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                name={session.user.name}
                email={session.user.email}
                memberSince={memberSince}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Cambia tu contraseña periódicamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
            <CardDescription>
              Tema, periodo inicial y tipo de gráfica del panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PreferencesForm
              defaults={{
                theme: preferences.theme,
                dashboardRange: preferences.dashboardRange,
                chartType: preferences.chartType,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
