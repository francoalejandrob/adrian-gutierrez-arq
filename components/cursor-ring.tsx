"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, [data-cursor-hover]";
const RING_SIZE = 24;

export default function CursorRing() {
  const shouldReduceMotion = useReducedMotion();
  const [pointerFine] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const enabled = pointerFine && !shouldReduceMotion;
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 400, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 400, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;

    function handleMove(event: MouseEvent) {
      x.set(event.clientX - RING_SIZE / 2);
      y.set(event.clientY - RING_SIZE / 2);
      setVisible(true);
      const target = event.target as HTMLElement;
      setHovering(Boolean(target.closest(INTERACTIVE_SELECTOR)));
    }

    function handleLeave() {
      setVisible(false);
    }

    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      style={{ x: springX, y: springY, width: RING_SIZE, height: RING_SIZE }}
      animate={{
        scale: hovering ? 2.2 : 1,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="pointer-events-none fixed left-0 top-0 z-[70] rounded-full border border-naranja mix-blend-difference"
      aria-hidden="true"
    />
  );
}
