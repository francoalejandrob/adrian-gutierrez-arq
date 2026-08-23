import Avatar from "@/components/dashboard/ui/avatar";
import PageHeader from "@/components/dashboard/ui/page-header";
import ChangePasswordForm from "@/components/dashboard/change-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: org }, { data: members }, { data: userRes }] = await Promise.all([
    supabase.from("organizations").select("name, created_at").limit(1).maybeSingle(),
    supabase.from("organization_members").select("role, profiles(full_name, email)").order("created_at"),
    supabase.auth.getUser(),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Sistema" title="Configuración" />

      <div className="grid grid-cols-1 gap-12 px-12 py-10 lg:grid-cols-2">
        <div>
          <p className="mb-5 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Estudio</p>
          <div className="flex flex-col gap-5 border-t border-filete pt-5">
            <div>
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Nombre</p>
              <p className="mt-1.5 font-dp-sans text-[13.5px] text-tinta">{org?.name ?? "—"}</p>
            </div>
            <div>
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">En ARCHI.OS desde</p>
              <p className="mt-1.5 font-dp-mono text-[13px] text-tinta">
                {org?.created_at ? new Date(org.created_at).toLocaleDateString("es-EC", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
            <div>
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Moneda</p>
              <p className="mt-1.5 font-dp-mono text-[13px] text-tinta">USD</p>
            </div>
            <div>
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Acento</p>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="h-4 w-4 shrink-0 bg-acento" />
                <span className="font-dp-mono text-[12px] text-tinta">#A8382A</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-5 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Equipo</p>
          <div className="border-t border-filete">
            {(members ?? []).map((member, i) => {
              const name = member.profiles?.full_name || member.profiles?.email || "—";
              return (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-filete py-3.5">
                  <span className="flex items-center gap-3">
                    <Avatar name={name} size={26} />
                    <span className="font-dp-sans text-[13.5px] text-tinta">{name}</span>
                  </span>
                  <span className="font-dp-mono text-[11px] uppercase tracking-[0.08em] text-concreto">{member.role}</span>
                </div>
              );
            })}
            {(members ?? []).length === 0 && <p className="py-4 font-dp-sans text-sm text-concreto">Sin miembros todavía.</p>}
          </div>
        </div>

        <div>
          <p className="mb-5 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Cuenta</p>
          <div className="flex flex-col gap-5 border-t border-filete pt-5">
            <div>
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Correo</p>
              <p className="mt-1.5 font-dp-sans text-[13.5px] text-tinta">{userRes.user?.email ?? "—"}</p>
            </div>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
