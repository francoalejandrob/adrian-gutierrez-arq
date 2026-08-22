import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CHIP_TONES = ["#4A4842", "#6B6862", "#8A867C"];

// "Recientes" in the sidebar — proxied as the 3 most recently created
// projects, since the app doesn't track per-user recently-viewed state
// (that would need its own table + writes on every project view, for a
// sidebar convenience list; created_at is an honest, already-available
// substitute rather than a feature we don't actually have).
export default async function RecentProjects() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!projects || projects.length === 0) return null;

  return (
    <div className="mx-5 mt-6 border-t border-filete pt-4">
      <p className="mb-[11px] font-dp-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-[#6E6A60]">Recientes</p>
      {projects.map((project, i) => (
        <Link
          key={project.id}
          href={`/dashboard/projects/${project.id}`}
          className="flex items-center gap-2.5 py-[5px] font-dp-sans text-xs text-grafito transition-colors duration-150 hover:text-tinta"
        >
          <span className="h-[9px] w-[9px] shrink-0" style={{ background: CHIP_TONES[i % CHIP_TONES.length] }} />
          <span className="truncate">{project.name}</span>
        </Link>
      ))}
    </div>
  );
}
