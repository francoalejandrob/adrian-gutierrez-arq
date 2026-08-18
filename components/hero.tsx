"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import BlueprintArt from "@/components/blueprint-art";
import { studio } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.5 });
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0)`;

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(relativeX * 24);
    mouseY.set(relativeY * 24);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-carbon text-hueso"
    >
      <motion.div
        style={{ transform }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70"
      >
        <BlueprintArt
          variant="hero"
          className="h-[70vh] w-full max-w-5xl"
          strokeClassName="text-hueso/40"
        />
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon via-carbon/40 to-carbon/10"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-40 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-naranja"
        >
          {studio.coordinates} — {studio.location}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
          className="max-w-4xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Diseñamos casas que responden a la luz, no al catálogo.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
          className="mt-8 max-w-xl text-lg text-hueso/80"
        >
          Arquitectura residencial de lujo y remodelaciones en la costa de
          Salinas, Ecuador.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="relative z-10 mx-auto mb-10 flex flex-col items-center gap-2 text-hueso/60"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
          Desplázate
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: EASE_OUT }}
          className="h-8 w-px bg-hueso/60"
        />
      </motion.div>
    </section>
  );
}
