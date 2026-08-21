import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProyectoDetalle from "@/components/proyecto-detalle";
import { projects } from "@/lib/content";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata(
  props: PageProps<"/proyectos/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = projects.find((p) => p.id === slug);
  if (!project) return {};

  return {
    title: `${project.name} — Adrián Gutiérrez Arquitectura & Diseño`,
    description: project.tagline,
  };
}

export default async function ProyectoPage(
  props: PageProps<"/proyectos/[slug]">,
) {
  const { slug } = await props.params;
  const project = projects.find((p) => p.id === slug);
  if (!project) notFound();

  return <ProyectoDetalle project={project} />;
}
