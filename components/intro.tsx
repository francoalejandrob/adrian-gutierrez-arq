"use client";

import { motion } from "framer-motion";
import CountUp from "@/components/count-up";
import { studio } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

const stats = [
  { to: studio.years, suffix: "", label: "Años de trayectoria" },
  { to: studio.projectCount, suffix: "+", label: "Proyectos entregados" },
  { to: 100, suffix: "%", label: "Supervisión directa en obra" },
];

export default function Intro() {
  return (
    <section className="border-t border-piedra/20 bg-hueso py-32 md:py-44">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 px-6 md:grid-cols-12 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="md:col-span-8"
        >
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-piedra">
            Estudio
          </p>
          <h2 className="max-w-2xl font-display text-3xl leading-tight text-carbon sm:text-4xl md:text-5xl">
            Cada proyecto empieza por entender cómo entra el sol, de dónde
            viene el viento y cómo se va a vivir el espacio, mucho antes de
            dibujar una fachada.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
          className="flex flex-col justify-between gap-10 md:col-span-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-l border-naranja/40 pl-5 transition-colors duration-300 hover:border-naranja"
            >
              <div className="font-display text-4xl text-naranja">
                <CountUp to={stat.to} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm text-piedra">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
