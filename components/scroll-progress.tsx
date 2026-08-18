"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const progress = useSpring(scrollYProgress, {
    stiffness: shouldReduceMotion ? 1000 : 120,
    damping: shouldReduceMotion ? 100 : 30,
    mass: 0.3,
  });

  return (
    <motion.div
      style={{ scaleX: progress }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-naranja"
      aria-hidden="true"
    />
  );
}
