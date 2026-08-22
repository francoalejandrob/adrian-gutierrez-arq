import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import StatusMark from "@/components/dashboard/ui/status-mark";
import Button from "@/components/dashboard/ui/button";

const PALETTE = [
  { name: "Papel", hex: "#F4F3EF", role: "Fondo" },
  { name: "Superficie", hex: "#FAF9F5", role: "Campos y paneles" },
  { name: "Filete", hex: "#DDDAD1", role: "Separador fino" },
  { name: "Corte", hex: "#C7C3B7", role: "Separador mayor" },
  { name: "Concreto", hex: "#8A867C", role: "Metadatos" },
  { name: "Grafito", hex: "#45443F", role: "Texto secundario" },
  { name: "Tinta", hex: "#0F0F0E", role: "Texto y acción" },
  { name: "Acento", hex: "#A8382A", role: "Tinta de revisión — atención" },
  { name: "Verde", hex: "#3F6B52", role: "Resuelto / positivo — segundo color del sistema" },
];

const TYPE_SPECIMENS = [
  { label: "Instrument Serif", sample: "El estudio como sistema.", className: "font-dp-serif text-4xl" },
  { label: "Archivo", sample: "Comercial, producción, documentación y finanzas.", className: "font-dp-sans text-base" },
  { label: "JetBrains Mono", sample: "01 · CIFRAS · ETIQUETAS · METADATOS", className: "font-dp-mono text-sm uppercase tracking-[0.1em]" },
];

const BREAKPOINTS = [
  { name: "sm", value: "640px" },
  { name: "md", value: "768px" },
  { name: "lg", value: "1024px" },
  { name: "xl", value: "1280px" },
];

export default function DesignSystemPage() {
  return (
    <div>
      <PageHeader eyebrow="Sistema" title="Design system" />

      <div className="flex flex-col gap-14 px-12 py-10">
        <Section title="01 · Tipografía">
          <div className="flex flex-col gap-7">
            {TYPE_SPECIMENS.map((spec) => (
              <div key={spec.label} className="border-b border-filete pb-7 last:border-0">
                <p className="mb-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">{spec.label}</p>
                <p className={`${spec.className} text-tinta`}>{spec.sample}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="02 · Paleta">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {PALETTE.map((color) => (
              <div key={color.name}>
                <div className="h-16 w-full rounded-xl border border-filete" style={{ backgroundColor: color.hex }} />
                <p className="mt-2.5 font-dp-sans text-[13px] text-tinta">{color.name}</p>
                <p className="font-dp-mono text-[11px] text-concreto">{color.hex}</p>
                <p className="mt-0.5 font-dp-sans text-[11.5px] text-concreto">{color.role}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="03 · Disciplina de estado">
          <p className="mb-6 max-w-[60ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            Una sola gramática en todo el producto: relleno verde = resuelto, hueco = pendiente, rombo rojo =
            requiere atención. Los estados nombrados siguen siendo texto con color/peso — nunca una pastilla con
            fondo — y las marcas geométricas se usan aparte para líneas de tiempo, versiones y prioridades. Verde y
            acento son los dos únicos colores con significado; todo lo demás en la interfaz es tinta/grafito/concreto.
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge label="Ganado" tone="resolved" />
              <span className="font-dp-sans text-[12px] text-concreto">texto — resuelto</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge label="Negociación" tone="attention" />
              <span className="font-dp-sans text-[12px] text-concreto">texto — atención</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge label="Nuevo" tone="neutral" />
              <span className="font-dp-sans text-[12px] text-concreto">texto — neutral</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-5">
            <div className="flex items-center gap-3">
              <StatusMark tone="resolved" />
              <span className="font-dp-sans text-[12px] text-concreto">cuadrado relleno — resuelto</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusMark tone="pending" />
              <span className="font-dp-sans text-[12px] text-concreto">cuadrado hueco — pendiente</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusMark tone="attention" />
              <span className="font-dp-sans text-[12px] text-concreto">rombo rojo — atención</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusMark tone="historic" />
              <span className="font-dp-sans text-[12px] text-concreto">cuadrado gris — histórico</span>
            </div>
          </div>
        </Section>

        <Section title="04 · Retícula y espaciado">
          <p className="max-w-[60ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            12 columnas, márgenes de lámina de 48px, medianil de 22px. Cada bloque de contenido es una tarjeta
            delimitada — borde fino, esquina de 16px, sombra suave (clase compartida <span className="font-dp-mono text-[12px]">.dp-card</span>) —
            en vez de solo separadores de 1px; los separadores siguen usándose dentro de una tarjeta, para las filas
            de una lista o tabla.
          </p>
        </Section>

        <Section title="05 · Componentes">
          <p className="mb-6 max-w-[60ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            Los botones primario y secundario llevan una sombra sólida sin desenfoque, apilada detrás del botón —
            lee como una tarjeta superpuesta, no como una sombra de SaaS genérica. Al presionar, el botón viaja hacia
            su propia sombra.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary">Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="tertiary">Terciario</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Section>

        <Section title="06 · Breakpoints">
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {BREAKPOINTS.map((bp) => (
              <div key={bp.name} className="flex items-baseline gap-2.5">
                <span className="font-dp-mono text-[12px] text-tinta">{bp.name}</span>
                <span className="font-dp-mono text-[11px] text-concreto">{bp.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
