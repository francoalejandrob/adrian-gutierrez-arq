import PageHeader from "@/components/dashboard/ui/page-header";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: org }, { data: members }] = await Promise.all([
    supabase.from("organizations").select("name, created_at").limit(1).maybeSingle(),
    supabase.from("organization_members").select("role, profiles(full_name, email)").order("created_at"),
  ]);

  return (
    <div>
      <PageHeader title="Configuración" />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Estudio</p>
          <div className="flex flex-col gap-4 rounded-[10px] border border-carbon/[0.08] bg-white p-[22px]">
            <div>
              <p className="mb-1 text-[11.5px] text-carbon/45">Nombre</p>
              <p className="text-sm text-carbon">{org?.name ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] text-carbon/45">En ARCHI.OS desde</p>
              <p className="font-mono text-sm text-carbon">
                {org?.created_at ? new Date(org.created_at).toLocaleDateString("es-EC", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Equipo</p>
          <div className="rounded-[10px] border border-carbon/[0.08] bg-white">
            {(members ?? []).map((member, i) => {
              const name = member.profiles?.full_name || member.profiles?.email || "—";
              return (
                <div key={i} className="flex items-center gap-3 border-b border-carbon/[0.06] px-[18px] py-3.5 last:border-0">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-arena font-display text-[12.5px] text-carbon">
                    {initials(name)}
                  </div>
                  <p className="flex-1 text-[13.5px] text-carbon">{name}</p>
                  <span className="font-mono text-[11.5px] text-carbon/45">{member.role}</span>
                </div>
              );
            })}
            {(members ?? []).length === 0 && <p className="p-[18px] text-sm text-carbon/40">Sin miembros todavía.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
