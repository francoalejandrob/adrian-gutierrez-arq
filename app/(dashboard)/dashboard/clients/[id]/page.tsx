import Link from "next/link";
import { notFound } from "next/navigation";
import ClientForm from "@/components/dashboard/client-form";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/supabase/types";
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
        <Link
          href={`/dashboard/projects/new?client_id=${client.id}`}
          className="cursor-pointer bg-carbon px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Nuevo proyecto
        </Link>
      </div>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Proyectos</h2>
        <div className="flex flex-col gap-2">
          {(projects ?? []).map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center justify-between border-b border-carbon/5 py-2 text-sm last:border-0 hover:text-naranja"
            >
              <span className="text-carbon">{project.name}</span>
              <span className="text-xs text-carbon/50">
                {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
              </span>
            </Link>
          ))}
          {(projects ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin proyectos todavía.</p>
          )}
        </div>
      </div>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Editar información</h2>
        <ClientForm action={boundUpdate} defaultValues={client} />
      </div>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Actividad</h2>
        <form action={boundAddNote} className="flex gap-2">
          <input
            name="body"
            placeholder="Agregar una nota…"
            className="flex-1 border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
          />
          <button
            type="submit"
            className="cursor-pointer border border-carbon px-4 py-2 text-sm text-carbon transition-colors hover:bg-carbon hover:text-white"
          >
            Agregar
          </button>
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
      </div>
    </div>
  );
}
