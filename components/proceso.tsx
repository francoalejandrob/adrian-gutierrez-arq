"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import RevealText from "@/components/reveal-text";
import { process } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

export default function Proceso() {
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
    <section id="proceso" className="bg-hueso py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <h2 className="max-w-2xl font-display text-3xl text-carbon sm:text-4xl md:text-5xl">
          <RevealText text="Un proceso claro, de la primera conversación a la entrega de llaves." />
        </h2>

        <div ref={trackRef} className="relative mt-16">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-piedra/20" />
          <motion.div
            style={{ scaleX: progress }}
            className="absolute inset-x-0 top-0 h-0.5 origin-left bg-naranja"
          />

          <div className="grid grid-cols-1 gap-10 pt-8 md:grid-cols-4">
            {process.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
              >
                <h3 className="font-display text-2xl text-carbon">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-piedra">
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
