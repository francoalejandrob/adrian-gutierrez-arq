import ChangePasswordForm from "@/components/dashboard/change-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function PortalAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="font-dp-serif text-3xl text-tinta">Tu cuenta</h1>

      <div className="mt-7 flex flex-col gap-5 border-t border-filete pt-5">
        <div>
          <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Correo</p>
          <p className="mt-1.5 font-dp-sans text-[13.5px] text-tinta">{user?.email ?? "—"}</p>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
