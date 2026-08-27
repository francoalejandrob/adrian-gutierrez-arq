import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { architectBio, projects, type Project, studio } from "@/lib/content";

export type WebsiteContent = {
  hero: {
    location: string;
    coordinates: string;
    line1: string;
    line2: string;
    line3: string;
    subtext: string;
  };
  about: {
    quote: string;
    bio: string[];
  };
  projects: Project[];
};

const defaults: WebsiteContent = {
  hero: {
    location: studio.location,
    coordinates: studio.coordinates,
    line1: "Espacios que",
    line2: "responden al",
    line3: "lugar.",
    subtext: "Arquitectura y diseño pensados para habitar, durar y pertenecer.",
  },
  about: architectBio,
  projects,
};

function isProjectList(value: unknown): value is Project[] {
  return Array.isArray(value) && value.every((project) =>
    typeof project === "object" && project !== null &&
    typeof (project as Project).id === "string" &&
    typeof (project as Project).name === "string" &&
    typeof (project as Project).image === "string",
  );
}

async function readWebsiteContent(): Promise<WebsiteContent> {
  const organizationId = process.env.ARCHIOS_ORGANIZATION_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!organizationId || !url || !serviceRole) return defaults;

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await supabase
    .from("website_content")
    .select("content_key, content")
    .eq("organization_id", organizationId)
    .in("content_key", ["site", "projects"]);

  const site = data?.find((row) => row.content_key === "site")?.content as Partial<WebsiteContent> | undefined;
  const editableProjects = data?.find((row) => row.content_key === "projects")?.content;

  return {
    hero: { ...defaults.hero, ...(site?.hero ?? {}) },
    about: {
      quote: site?.about?.quote || defaults.about.quote,
      bio: Array.isArray(site?.about?.bio) && site.about.bio.every((value) => typeof value === "string")
        ? site.about.bio
        : defaults.about.bio,
    },
    projects: isProjectList(editableProjects) ? editableProjects : defaults.projects,
  };
}

/** Shared tag used by the signed publishing webhook in ArchiOS. */
export function websiteContentTag(organizationId: string) {
  return `website-content:${organizationId}`;
}

export async function getWebsiteContent() {
  const organizationId = process.env.ARCHIOS_ORGANIZATION_ID;
  if (!organizationId) return defaults;

  return unstable_cache(readWebsiteContent, ["website-content", organizationId], {
    tags: [websiteContentTag(organizationId)],
    revalidate: 3600,
  })();
}
