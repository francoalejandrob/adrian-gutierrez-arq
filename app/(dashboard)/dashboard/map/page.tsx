import MapView, { type MapPinData } from "@/components/dashboard/map-view";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusMark from "@/components/dashboard/ui/status-mark";
import { createClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div>
        <PageHeader eyebrow="Inteligencia · Ubicación de clientes y proyectos" title="Mapa" />
        <div className="px-12 py-10">
          <EmptyState
            reason="Falta configurar Google Maps: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
            hint="Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración."
          />
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null),
    supabase
      .from("projects")
      .select("id, name, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null),
  ]);

  const pins: MapPinData[] = [
    ...(clients ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      kind: "client" as const,
      lat: c.latitude!,
      lng: c.longitude!,
      href: `/dashboard/clients/${c.id}`,
    })),
    ...(projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      kind: "project" as const,
      lat: p.latitude!,
      lng: p.longitude!,
      href: `/dashboard/projects/${p.id}`,
    })),
  ];

  return (
    <div>
      <PageHeader eyebrow="Inteligencia · Ubicación de clientes y proyectos" title="Mapa" />
      <div className="px-12 py-10">
        {pins.length === 0 ? (
          <EmptyState
            reason="Todavía no hay clientes ni proyectos con una dirección geocodificada."
            hint="Agrega la dirección del cliente o la ubicación del proyecto en su ficha para que aparezca aquí."
          />
        ) : (
          <>
            <div className="mb-5 flex items-center gap-5 font-dp-sans text-[12.5px] text-concreto">
              <Legend color="#47607a" label={`${clients?.length ?? 0} cliente(s)`} />
              <Legend color="#3f6b52" label={`${projects?.length ?? 0} proyecto(s)`} />
            </div>
            <MapView pins={pins} apiKey={apiKey} />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ reason, hint }: { reason: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-corte px-4 py-14 text-center">
      <StatusMark tone="pending" className="h-3 w-3" />
      <div>
        <p className="font-dp-sans text-[13px] text-grafito">{reason}</p>
        <p className="mt-2.5 font-dp-mono text-[10.5px] text-concreto">{hint}</p>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
