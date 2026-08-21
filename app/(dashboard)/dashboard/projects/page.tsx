import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES, type ProjectStatus } from "@/lib/supabase/types";

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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-carbon">Proyectos</h1>
        <Link
          href="/dashboard/projects/new"
          className="cursor-pointer bg-carbon px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Nuevo proyecto
        </Link>
      </div>

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
              <tr key={project.id} className="border-b border-carbon/5 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="font-medium text-carbon hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/70">{project.clients?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-block border border-carbon/15 px-2 py-0.5 text-xs text-carbon/70">
                    {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-carbon/70">{project.progress}%</td>
                <td className="px-4 py-3 text-carbon/50">
                  {project.estimated_end_date
                    ? new Date(project.estimated_end_date).toLocaleDateString("es-EC")
                    : "—"}
                </td>
              </tr>
            ))}
            {(projects ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-carbon/50">
                  Todavía no hay proyectos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      className={`px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
        active
          ? "bg-carbon text-white"
          : "border border-carbon/20 text-carbon/60 hover:border-carbon hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}
