import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DOC_CATEGORY_LABELS,
  DOC_VERSION_STATUS_LABELS,
  PHASE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type PhaseStatus,
  type ProjectStatus,
} from "@/lib/supabase/types";
import { addPortalMessage, respondToDocumentVersion } from "../../../actions";

export default async function PortalProjectPage(
  props: PageProps<"/portal/projects/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: project }, { data: phases }, { data: documents }, { data: activity }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("phases").select("*").eq("project_id", id).order("position"),
      supabase
        .from("documents")
        .select("*, document_versions(*)")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", "project")
        .eq("entity_id", id)
        .order("created_at", { ascending: false }),
    ]);

  // RLS already scopes this to the client's own project; a missing row
  // means either it doesn't exist or it isn't theirs — same response either way.
  if (!project) notFound();

  const boundAddMessage = addPortalMessage.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-carbon">{project.name}</h1>
      <p className="mt-1 text-sm text-carbon/60">
        {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
      </p>

      <div className="mt-3 h-2 w-full bg-carbon/10">
        <div className="h-full bg-naranja" style={{ width: `${project.progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-carbon/50">{project.progress}% completado</p>

      <Section title="Fases">
        <div className="flex flex-col gap-2">
          {(phases ?? []).map((phase) => (
            <div key={phase.id} className="flex items-center justify-between text-sm">
              <span className="text-carbon/80">{phase.name}</span>
              <span className="text-xs text-carbon/50">
                {PHASE_STATUS_LABELS[phase.status as PhaseStatus]}
              </span>
            </div>
          ))}
          {(phases ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin fases publicadas todavía.</p>
          )}
        </div>
      </Section>

      <Section title="Documentos">
        <div className="flex flex-col gap-4">
          {(documents ?? []).map((doc) => {
            const latest = [...doc.document_versions].sort((a, b) => b.version - a.version)[0];
            if (!latest) return null;
            const boundRespond = respondToDocumentVersion.bind(null, id, latest.id);

            return (
              <div key={doc.id} className="border-b border-carbon/5 pb-4 last:border-0">
                <p className="text-sm font-medium text-carbon">
                  {doc.name}{" "}
                  <span className="text-xs font-normal text-carbon/40">
                    ({DOC_CATEGORY_LABELS[doc.category]}, v{latest.version})
                  </span>
                </p>
                <p className="mt-1 text-xs text-carbon/50">
                  Estado: {DOC_VERSION_STATUS_LABELS[latest.status]}
                  {latest.comment ? ` — "${latest.comment}"` : ""}
                </p>
                {latest.status !== "aprobado" && (
                  <form action={boundRespond} className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      name="comment"
                      placeholder="Comentario (opcional)"
                      className="flex-1 border border-carbon/20 bg-white px-2 py-1 text-xs outline-none focus:border-carbon"
                    />
                    <button
                      type="submit"
                      name="status"
                      value="aprobado"
                      className="cursor-pointer bg-carbon px-3 py-1 text-xs text-white transition-opacity hover:opacity-90"
                    >
                      Aprobar
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="cambios_solicitados"
                      className="cursor-pointer border border-carbon px-3 py-1 text-xs text-carbon transition-colors hover:bg-carbon hover:text-white"
                    >
                      Solicitar cambios
                    </button>
                  </form>
                )}
              </div>
            );
          })}
          {(documents ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin documentos compartidos todavía.</p>
          )}
        </div>
      </Section>

      <Section title="Mensajes">
        <form action={boundAddMessage} className="flex gap-2">
          <input
            name="body"
            placeholder="Escribe un mensaje…"
            className="flex-1 border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
          />
          <button
            type="submit"
            className="cursor-pointer border border-carbon px-4 py-2 text-sm text-carbon transition-colors hover:bg-carbon hover:text-white"
          >
            Enviar
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
            <li className="text-sm text-carbon/40">Sin mensajes todavía.</li>
          )}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border border-carbon/10 bg-white p-6">
      <h2 className="mb-4 text-sm font-medium text-carbon">{title}</h2>
      {children}
    </div>
  );
}
