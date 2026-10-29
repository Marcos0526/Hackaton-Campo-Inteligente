import { expect, test } from "@playwright/test";

test("registro, panel, tema y ajustes", async ({ page }) => {
  const email = `e2e+${Date.now()}@campo.mx`;

  await page.goto("/register");
  await page.fill("#name", "Productora E2E");
  await page.fill("#email", email);
  await page.fill("#password", "campo12345");
  await page.fill("#confirmPassword", "campo12345");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: /Hola, Productora/ }),
  ).toBeVisible();

  // Hydrated server data plus three interactive charts.
  await expect(
    page.getByRole("heading", { name: "Producción y rendimiento" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Costo de transporte" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Capacidad de ingreso" }),
  ).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.waitForTimeout(1_200);

  await page.screenshot({
    path: "test-results/dashboard-light.png",
    fullPage: true,
  });

  // Dark mode toggle is persisted through the account preferences.
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Activar modo oscuro" }).click();
  await expect(html).toHaveClass(/dark/);

  await page.screenshot({
    path: "test-results/dashboard-dark.png",
    fullPage: true,
  });

  // Changing the range refetches from the metrics API.
  await page.getByRole("button", { name: "7 días" }).click();
  await expect(page.getByText(/Actualizado/)).toBeVisible();
  await expect(page.locator(".recharts-surface")).toHaveCount(3);

  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Ajustes de cuenta" }),
  ).toBeVisible();

  await page.fill("#profile-name", "Productora Actualizada");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Perfil actualizado correctamente.")).toBeVisible();

  await page.reload();
  await expect(page.locator("#profile-name")).toHaveValue(
    "Productora Actualizada",
  );

  await page.screenshot({
    path: "test-results/settings-dark.png",
    fullPage: true,
  });

  // Mobile layout sanity check.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Abrir menú" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("link", { name: "Ajustes" })).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-mobile-menu.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Cerrar sesión" }).first().click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
});
