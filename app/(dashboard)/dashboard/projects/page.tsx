import Link from "next/link";
import { FolderKanban } from "lucide-react";
import Avatar from "@/components/dashboard/ui/avatar";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import ProgressBar from "@/components/dashboard/ui/progress-bar";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { TabLink } from "@/components/dashboard/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, PROJECT_STATUSES } from "@/lib/supabase/types";

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
        eyebrow="Producción"
        title="Proyectos"
        action={
          <Link href="/dashboard/projects/new" className={buttonClass("primary", "md")}>
            Nuevo proyecto
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-filete px-5 py-4 sm:px-12">
        <TabLink href="/dashboard/projects" label="Todos" active={!statusFilter} size="sm" />
        {PROJECT_STATUSES.map((status) => (
          <TabLink
            key={status}
            href={`/dashboard/projects?status=${status}`}
            label={PROJECT_STATUS_LABELS[status]}
            active={statusFilter === status}
            size="sm"
          />
        ))}
      </div>

      {(projects ?? []).length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {(projects ?? []).map((project, i) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center gap-6 border-b border-filete px-5 py-5 transition-colors duration-100 hover:bg-realce sm:px-12"
              >
                <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
                {project.clients?.name && <Avatar name={project.clients.name} size={28} />}
                <div className="w-[220px] shrink-0">
                  <p className="truncate font-dp-serif text-xl text-tinta">{project.name}</p>
                  <p className="mt-1 font-dp-sans text-[12px] text-concreto">
                    {project.category ?? "—"} · {project.clients?.name ?? "—"}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <StatusBadge label={PROJECT_STATUS_LABELS[project.status]} tone={PROJECT_STATUS_TONE[project.status]} />
                    <span className="font-dp-mono text-[12px] text-tinta">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
                <span className="w-[150px] shrink-0 text-right font-dp-mono text-[11px] text-concreto">
                  {project.estimated_end_date
                    ? `Entrega ${new Date(project.estimated_end_date).toLocaleDateString("es-EC")}`
                    : "Sin fecha"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
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
  );
}

