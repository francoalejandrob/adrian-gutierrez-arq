"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Project, projects } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

const CATEGORIES = [
  "Todos",
  ...Array.from(new Set(projects.map((p) => p.category))),
] as const;

export default function ProyectosArchivo() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("Todos");

  const filtered = useMemo(
    () =>
      active === "Todos"
        ? projects
        : projects.filter((project) => project.category === active),
    [active],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            className={`press cursor-pointer border px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-200 ${
              active === category
                ? "border-carbon bg-carbon text-hueso"
                : "border-piedra/30 text-piedra hover:border-carbon hover:text-carbon"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((project, i) => (
          <ArchiveCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </div>
  );
}

function ArchiveCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.04, ease: EASE_OUT }}
    >
      <Link
        href={`/proyectos/${project.id}`}
        className="press group relative block aspect-[3/4] overflow-hidden bg-carbon"
      >
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover grayscale-[45%] contrast-[1.05] transition-[filter,transform] duration-700 ease-out-strong group-hover:scale-110 group-hover:grayscale-0"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-carbon/90 via-carbon/10 to-transparent transition-opacity duration-500 group-hover:from-carbon/95"
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-hueso/70 transition-colors duration-300 group-hover:text-naranja">
            {project.category}
          </span>
          <h2 className="mt-1 font-display text-lg leading-tight text-hueso sm:text-xl">
            {project.name}
          </h2>
        </div>
      </Link>
    </motion.div>
  );
}
