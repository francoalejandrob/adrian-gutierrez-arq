import ProjectForm from "@/components/dashboard/project-form";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "../actions";

export default async function NewProjectPage(
  props: PageProps<"/dashboard/projects/new">,
) {
  const searchParams = await props.searchParams;
  const preselectedClientId = Array.isArray(searchParams.client_id)
    ? searchParams.client_id[0]
    : searchParams.client_id;

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-carbon">Nuevo proyecto</h1>
      <div className="mt-6 border border-carbon/10 bg-white p-6">
        <ProjectForm
          action={createProject}
          clients={clients ?? []}
          defaultValues={preselectedClientId ? { client_id: preselectedClientId } : undefined}
        />
      </div>
    </div>
  );
}
