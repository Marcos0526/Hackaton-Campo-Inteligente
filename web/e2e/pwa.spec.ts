import { expect, test } from "@playwright/test";

test("es instalable y muestra el modo sin conexión", async ({
  page,
  context,
}) => {
  await page.goto("/login");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  expect(
    await page.locator('link[rel="apple-touch-icon"]').count(),
  ).toBeGreaterThan(0);

  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return response.json() as Promise<{
      name: string;
      display: string;
      icons: Array<{ sizes: string; purpose?: string }>;
    }>;
  });

  expect(manifest.name).toBe("Campo Inteligente");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );

  const icon = await page.request.get("/icons/icon-512.png");
  expect(icon.ok()).toBe(true);
  expect(icon.headers()["content-type"]).toContain("image/png");

  await page.waitForFunction(
    async () => Boolean((await navigator.serviceWorker.ready).active),
  );
  await page.waitForFunction(() =>
    Boolean(navigator.serviceWorker.controller),
  );

  await context.setOffline(true);
  await page.goto("/dashboard").catch(() => undefined);

  await expect(
    page.getByRole("heading", { name: "No pudimos cargar el panel" }),
  ).toBeVisible();

  await context.setOffline(false);
});
