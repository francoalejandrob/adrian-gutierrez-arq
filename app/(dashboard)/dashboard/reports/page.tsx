import Link from "next/link";
import PageHeader from "@/components/dashboard/ui/page-header";

const REPORTS = [
  { type: "comercial", title: "Reporte comercial", desc: "Leads, fuente, estado y valor estimado." },
  { type: "financiero", title: "Reporte financiero", desc: "Pagos, cobros y vencimientos por proyecto." },
  { type: "proyectos", title: "Reporte de proyectos", desc: "Avance, estado y entregas de todos los proyectos." },
  { type: "marketing", title: "Reporte de marketing", desc: "Rendimiento por fuente de adquisición." },
] as const;

export default function ReportsPage() {
  return (
    <div>
      <PageHeader eyebrow="Inteligencia" title="Reportes" />

      <div>
        {REPORTS.map((report, i) => (
          <div key={report.type} className="flex items-center justify-between gap-8 border-b border-filete px-12 py-6">
            <div className="flex items-baseline gap-4">
              <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-dp-serif text-xl text-tinta">{report.title}</p>
                <p className="mt-1 font-dp-sans text-[12.5px] text-concreto">{report.desc}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-6 font-dp-mono text-[10px] uppercase tracking-[0.1em]">
              <Link
                href={`/dashboard/reports/${report.type}/print`}
                target="_blank"
                className="text-concreto hover:text-tinta"
              >
                PDF
              </Link>
              <a href={`/api/reports/${report.type}/csv`} className="text-concreto hover:text-tinta">
                CSV
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
