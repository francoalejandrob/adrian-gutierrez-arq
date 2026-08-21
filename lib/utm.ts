const STORAGE_KEY = "archios_attribution";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_page: string | null;
};

const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  landing_page: null,
};

// First-touch attribution: only written once per browser. A visitor who
// arrives from an ad and later browses around (or returns organically)
// keeps the campaign that actually brought them, instead of the last
// page they happened to load.
export function captureAttribution() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const hasUtm = UTM_KEYS.some((key) => params.has(key));
  if (!hasUtm) return;

  const attribution: Attribution = { ...EMPTY_ATTRIBUTION, landing_page: window.location.pathname };
  for (const key of UTM_KEYS) {
    attribution[key] = params.get(key);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
}

export function getStoredAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY_ATTRIBUTION;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_ATTRIBUTION;
  try {
    return { ...EMPTY_ATTRIBUTION, ...JSON.parse(raw) };
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}
