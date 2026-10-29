import { getSession } from "@/lib/session";
import { loadMetrics } from "@/lib/api/server";
import { metricsQuerySchema } from "@/lib/api/contracts";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "No autorizado. Inicia sesión para ver las métricas." },
      { status: 401 },
    );
  }

  const parsed = metricsQuerySchema.safeParse({
    range: request.nextUrl.searchParams.get("range") ?? undefined,
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const metrics = await loadMetrics(parsed.data);

    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron obtener las métricas.",
      },
      { status: 400 },
    );
  }
}
