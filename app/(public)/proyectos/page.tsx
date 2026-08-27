import type { Metadata } from "next";
import ProyectosArchivo from "@/components/proyectos-archivo";
import { getWebsiteContent } from "@/lib/website-content";

export const metadata: Metadata = {
  title: "Proyectos — Adrián Gutiérrez Arquitectura & Diseño",
  description:
    "Archivo completo de proyectos de arquitectura, diseño y remodelación en Ecuador y Estados Unidos.",
};

export default async function ProyectosPage() {
  const { projects } = await getWebsiteContent();
  return <ProyectosArchivo projects={projects} />;
}
