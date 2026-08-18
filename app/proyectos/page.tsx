import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Proyectos — Adrián Gutiérrez Arquitectura & Diseño",
  description: "Listado completo de proyectos residenciales y remodelaciones.",
};

export default function ProyectosPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-28 pt-40 md:px-10">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-piedra">
        Archivo
      </p>
      <h1 className="max-w-2xl font-display text-4xl text-carbon sm:text-5xl">
        Todos los proyectos
      </h1>
      <p className="mt-6 max-w-xl text-piedra">
        Estamos preparando el archivo completo de proyectos. Mientras tanto,
        puedes ver los destacados en la portada.
      </p>

      <ul className="mt-16 divide-y divide-piedra/20 border-t border-piedra/20">
        {projects.map((project) => (
          <li
            key={project.id}
            className="group flex flex-col gap-4 border-l-2 border-transparent py-6 pl-4 transition-colors duration-300 hover:border-naranja hover:bg-arena/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-5">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-arena sm:h-20 sm:w-28">
                <Image
                  src={project.image}
                  alt={project.imageAlt}
                  fill
                  sizes="120px"
                  className="object-cover grayscale-[55%] transition-[filter,transform] duration-500 ease-out-strong group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-piedra">
                  {project.code}
                </span>
                <h2 className="font-display text-2xl text-carbon">
                  {project.name}
                </h2>
              </div>
            </div>
            <span className="text-sm text-piedra sm:pl-4">
              {project.location}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/#contacto"
        className="press mt-16 inline-block cursor-pointer bg-naranja px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] text-carbon transition-colors duration-200 hover:bg-naranja-oscuro"
      >
        Conversemos sobre tu proyecto
      </Link>
    </section>
  );
}
