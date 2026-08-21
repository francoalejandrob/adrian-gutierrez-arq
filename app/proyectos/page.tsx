import type { Metadata } from "next";
import ProyectosArchivo from "@/components/proyectos-archivo";

export const metadata: Metadata = {
  title: "Proyectos — Adrián Gutiérrez Arquitectura & Diseño",
  description:
    "Archivo completo de proyectos de arquitectura, diseño y remodelación en Ecuador y Estados Unidos.",
};

export default function ProyectosPage() {
  return <ProyectosArchivo />;
}
