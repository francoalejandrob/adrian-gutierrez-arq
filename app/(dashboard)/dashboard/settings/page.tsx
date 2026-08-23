import Avatar from "@/components/dashboard/ui/avatar";
import PageHeader from "@/components/dashboard/ui/page-header";
import { TextField } from "@/components/dashboard/ui/field";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import ChangePasswordForm from "@/components/dashboard/change-password-form";
import { createClient } from "@/lib/supabase/server";
import { updateOrganization, updateProfile } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: org }, { data: members }, { data: userRes }] = await Promise.all([
    supabase.from("organizations").select("name, created_at").limit(1).maybeSingle(),
    supabase.from("organization_members").select("role, user_id, profiles(full_name, email, avatar_url)").order("created_at"),
    supabase.auth.getUser(),
  ]);

  const me = (members ?? []).find((m) => m.user_id === userRes.user?.id);
  const isOrgAdmin = me?.role === "org_admin";

  return (
    <div>
      <PageHeader eyebrow="Sistema" title="Configuración" />

      <div className="grid grid-cols-1 gap-12 px-5 py-8 sm:px-12 sm:py-10 lg:grid-cols-2">
        <div>
          <p className="mb-5 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Estudio</p>
          <div className="flex flex-col gap-5 border-t border-filete pt-5">
            {isOrgAdmin ? (
              <form action={updateOrganization} className="flex items-end gap-3">
                <div className="flex-1">
                  <TextField label="Nombre" name="name" defaultValue={org?.name} required />
                </div>
                <SubmitButton variant="secondary" size="md" pendingLabel="Guardando…">
                  Guardar
                </SubmitButton>
              </form>
            ) : (
              <div>
                <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Nombre</p>
                <p className="mt-1.5 font-dp-sans text-[13.5px] text-tinta">{org?.name ?? "—"}</p>
              </div>
            )}
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
                    <Avatar name={name} size={26} src={member.profiles?.avatar_url} />
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

            <form action={updateProfile} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={me?.profiles?.full_name || userRes.user?.email || "Usuario"} size={52} src={me?.profiles?.avatar_url} />
                <div className="flex-1">
                  <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Foto de perfil</p>
                  <input type="file" name="avatar" accept="image/*" className="mt-1.5 font-dp-sans text-xs text-grafito" />
                </div>
              </div>
              <TextField label="Nombre" name="full_name" defaultValue={me?.profiles?.full_name} required />
              <SubmitButton variant="secondary" size="md" pendingLabel="Guardando…" className="w-fit">
                Guardar perfil
              </SubmitButton>
            </form>

            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
