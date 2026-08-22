import Link from "next/link";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, type ProjectStatus } from "@/lib/supabase/types";

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
      <h1 className="font-dp-serif text-3xl text-tinta">Tus proyectos</h1>
      <div className="mt-7 flex flex-col gap-3">
        {(projects ?? []).map((project) => (
          <Link
            key={project.id}
            href={`/portal/projects/${project.id}`}
            className="dp-card flex items-center justify-between p-6 transition-transform duration-150 hover:-translate-y-px"
          >
            <span className="font-dp-sans text-[14px] text-tinta">{project.name}</span>
            <span className="flex items-center gap-3">
              <StatusBadge label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]} tone={PROJECT_STATUS_TONE[project.status as ProjectStatus]} />
              <span className="font-dp-mono text-[11px] text-concreto">{project.progress}%</span>
            </span>
          </Link>
        ))}
        {(projects ?? []).length === 0 && (
          <p className="font-dp-sans text-sm text-concreto">
            Todavía no tienes proyectos asociados a esta cuenta. Si esperabas ver algo aquí,
            contacta al estudio.
          </p>
        )}
      </div>
    </div>
  );
}
