import type { Metadata } from "next";
import Link from "next/link";
import ProyectosArchivo from "@/components/proyectos-archivo";

export const metadata: Metadata = {
  title: "Proyectos — Adrián Gutiérrez Arquitectura & Diseño",
  description:
    "Archivo completo de proyectos de arquitectura, diseño y remodelación en Ecuador y Estados Unidos.",
};

export default function ProyectosPage() {
  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-28 pt-40 md:px-10">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-piedra">
        Archivo
      </p>
      <h1 className="max-w-2xl font-display text-4xl text-carbon sm:text-5xl">
        Todos los proyectos
      </h1>
      <p className="mt-6 max-w-xl text-piedra">
        Arquitectura, diseño y construcción en Ecuador y Estados Unidos.
      </p>

      <div className="mt-16">
        <ProyectosArchivo />
      </div>

      <Link
        href="/#contacto"
        className="press mt-16 inline-block cursor-pointer bg-naranja px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] text-carbon transition-colors duration-200 hover:bg-naranja-oscuro"
      >
        Conversemos sobre tu proyecto
      </Link>
    </section>
  );
}
