import "server-only";

// Geocodifica direcciones a coordenadas via la Geocoding API de Google
// (Fase 7 — mapa de clientes/proyectos, ver INTEGRATION_SETUP.md). Fetch
// directo, sin SDK, mismo criterio que el resto de lib/integrations/.
//
// Key server-only (GOOGLE_MAPS_SERVER_API_KEY), distinta de la key de
// navegador que carga el mapa (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY): esta
// llamada es servidor-a-servidor, así que la key no debe restringirse
// por referrer HTTP (bloquearía estas llamadas), a diferencia de la key
// pública que sí conviene restringir por dominio.
//
// Nunca bloquea el guardado de un cliente/proyecto si falla — sección 53
// del master prompt: mejor no mostrar el pin en el mapa que inventar una
// coordenada. Por eso esta función nunca lanza, solo devuelve null.

export function isGeocodingConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY);
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!isGeocodingConfigured() || !address.trim()) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const body = (await response.json()) as {
      status: string;
      results?: { geometry: { location: { lat: number; lng: number } } }[];
    };
    if (body.status !== "OK") return null;

    const location = body.results?.[0]?.geometry.location;
    return location ? { lat: location.lat, lng: location.lng } : null;
  } catch {
    return null;
  }
}
