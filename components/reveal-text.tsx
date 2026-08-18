"use client";

import { ElementType, useMemo } from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export default function RevealText({
  text,
  as: Component = "span",
  className,
  delay = 0,
  once = true,
  triggerOnMount = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  once?: boolean;
  triggerOnMount?: boolean;
}) {
  const words = text.split(" ");
  const MotionComponent = useMemo(() => motion.create(Component), [Component]);

  return (
    <MotionComponent className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-top"
          aria-hidden="true"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            {...(triggerOnMount
              ? { animate: { y: "0%" } }
              : {
                  whileInView: { y: "0%" },
                  viewport: { once, margin: "-10%" },
                })}
            transition={{
              duration: 0.7,
              ease: EASE_OUT,
              delay: delay + i * 0.05,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </MotionComponent>
  );
}
