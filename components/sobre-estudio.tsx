"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import BlueprintArt, { BlueprintVariant } from "@/components/blueprint-art";
import { architectBio as architectBioEs, studio } from "@/lib/content";
import { architectBioEn, useLocale, useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";

const detailStripArt: BlueprintVariant[] = [
  "estudio",
  "materiales",
  "luz",
  "sostenibilidad",
];

export default function SobreEstudio() {
  const t = useT();
  const { locale } = useLocale();
  const architectBio = locale === "es" ? architectBioEs : architectBioEn;

  return (
    <section id="estudio" className="bg-carbon py-14 text-hueso md:py-20">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="md:col-span-4"
          >
            <div className="flex h-40 w-40 items-center justify-center border border-hueso/20 p-8 transition-colors duration-300 hover:border-naranja">
              <Image
                src="/logo-icon.png"
                alt=""
                width={480}
                height={473}
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-hueso/60">
              {studio.name}
            </p>
            <p className="text-base text-hueso/60">{t.sobreEstudio.role}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
            className="md:col-span-8"
          >
            <blockquote className="font-display text-3xl italic leading-[1.3] text-hueso sm:text-4xl">
              &ldquo;{architectBio.quote}&rdquo;
            </blockquote>
            {architectBio.bio.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="mt-6 max-w-2xl text-lg leading-relaxed text-hueso/80"
              >
                {paragraph}
              </p>
            ))}
          </motion.div>
        </div>

        <div className="mt-20 flex gap-px overflow-x-auto border border-hueso/10 bg-hueso/10">
          {t.sobreEstudio.detailStrip.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
              className="group flex min-w-[220px] flex-1 flex-col items-center gap-4 bg-carbon px-6 py-10 transition-colors duration-300 hover:bg-hueso/5"
            >
              <div className="transition-transform duration-300 ease-out-strong group-hover:scale-110">
                <BlueprintArt
                  variant={detailStripArt[i]}
                  className="h-14 w-14"
                  strokeClassName="text-hueso/60"
                />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/60">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
