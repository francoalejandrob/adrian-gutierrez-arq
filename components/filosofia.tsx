"use client";

import { motion } from "framer-motion";
import BlueprintArt, { BlueprintVariant } from "@/components/blueprint-art";
import RevealText from "@/components/reveal-text";
import { philosophy } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";

const ART_BY_WORD: Record<string, BlueprintVariant> = {
  Luz: "luz",
  Materiales: "materiales",
  Naturaleza: "naturaleza",
  Sostenibilidad: "sostenibilidad",
};

export default function Filosofia() {
  return (
    <section id="filosofia" className="bg-hueso py-32 text-carbon md:py-44">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <h2 className="max-w-2xl font-display text-3xl sm:text-4xl md:text-5xl">
          <RevealText text="Arquitectura de lujo sostenible, pensada desde cuatro principios." />
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-carbon/10 bg-carbon/10 sm:grid-cols-2 lg:grid-cols-4">
          {philosophy.map((item, i) => (
            <motion.div
              key={item.word}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT }}
              className="group flex flex-col gap-8 bg-hueso p-8 transition-colors duration-300 hover:bg-arena/50"
            >
              <div className="transition-transform duration-300 ease-out-strong group-hover:-translate-y-1.5">
                <BlueprintArt
                  variant={ART_BY_WORD[item.word]}
                  className="h-16 w-16"
                  strokeClassName="text-naranja"
                />
              </div>
              <div>
                <h3 className="font-display text-2xl text-carbon">
                  {item.word}
                </h3>
                <p className="mt-3 text-base text-piedra">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
