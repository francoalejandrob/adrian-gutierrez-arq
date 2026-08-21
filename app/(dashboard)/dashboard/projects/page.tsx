import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import ProgressBar from "@/components/dashboard/ui/progress-bar";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, PROJECT_STATUSES, type ProjectStatus } from "@/lib/supabase/types";

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

      <div className="mt-6 overflow-x-auto border border-carbon/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-xs uppercase tracking-wide text-carbon/50">
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Progreso</th>
              <th className="px-4 py-3">Entrega estimada</th>
            </tr>
          </thead>
          <tbody>
            {(projects ?? []).map((project) => (
              <tr
                key={project.id}
                className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="font-medium text-carbon hover:text-naranja hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/70">{project.clients?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                    tone={PROJECT_STATUS_TONE[project.status as ProjectStatus]}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={project.progress} className="w-16" />
                    <span className="font-mono text-xs text-carbon/60">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-carbon/50">
                  {project.estimated_end_date
                    ? new Date(project.estimated_end_date).toLocaleDateString("es-EC")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(projects ?? []).length === 0 && (
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
        )}
      </div>
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
      className={`px-3 py-1.5 text-xs uppercase tracking-wide transition-colors duration-150 ${
        active
          ? "bg-carbon text-white"
          : "border border-carbon/20 text-carbon/60 hover:border-carbon hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}
