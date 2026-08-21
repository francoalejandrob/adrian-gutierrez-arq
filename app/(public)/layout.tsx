import type { Metadata } from "next";
import { MotionConfig } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ScrollProgress from "@/components/scroll-progress";
import { LocaleProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Adrián Gutiérrez — Arquitectura & Diseño",
  description:
    "Estudio de arquitectura, diseño y construcción con más de 50 proyectos entregados en Ecuador y Estados Unidos, abierto a proyectos internacionales. Diseñamos y acompañamos cada obra desde la idea hasta la entrega.",
};

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <LocaleProvider>
      <MotionConfig reducedMotion="user">
        <ScrollProgress />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </MotionConfig>
    </LocaleProvider>
  );
}
