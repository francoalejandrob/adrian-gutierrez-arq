"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import BlueprintArt from "@/components/blueprint-art";
import { projects } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

export default function ProyectosGrid() {
  return (
    <section id="proyectos" className="bg-hueso py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-piedra">
              Trabajo seleccionado
            </p>
            <h2 className="max-w-xl font-display text-3xl text-carbon sm:text-4xl md:text-5xl">
              Proyectos
            </h2>
          </div>
          <Link
            href="/proyectos"
            className="press cursor-pointer font-mono text-xs uppercase tracking-[0.15em] text-carbon underline decoration-naranja decoration-2 underline-offset-4 transition-colors duration-200 hover:text-naranja"
          >
            Ver todos los proyectos →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden border border-piedra/20 bg-piedra/20 sm:grid-cols-2">
          {projects.map((project, i) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT }}
              className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-arena p-8 transition-colors duration-300 hover:bg-arena/60"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-piedra transition-colors duration-300 group-hover:text-naranja">
                  {project.code}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-piedra">
                  {project.category}
                </span>
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out-strong group-hover:scale-110">
                <BlueprintArt
                  variant={project.art}
                  className="h-2/3 w-2/3"
                  strokeClassName="text-carbon/70"
                />
              </div>

              <div className="relative">
                <h3 className="font-display text-2xl text-carbon">
                  {project.name}
                </h3>
                <p className="mt-1 text-sm text-piedra">{project.location}</p>
                <p className="mt-3 max-w-sm text-sm text-carbon/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {project.tagline}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-naranja transition-transform duration-300 ease-out-strong group-hover:scale-x-100"
              />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
