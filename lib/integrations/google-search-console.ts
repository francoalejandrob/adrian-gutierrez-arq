import "server-only";
import { getGoogleAccessToken, getServiceAccountConfig } from "./google-service-account";
import type { IntegrationResult } from "./google-analytics";

// Same discipline as google-analytics.ts: real REST wiring against the
// Search Console API's searchAnalytics.query, gated on config, never
// exercised end-to-end without a live property. See INTEGRATION_SETUP.md.

export type SearchQueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };

export type SearchPerformance = { rangeDays: number; topQueries: SearchQueryRow[] };

export function isSearchConsoleConfigured() {
  return Boolean(getServiceAccountConfig() && process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL);
}

export async function getSearchPerformance(rangeDays = 28): Promise<IntegrationResult<SearchPerformance>> {
  if (!isSearchConsoleConfigured()) {
    return {
      configured: false,
      reason:
        "Falta configurar Search Console: GOOGLE_SEARCH_CONSOLE_SITE_URL y las credenciales de la cuenta de servicio (con acceso de lectura a la propiedad). Ver INTEGRATION_SETUP.md.",
    };
  }

  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL!;
  const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/webmasters.readonly");

  const end = new Date();
  const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const format = (d: Date) => d.toISOString().slice(0, 10);

  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: format(start),
        endDate: format(end),
        dimensions: ["query"],
        rowLimit: 10,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Search Console API error (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as {
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  };

  const topQueries: SearchQueryRow[] = (body.rows ?? []).map((row) => ({
    query: row.keys[0] ?? "(sin consulta)",
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));

  return { configured: true, data: { rangeDays, topQueries } };
}
