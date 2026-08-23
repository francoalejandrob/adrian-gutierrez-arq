import { FolderKanban } from "lucide-react";
import Avatar from "@/components/dashboard/ui/avatar";
import BarChart from "@/components/dashboard/ui/bar-chart";
import DonutChart from "@/components/dashboard/ui/donut-chart";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import Sparkline from "@/components/dashboard/ui/sparkline";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import StatusMark from "@/components/dashboard/ui/status-mark";
import Button from "@/components/dashboard/ui/button";

const PALETTE = [
  { name: "Papel", hex: "#0B0B0D", role: "Fondo" },
  { name: "Superficie", hex: "#17171C", role: "Campos y paneles" },
  { name: "Filete", hex: "#26262C", role: "Separador fino" },
  { name: "Corte", hex: "#38383F", role: "Separador mayor" },
  { name: "Concreto", hex: "#918D85", role: "Metadatos" },
  { name: "Grafito", hex: "#C7C4BB", role: "Texto secundario" },
  { name: "Tinta", hex: "#F4F3EF", role: "Texto y acción" },
  { name: "Acento", hex: "#E2564A", role: "Atención" },
  { name: "Verde", hex: "#5FAE82", role: "Resuelto / positivo" },
  { name: "Ámbar", hex: "#D9A05A", role: "Advertencia / en curso" },
  { name: "Azul", hex: "#7A9DBD", role: "Informativo" },
  { name: "Realce", hex: "#201F24", role: "Fondo de hover / activo" },
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

const DONUT_SAMPLE = [
  { label: "Completados", value: 8, colorClass: "stroke-verde" },
  { label: "En curso", value: 5, colorClass: "stroke-azul" },
  { label: "Pausados", value: 2, colorClass: "stroke-ambar" },
];

const BAR_SAMPLE = [
  { label: "Referidos", value: 12, colorClass: "bg-tinta" },
  { label: "Instagram", value: 8, colorClass: "bg-tinta/72" },
  { label: "Website", value: 5, colorClass: "bg-tinta/52" },
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
          <p className="mb-6 max-w-[65ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            Pase oscuro sobre una referencia de dashboard SaaS que trajo el usuario: los mismos 11 tokens
            semánticos (más <span className="font-dp-mono text-[12px]">Realce</span>, nuevo) se recalibraron a
            fondo oscuro — contraste verificado con la fórmula WCAG real antes de fijar los valores, no a ojo.{" "}
            <span className="font-dp-mono text-[12px]">Tinta</span> y{" "}
            <span className="font-dp-mono text-[12px]">Papel</span> intercambian claridad porque en el código
            existente <span className="font-dp-mono text-[12px]">bg-tinta</span> siempre viene emparejado con{" "}
            <span className="font-dp-mono text-[12px]">text-papel</span>.
          </p>
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
          <p className="mb-6 max-w-[65ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            5 tonos con significado fijo, reusados en pastillas (<span className="font-dp-mono text-[12px]">StatusBadge</span>),
            marcas de línea de tiempo (<span className="font-dp-mono text-[12px]">StatusMark</span>) y gráficos —
            <span className="text-verde"> resuelto</span>,{" "}
            <span className="text-acento">atención</span>,{" "}
            <span className="text-ambar">advertencia</span>,{" "}
            <span className="text-azul">informativo</span> y{" "}
            <span className="text-concreto">neutral</span> — cada dominio (lead, proyecto, tarea, cotización,
            contrato, pago) mapea sus estados reales a estos 5 tonos una sola vez, en{" "}
            <span className="font-dp-mono text-[12px]">lib/supabase/types.ts</span>.
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <StatusBadge label="Ganado" tone="resolved" />
            <StatusBadge label="Negociación" tone="warning" />
            <StatusBadge label="Nuevo" tone="info" />
            <StatusBadge label="Cancelado" tone="attention" />
            <StatusBadge label="Borrador" tone="neutral" />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-5">
            <div className="flex items-center gap-3">
              <StatusMark tone="resolved" />
              <span className="font-dp-sans text-[12px] text-concreto">resuelto</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusMark tone="pending" />
              <span className="font-dp-sans text-[12px] text-concreto">pendiente</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusMark tone="attention" />
              <span className="font-dp-sans text-[12px] text-concreto">atención</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusMark tone="historic" />
              <span className="font-dp-sans text-[12px] text-concreto">histórico</span>
            </div>
          </div>
        </Section>

        <Section title="04 · Retícula y tarjetas">
          <p className="max-w-[65ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            12 columnas, márgenes de lámina de 48px, medianil de 22px. Cada bloque de contenido es una tarjeta
            delimitada — borde fino, esquina de 16px, sombra suave (clase compartida{" "}
            <span className="font-dp-mono text-[12px]">.dp-card</span>) — en vez de solo separadores de 1px; los
            separadores siguen usándose dentro de una tarjeta, para las filas de una lista o tabla. Cuando varias
            estadísticas van juntas (KPIs, resumen financiero), cada una es su propia tarjeta con gap real entre
            ellas — nunca varias estadísticas compartiendo una tarjeta dividida por líneas internas.
          </p>
        </Section>

        <Section title="05 · Iconos y avatares">
          <p className="mb-6 max-w-[65ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            <span className="font-dp-mono text-[12px]">lucide-react</span>, trazo 1.75px, en nav, header, botones y
            estados vacíos. Los avatares son iniciales sobre un color determinístico por nombre — nunca una foto
            genérica ni un ícono de persona — reusados donde el dato es una persona real (asignado, contacto,
            miembro del equipo).
          </p>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <Avatar name="Adrián Gutiérrez" />
              <span className="font-dp-sans text-[12.5px] text-concreto">Avatar</span>
            </div>
            <EmptyState icon={FolderKanban} title="Ejemplo de estado vacío" />
          </div>
        </Section>

        <Section title="06 · Gráficos">
          <p className="mb-6 max-w-[65ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            SVG a mano (sin librería) para que el estilo coincida exacto con el resto del sistema —{" "}
            <span className="font-dp-mono text-[12px]">DonutChart</span> (máximo ~5-6 rebanadas, cada una con su
            valor como texto) y <span className="font-dp-mono text-[12px]">BarChart</span> (más categorías, valores
            siempre visibles). Categorías con un tono de estado real reusan la paleta de la sección 03; categorías
            sin significado (fuente de lead, canal de tráfico) usan una escala ordinal de un solo color.
          </p>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <DonutChart data={DONUT_SAMPLE} centerValue="15" centerLabel="Total" />
            <BarChart data={BAR_SAMPLE} />
          </div>
          <div className="mt-8 flex items-center gap-3">
            <Sparkline data={[2, 3, 2, 4, 5, 4, 6]} />
            <span className="font-dp-sans text-[12.5px] text-concreto">
              Sparkline — solo en tarjetas con un log real detrás (created_at/paid_date); nunca una tendencia inventada.
            </span>
          </div>
        </Section>

        <Section title="07 · Componentes">
          <p className="mb-6 max-w-[65ch] font-dp-sans text-[13.5px] leading-relaxed text-grafito">
            Los botones primario y secundario llevan una sombra suave y sutil (no la sombra apilada del pase
            anterior) — más cercana a una interfaz SaaS pulida.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary">Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="tertiary">Terciario</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Section>

        <Section title="08 · Breakpoints">
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
