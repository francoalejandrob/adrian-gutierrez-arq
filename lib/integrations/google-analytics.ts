import "server-only";
import { getGoogleAccessToken, getServiceAccountConfig } from "./google-service-account";

// Real wiring against the GA4 Data API's REST endpoint (`runReport`), gated
// on GOOGLE_ANALYTICS_PROPERTY_ID + the shared service account. Section 53
// of the master prompt: never invent data — this throws/reports "not
// configured" rather than fabricating traffic numbers. Not exercised
// end-to-end (no live GA4 property to test against yet); the request/
// response shape follows the documented Data API v1beta contract.

export type ChannelTraffic = { channel: string; activeUsers: number; sessions: number };

export type TrafficSummary = {
  rangeDays: number;
  totals: { activeUsers: number; sessions: number };
  byChannel: ChannelTraffic[];
};

export type IntegrationResult<T> =
  | { configured: false; reason: string }
  | { configured: true; data: T };

export function isGoogleAnalyticsConfigured() {
  return Boolean(getServiceAccountConfig() && process.env.GOOGLE_ANALYTICS_PROPERTY_ID);
}

export async function getTrafficSummary(rangeDays = 28): Promise<IntegrationResult<TrafficSummary>> {
  if (!isGoogleAnalyticsConfigured()) {
    return {
      configured: false,
      reason:
        "Falta configurar Google Analytics: GOOGLE_ANALYTICS_PROPERTY_ID y las credenciales de la cuenta de servicio (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY). Ver INTEGRATION_SETUP.md.",
    };
  }

  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID!;
  const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/analytics.readonly");

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`GA4 Data API error (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  };

  const byChannel: ChannelTraffic[] = (body.rows ?? []).map((row) => ({
    channel: row.dimensionValues[0]?.value ?? "(sin canal)",
    activeUsers: Number(row.metricValues[0]?.value ?? 0),
    sessions: Number(row.metricValues[1]?.value ?? 0),
  }));

  const totals = byChannel.reduce(
    (acc, row) => ({
      activeUsers: acc.activeUsers + row.activeUsers,
      sessions: acc.sessions + row.sessions,
    }),
    { activeUsers: 0, sessions: 0 },
  );

  return { configured: true, data: { rangeDays, totals, byChannel } };
}
