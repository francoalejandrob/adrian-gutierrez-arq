"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export default function RevealText({
  text,
  className,
  delay = 0,
  once = true,
  triggerOnMount = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  once?: boolean;
  triggerOnMount?: boolean;
}) {
  const words = text.split(" ");

  return (
    <motion.span className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
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
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.span>
  );
}
