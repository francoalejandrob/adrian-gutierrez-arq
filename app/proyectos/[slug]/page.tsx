import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArrowIcon from "@/components/icons/arrow-icon";
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

  return (
    <article className="mx-auto max-w-[1600px] px-6 pb-28 pt-40 md:px-10">
      <Link
        href="/proyectos"
        className="press inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-piedra transition-colors hover:text-carbon"
      >
        <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
        Archivo de proyectos
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-piedra">
          {project.code}
        </span>
        <span className="h-1 w-1 rounded-full bg-piedra/40" />
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-piedra">
          {project.category}
        </span>
      </div>

      <h1 className="mt-4 max-w-3xl font-display text-4xl text-carbon sm:text-5xl md:text-6xl">
        {project.name}
      </h1>
      <p className="mt-3 text-lg text-piedra">{project.location}</p>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-carbon/80">
        {project.description}
      </p>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {project.gallery.map((image, i) => (
          <div
            key={image.src}
            className={`relative aspect-[4/3] overflow-hidden bg-arena ${
              i === 0 ? "sm:col-span-2 sm:aspect-[16/9]" : ""
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={i === 0 ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-start gap-6 border-t border-piedra/20 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/#contacto"
          className="press inline-flex cursor-pointer items-center gap-3 bg-naranja px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] text-carbon transition-colors duration-200 hover:bg-naranja-oscuro"
        >
          Conversemos sobre tu proyecto
          <ArrowIcon className="h-4 w-4 shrink-0" />
        </Link>
        <Link
          href="/proyectos"
          className="press inline-flex items-center gap-3 border border-carbon px-8 py-4 font-mono text-xs uppercase tracking-[0.15em] text-carbon transition-colors duration-200 hover:bg-carbon hover:text-hueso"
        >
          Ver todos los proyectos
        </Link>
      </div>
    </article>
  );
}
