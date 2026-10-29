import {
  ApiError,
  metricsResponseSchema,
  type MetricsResponse,
  type Range,
} from "./contracts";

export async function fetchMetrics(
  range: Range,
  signal?: AbortSignal,
): Promise<MetricsResponse> {
  const response = await fetch(`/api/metrics?range=${range}`, {
    headers: { accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    let message = `No se pudieron cargar las métricas (HTTP ${response.status}).`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the generic message when the body is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  const parsed = metricsResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new ApiError(
      "La API devolvió datos con un formato inesperado.",
      502,
    );
  }

  return parsed.data;
}
