import "server-only";

// Google Calendar needs 3-legged OAuth (a user grants ARCHI.OS access to
// their own calendar) — unlike GA4/Search Console this can't run on a
// service account alone. That's a bigger feature than "add an env var":
// a consent screen, an OAuth callback route, and per-user refresh-token
// storage. This phase ships only the config-detection interface the plan
// asked for; the actual OAuth flow is not implemented yet, and this file
// says so honestly instead of pretending to work.

export function isGoogleCalendarConfigured() {
  return Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET);
}

export type IntegrationResult<T> =
  | { configured: false; reason: string }
  | { configured: true; data: T };

export async function listUpcomingEvents(): Promise<IntegrationResult<never>> {
  return {
    configured: false,
    reason: isGoogleCalendarConfigured()
      ? "Las credenciales de Google Calendar están configuradas, pero el flujo de autorización por usuario (OAuth) todavía no está implementado."
      : "Falta configurar Google Calendar: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, y el flujo de autorización por usuario (no implementado todavía). Ver INTEGRATION_SETUP.md.",
  };
}
