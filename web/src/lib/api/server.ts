import {
  metricsResponseSchema,
  type MetricsResponse,
  type Range,
} from "./contracts";
import { generateMockMetrics } from "./mock";
import { resolvePeriod } from "./period";

/**
 * Resolves the metrics payload for a period.
 *
 * When `METRICS_API_URL` is set, the request is proxied server-side (so API
 * keys never reach the browser). If the upstream API fails or returns a
 * payload that does not match the contract, the app degrades to the
 * deterministic demo dataset and marks the response as `mock`.
 */
export async function loadMetrics(input: {
  range: Range;
  from?: string;
  to?: string;
}): Promise<MetricsResponse> {
  const period = resolvePeriod(input);
  const apiUrl = process.env.METRICS_API_URL;

  if (!apiUrl) {
    return generateMockMetrics(period);
  }

  const url = new URL(apiUrl);
  url.searchParams.set("from", period.from);
  url.searchParams.set("to", period.to);

  const apiKey = process.env.METRICS_API_KEY;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`La API respondió con HTTP ${response.status}.`);
    }

    const parsed = metricsResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      throw new Error("La API devolvió un payload que no cumple el contrato.");
    }

    return { ...parsed.data, source: "live" };
  } catch (error) {
    console.warn(
      "[metrics] Upstream no disponible, se usan datos de demostración:",
      error instanceof Error ? error.message : error,
    );
    return generateMockMetrics(period);
  }
}
