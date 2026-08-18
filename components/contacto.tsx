import ContactoForm from "@/components/contacto-form";
import { studio } from "@/lib/content";

export default function Contacto() {
  return (
    <section id="contacto" className="bg-carbon py-28 text-hueso md:py-36">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 md:grid-cols-12 md:px-10">
        <div className="md:col-span-4">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-naranja">
            Contacto
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            Conversemos sobre tu próximo proyecto.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-hueso/60">
            Cuéntanos qué necesitas y te contactaremos para agendar una
            primera conversación.
          </p>
          <div className="mt-10 flex flex-col gap-2 text-sm text-hueso/70">
            <a
              href={`mailto:${studio.email}`}
              className="transition-colors hover:text-naranja"
            >
              {studio.email}
            </a>
            <span>{studio.location}</span>
          </div>
        </div>

        <div className="md:col-span-8">
          <ContactoForm />
        </div>
      </div>
    </section>
  );
}
