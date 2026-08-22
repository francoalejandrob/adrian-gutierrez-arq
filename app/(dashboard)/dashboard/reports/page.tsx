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
      <PageHeader title="Reportes" />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <div key={report.type} className="rounded-[10px] border border-carbon/[0.08] bg-white p-6">
            <p className="mb-1.5 font-display text-[17px] font-medium text-carbon">{report.title}</p>
            <p className="mb-[18px] text-[12.5px] text-carbon/50">{report.desc}</p>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/reports/${report.type}/print`}
                target="_blank"
                className="rounded-lg border border-carbon/15 px-3.5 py-1.5 text-xs text-carbon transition-colors duration-150 hover:border-carbon"
              >
                PDF
              </Link>
              <a
                href={`/api/reports/${report.type}/csv`}
                className="rounded-lg border border-carbon/15 px-3.5 py-1.5 text-xs text-carbon transition-colors duration-150 hover:border-carbon"
              >
                CSV
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
