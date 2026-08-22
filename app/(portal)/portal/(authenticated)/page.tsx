import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/supabase/types";

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, progress")
    .order("created_at", { ascending: false });

  if (projects && projects.length === 1) {
    redirect(`/portal/projects/${projects[0].id}`);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-carbon">Tus proyectos</h1>
      <div className="mt-6 flex flex-col gap-3">
        {(projects ?? []).map((project) => (
          <Link
            key={project.id}
            href={`/portal/projects/${project.id}`}
            className="flex items-center justify-between rounded-[10px] border border-carbon/[0.08] bg-white p-[18px] text-sm transition-colors duration-150 hover:border-carbon/25"
          >
            <span className="font-medium text-carbon">{project.name}</span>
            <span className="font-mono text-xs text-carbon/50">
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus]} · {project.progress}%
            </span>
          </Link>
        ))}
        {(projects ?? []).length === 0 && (
          <p className="text-sm text-carbon/50">
            Todavía no tienes proyectos asociados a esta cuenta. Si esperabas ver algo aquí,
            contacta al estudio.
          </p>
        )}
      </div>
    </div>
  );
}
