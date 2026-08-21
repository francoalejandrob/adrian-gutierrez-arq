"use client";

import Image from "next/image";
import Link from "next/link";
import ArrowIcon from "@/components/icons/arrow-icon";
import { useT } from "@/lib/i18n";

export default function ContactoCta() {
  const t = useT();

  return (
    <Link
      href="/#contacto"
      className="group relative block h-[70vh] min-h-[420px] w-full cursor-pointer overflow-hidden bg-carbon"
    >
      <Image
        src="/proyectos/vista-colina.jpg"
        alt="Vista de residencias contemporáneas sobre una colina"
        fill
        sizes="100vw"
        className="object-cover transition-transform duration-700 ease-out-strong group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-carbon/50 transition-colors duration-500 group-hover:bg-carbon/70" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="press inline-flex translate-y-2 items-center gap-3 border border-hueso bg-carbon/0 px-8 py-4 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-hueso opacity-0 transition-all duration-300 ease-out-strong group-hover:translate-y-0 group-hover:bg-hueso group-hover:text-carbon group-hover:opacity-100">
          {t.contactoCta.cta}
          <ArrowIcon className="h-4 w-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}
