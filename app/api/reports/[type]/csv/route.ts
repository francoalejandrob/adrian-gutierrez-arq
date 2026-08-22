import { NextResponse } from "next/server";
import { csvResponse, toCsv } from "@/lib/csv";
import { computeMarketingFunnel } from "@/lib/marketing";
import { createClient } from "@/lib/supabase/server";

const REPORT_TYPES = ["comercial", "financiero", "proyectos", "marketing"] as const;
type ReportType = (typeof REPORT_TYPES)[number];

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!REPORT_TYPES.includes(type as ReportType)) {
    return NextResponse.json({ error: "Tipo de reporte desconocido." }, { status: 404 });
  }

  const supabase = await createClient();

  // This route isn't covered by proxy.ts's matcher (only /dashboard/* and
  // /portal/* are), so it needs its own auth check — RLS alone would just
  // return an empty-but-200 CSV to an anonymous request instead of a 401.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (type === "comercial") {
    const { data: leads } = await supabase
      .from("leads")
      .select("name, email, phone, source, utm_source, status, estimated_value, created_at")
      .order("created_at", { ascending: false });

    const csv = toCsv(
      ["Nombre", "Email", "Teléfono", "Fuente", "UTM source", "Estado", "Valor estimado", "Creado"],
      (leads ?? []).map((l) => [l.name, l.email, l.phone, l.source, l.utm_source, l.status, l.estimated_value, l.created_at]),
    );
    return csvResponse("reporte-comercial.csv", csv);
  }

  if (type === "financiero") {
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, status, due_date, paid_date, method, reference, projects(name, clients(name))")
      .order("due_date", { ascending: false });

    const csv = toCsv(
      ["Cliente", "Proyecto", "Monto", "Estado", "Vence", "Pagado", "Método", "Referencia"],
      (payments ?? []).map((p) => [
        p.projects?.clients?.name,
        p.projects?.name,
        p.amount,
        p.status,
        p.due_date,
        p.paid_date,
        p.method,
        p.reference,
      ]),
    );
    return csvResponse("reporte-financiero.csv", csv);
  }

  if (type === "proyectos") {
    const { data: projects } = await supabase
      .from("projects")
      .select("name, status, progress, category, clients(name), estimated_end_date, created_at")
      .order("created_at", { ascending: false });

    const csv = toCsv(
      ["Proyecto", "Cliente", "Categoría", "Estado", "Progreso", "Entrega estimada", "Creado"],
      (projects ?? []).map((p) => [p.name, p.clients?.name, p.category, p.status, `${p.progress}%`, p.estimated_end_date, p.created_at]),
    );
    return csvResponse("reporte-proyectos.csv", csv);
  }

  // marketing
  const [{ data: leads }, { data: clients }, { data: projects }, { data: contracts }] = await Promise.all([
    supabase.from("leads").select("id, source, utm_source, created_at"),
    supabase.from("clients").select("id, converted_from_lead_id"),
    supabase.from("projects").select("id, client_id"),
    supabase.from("contracts").select("project_id, value"),
  ]);
  const rows = computeMarketingFunnel({
    leads: leads ?? [],
    clients: clients ?? [],
    projects: projects ?? [],
    contracts: contracts ?? [],
  });

  const csv = toCsv(
    ["Fuente", "Leads", "Clientes", "Proyectos", "Ingresos contratados"],
    rows.map((r) => [r.source, r.leads, r.clients, r.projects, r.contractedValue]),
  );
  return csvResponse("reporte-marketing.csv", csv);
}
