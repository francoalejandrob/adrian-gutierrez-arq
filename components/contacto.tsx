import Image from "next/image";
import ContactoForm from "@/components/contacto-form";
import RevealText from "@/components/reveal-text";
import { studio } from "@/lib/content";

export default function Contacto() {
  return (
    <section id="contacto" className="bg-carbon py-20 text-hueso md:py-28">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 px-6 md:grid-cols-12 md:px-10">
        <div className="relative min-h-[420px] overflow-hidden md:col-span-5">
          <Image
            src="/proyectos/villa-atardecer.jpg"
            alt="Villa Atardecer, uno de los proyectos del estudio"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/10 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h2 className="font-display text-3xl sm:text-4xl">
              <RevealText text="Conversemos sobre tu próximo proyecto." />
            </h2>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-hueso/70">
              Cuéntanos qué necesitas y te contactaremos para agendar una
              primera conversación.
            </p>
            <div className="mt-8 flex flex-col gap-2 text-base text-hueso/80">
              <a
                href={`mailto:${studio.email}`}
                className="w-fit transition-colors hover:text-naranja"
              >
                {studio.email}
              </a>
              <span>{studio.location}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <ContactoForm />
        </div>
      </div>
    </section>
  );
}
