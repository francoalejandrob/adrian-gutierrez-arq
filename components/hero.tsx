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
import { useLocale, useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";
import type { WebsiteContent } from "@/lib/website-content";

export default function Hero({ content }: { content?: WebsiteContent["hero"] }) {
  const t = useT();
  const { locale } = useLocale();
  const translatedHero = {
    location: "Salinas, Ecuador", coordinates: "2.21° S / 80.95° W",
    line1: t.hero.line1, line2: t.hero.line2, line3: t.hero.line3, subtext: t.hero.subtext,
  };
  const hero = locale === "es" && content ? content : translatedHero;
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
            poster="/videos/hero-poster.jpg"
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
          {hero.location} · {hero.coordinates}
        </motion.p>
        <h1 className="font-display text-5xl leading-[1.15] tracking-normal sm:text-6xl md:text-7xl">
          <span className="block">
            <RevealText text={hero.line1} triggerOnMount delay={0.15} />
          </span>
          <span className="block">
            <RevealText text={hero.line2} triggerOnMount delay={0.3} />
          </span>
          <span className="block">
            <RevealText text={hero.line3} triggerOnMount delay={0.45} />
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE_OUT }}
          className="mt-8 max-w-xl text-xl text-hueso/85"
        >
          {hero.subtext}
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
