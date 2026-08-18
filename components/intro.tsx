"use client";

import { motion } from "framer-motion";
import CountUp from "@/components/count-up";
import RevealText from "@/components/reveal-text";
import { studio } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

const stats = [
  { to: studio.years, suffix: "", label: "Años de trayectoria" },
  { to: studio.projectCount, suffix: "+", label: "Proyectos entregados" },
  { to: 100, suffix: "%", label: "Supervisión directa en obra" },
];

export default function Intro() {
  return (
    <section className="bg-carbon py-14 text-hueso md:py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center md:px-10">
        <h2 className="font-display text-3xl leading-[1.3] sm:text-4xl md:text-5xl">
          <RevealText text="Cada proyecto empieza por entender cómo entra el sol, de dónde viene el viento y cómo se va a" />{" "}
          <RevealText
            text="vivir el espacio,"
            className="font-semibold"
            delay={0.95}
          />{" "}
          <RevealText text="mucho antes de dibujar una fachada." delay={1.1} />
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, delay: 1.5, ease: EASE_OUT }}
          className="mt-16 flex flex-wrap justify-center gap-x-16 gap-y-10"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl text-naranja">
                <CountUp to={stat.to} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-base text-hueso/70">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
