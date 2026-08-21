"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { process } from "@/lib/content";
import { processEn, useLocale, useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";

export default function Proceso() {
  const t = useT();
  const { locale } = useLocale();
  const steps = locale === "es" ? process : processEn;
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.75", "end 0.4"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.5,
  });

  return (
    <section id="proceso" className="bg-hueso py-14 md:py-20">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="font-mono text-xs uppercase tracking-[0.2em] text-piedra"
        >
          {t.proceso.eyebrow}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT }}
          className="mt-3 max-w-2xl font-display text-3xl text-carbon sm:text-4xl md:text-5xl"
        >
          {t.proceso.heading}
        </motion.h2>

        <div ref={trackRef} className="relative mt-10">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-piedra/20" />
          <motion.div
            style={{ scaleX: progress }}
            className="absolute inset-x-0 top-0 h-0.5 origin-left bg-naranja"
          />

          <div className="divide-y divide-carbon/10 border-b border-carbon/10">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
                className="group grid grid-cols-1 gap-4 py-10 transition-colors duration-300 hover:bg-arena/40 md:grid-cols-12 md:items-center md:gap-8 md:px-4 md:py-12"
              >
                <span className="font-display text-6xl text-naranja/25 transition-colors duration-300 ease-out-strong group-hover:text-naranja md:col-span-2 md:text-7xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl text-carbon md:col-span-4 md:text-3xl">
                  {step.title}
                </h3>
                <p className="max-w-md text-base leading-relaxed text-piedra md:col-span-6">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
