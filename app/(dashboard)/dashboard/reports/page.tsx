import Link from "next/link";
import { FolderKanban, Megaphone, Users, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";

const REPORTS = [
  { type: "comercial", title: "Reporte comercial", desc: "Leads, fuente, estado y valor estimado.", icon: Users },
  { type: "financiero", title: "Reporte financiero", desc: "Pagos, cobros y vencimientos por proyecto.", icon: Wallet },
  { type: "proyectos", title: "Reporte de proyectos", desc: "Avance, estado y entregas de todos los proyectos.", icon: FolderKanban },
  { type: "marketing", title: "Reporte de marketing", desc: "Rendimiento por fuente de adquisición.", icon: Megaphone },
] as const;

export default function ReportsPage() {
  return (
    <div>
      <PageHeader eyebrow="Inteligencia" title="Reportes" />

      <div>
        {REPORTS.map((report) => (
          <div key={report.type} className="flex items-center justify-between gap-8 border-b border-filete px-12 py-6">
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-azul/10 text-azul">
                <report.icon size={16} strokeWidth={1.75} aria-hidden="true" />
              </span>
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
