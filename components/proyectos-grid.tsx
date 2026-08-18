"use client";

import { useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RevealText from "@/components/reveal-text";
import { Project, projects } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

export default function ProyectosGrid() {
  return (
    <section id="proyectos" className="bg-hueso py-32 md:py-44">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-piedra">
              Trabajo seleccionado
            </p>
            <h2 className="max-w-xl font-display text-3xl text-carbon sm:text-4xl md:text-5xl">
              <RevealText text="Proyectos" />
            </h2>
          </div>
          <Link
            href="/proyectos"
            className="press cursor-pointer font-mono text-xs uppercase tracking-[0.15em] text-carbon underline decoration-naranja decoration-2 underline-offset-4 transition-colors duration-200 hover:text-naranja"
          >
            Ver todos los proyectos →
          </Link>
        </div>

        <div
          style={{ perspective: 1200 }}
          className="grid grid-cols-1 gap-px overflow-hidden border border-piedra/20 bg-piedra/20 sm:grid-cols-2"
        >
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [tiltEnabled] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !shouldReduceMotion,
  );

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    if (!tiltEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(relativeX * 10);
    rotateX.set(relativeY * -10);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE_OUT }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-carbon p-8"
    >
      <Image
        src={project.image}
        alt={project.imageAlt}
        fill
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover grayscale-[55%] contrast-[1.05] transition-[filter,transform] duration-700 ease-out-strong group-hover:scale-110 group-hover:grayscale-0"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/10 to-carbon/40 transition-opacity duration-500 group-hover:from-carbon/90"
      />

      <div className="relative flex items-start justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/80 transition-colors duration-300 group-hover:text-naranja">
          {project.code}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/80">
          {project.category}
        </span>
      </div>

      <div className="relative">
        <h3 className="font-display text-2xl text-hueso">{project.name}</h3>
        <p className="mt-1 text-sm text-hueso/70">{project.location}</p>
        <p className="mt-3 max-w-sm text-sm text-hueso/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {project.tagline}
        </p>
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-10 h-0.5 origin-left scale-x-0 bg-naranja transition-transform duration-300 ease-out-strong group-hover:scale-x-100"
      />
    </motion.article>
  );
}
