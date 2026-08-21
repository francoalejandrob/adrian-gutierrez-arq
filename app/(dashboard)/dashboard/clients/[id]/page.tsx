import Link from "next/link";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import ClientForm from "@/components/dashboard/client-form";
import { buttonClass } from "@/components/dashboard/ui/button";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, type ProjectStatus } from "@/lib/supabase/types";
import { addClientNote, updateClientRecord } from "../actions";

export default async function ClientDetailPage(
  props: PageProps<"/dashboard/clients/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: client }, { data: activity }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("activity_log")
      .select("*")
      .eq("entity_type", "client")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, status")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const boundUpdate = updateClientRecord.bind(null, id);
  const boundAddNote = addClientNote.bind(null, id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-carbon">{client.name}</h1>
          {client.converted_from_lead_id && (
            <p className="mt-1 text-sm text-carbon/50">Convertido desde un lead.</p>
          )}
        </div>
        <Link href={`/dashboard/projects/new?client_id=${client.id}`} className={buttonClass("primary", "md")}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Nuevo proyecto
        </Link>
      </div>

      <Section title="Proyectos">
        <div className="flex flex-col gap-2">
          {(projects ?? []).map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center justify-between border-b border-carbon/5 py-2.5 text-sm transition-colors duration-100 last:border-0 hover:text-naranja"
            >
              <span className="text-carbon">{project.name}</span>
              <StatusBadge
                label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                tone={PROJECT_STATUS_TONE[project.status as ProjectStatus]}
              />
            </Link>
          ))}
          {(projects ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin proyectos todavía.</p>
          )}
        </div>
      </Section>

      <Section title="Editar información">
        <ClientForm action={boundUpdate} defaultValues={client} />
      </Section>

      <Section title="Actividad">
        <form action={boundAddNote} className="flex gap-2">
          <input name="body" placeholder="Agregar una nota…" className={`flex-1 ${inputClass}`} />
          <SubmitButton variant="secondary" pendingLabel="Agregando…">
            Agregar
          </SubmitButton>
        </form>
        <ul className="mt-4 flex flex-col gap-3">
          {(activity ?? []).map((item) => (
            <li key={item.id} className="border-b border-carbon/5 pb-3 text-sm last:border-0">
              <p className="text-carbon/80">{item.body}</p>
              <p className="mt-1 text-xs text-carbon/40">
                {new Date(item.created_at).toLocaleString("es-EC")}
              </p>
            </li>
          ))}
          {(activity ?? []).length === 0 && (
            <li className="text-sm text-carbon/40">Sin actividad todavía.</li>
          )}
        </ul>
      </Section>
    </div>
  );
}
