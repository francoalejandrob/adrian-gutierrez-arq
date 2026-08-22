import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/supabase/types";

const THUMB_HUES = ["#d9a077", "#c9c2b3", "#b6c9b8", "#cbb4a3"];

export default async function ProjectsPage(
  props: PageProps<"/dashboard/projects">,
) {
  const searchParams = await props.searchParams;
  const statusFilter = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;

  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (statusFilter && (PROJECT_STATUSES as string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data: projects } = await query;

  return (
    <div>
      <PageHeader
        title="Proyectos"
        action={
          <Link href="/dashboard/projects/new" className={buttonClass("primary", "md")}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Nuevo proyecto
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterPill href="/dashboard/projects" label="Todos" active={!statusFilter} />
        {PROJECT_STATUSES.map((status) => (
          <FilterPill
            key={status}
            href={`/dashboard/projects?status=${status}`}
            label={PROJECT_STATUS_LABELS[status]}
            active={statusFilter === status}
          />
        ))}
      </div>

      {(projects ?? []).length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {(projects ?? []).map((project, i) => {
            const hue = THUMB_HUES[i % THUMB_HUES.length];
            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="overflow-hidden rounded-[14px] border border-carbon/[0.08] bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.1)]"
              >
                <div
                  className="aspect-video w-full"
                  style={{
                    backgroundImage: `repeating-linear-gradient(135deg, ${hue}, ${hue} 8px, #e4dfd4 8px, #e4dfd4 16px)`,
                  }}
                />
                <div className="p-[22px]">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="mb-1.5 font-display text-[19px] font-medium text-carbon">{project.name}</p>
                      {project.category && (
                        <span className="inline-block bg-hueso px-2 py-0.5 text-[10.5px] uppercase tracking-wide text-naranja-oscuro">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-2xl font-medium text-carbon">{project.progress}%</span>
                  </div>
                  <div className="mb-3.5 h-1 w-full bg-carbon/[0.08]">
                    <div className="h-1 bg-naranja" style={{ width: `${project.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[12.5px] text-carbon/55">
                    <span>{project.clients?.name ?? "—"}</span>
                    <span className="font-mono">
                      {project.estimated_end_date
                        ? `Entrega ${new Date(project.estimated_end_date).toLocaleDateString("es-EC")}`
                        : "Sin fecha de entrega"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[10px] border border-carbon/[0.08] bg-white">
          <EmptyState
            icon={FolderKanban}
            title="Todavía no hay proyectos"
            description="Creá un proyecto directamente o desde la ficha de un cliente."
            action={
              <Link href="/dashboard/projects/new" className={buttonClass("secondary", "sm")}>
                Crear el primero
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
        active
          ? "bg-carbon text-white"
          : "border border-carbon/20 text-carbon/60 hover:border-carbon hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}
