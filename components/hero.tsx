"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import RevealText from "@/components/reveal-text";
import { studio } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const scrollY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, 100],
  );
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-carbon text-hueso"
    >
      <motion.div
        style={{ y: scrollY }}
        className="absolute inset-0 -top-[10%] h-[120%]"
        aria-hidden="true"
      >
        {shouldReduceMotion ? (
          <Image
            src="/proyectos/casa-eg/1.jpg"
            alt=""
            fill
            priority
            className="object-cover"
          />
        ) : (
          <video
            className="h-full w-full scale-105 object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/videos/hero-banner.mp4" type="video/mp4" />
          </video>
        )}
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-carbon/45"
      />

      <motion.div
        style={{ opacity: heroOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-8 font-mono text-xs uppercase tracking-[0.25em] text-naranja"
        >
          {studio.location} · {studio.coordinates}
        </motion.p>
        <h1 className="font-display text-5xl leading-[1.15] tracking-normal sm:text-6xl md:text-7xl">
          <span className="block">
            <RevealText text="Diseñamos y construimos" triggerOnMount delay={0.15} />
          </span>
          <span className="block">
            <RevealText text="proyectos que buscan" triggerOnMount delay={0.3} />
          </span>
          <span className="block">
            <RevealText text="trascender." triggerOnMount delay={0.45} />
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE_OUT }}
          className="mt-8 max-w-xl text-xl text-hueso/85"
        >
          Arquitectura, diseño y construcción concebidos para crear espacios
          con identidad, propósito y permanencia.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        style={{ opacity: heroOpacity }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: EASE_OUT }}
          className="block h-10 w-px bg-hueso/50"
        />
      </motion.div>
    </section>
  );
}
