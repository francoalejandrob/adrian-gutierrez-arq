import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass, selectClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import { createEvent, deleteEvent } from "./actions";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default async function CalendarPage(props: PageProps<"/dashboard/calendar">) {
  const searchParams = await props.searchParams;
  const yearParam = Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year;
  const monthParam = Array.isArray(searchParams.month) ? searchParams.month[0] : searchParams.month;
  const now = new Date();
  const year = Number(yearParam) || now.getFullYear();
  const month = monthParam ? Number(monthParam) - 1 : now.getMonth();

  const supabase = await createClient();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [{ data: events }, { data: projects }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*, projects(name)")
      .gte("starts_at", monthStart.toISOString())
      .lt("starts_at", monthEnd.toISOString())
      .order("starts_at"),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  const eventsByDay = new Map<number, typeof events>();
  for (const event of events ?? []) {
    const day = new Date(event.starts_at).getDate();
    eventsByDay.set(day, [...(eventsByDay.get(day) ?? []), event]);
  }

  // Monday-first grid, including the leading/trailing days from adjacent months as blanks.
  const firstWeekday = (monthStart.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = monthEnd.getDate() === 1 ? new Date(year, month + 1, 0).getDate() : monthEnd.getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = month === 0 ? { year: year - 1, month: 12 } : { year, month };
  const nextMonth = month === 11 ? { year: year + 1, month: 1 } : { year, month: month + 2 };
  const todayMatches = now.getFullYear() === year && now.getMonth() === month;

  return (
    <div>
      <PageHeader
        eyebrow="Producción"
        title="Agenda"
        action={
          <div className="flex items-center gap-5">
            <Link
              href={`/dashboard/calendar?year=${prevMonth.year}&month=${prevMonth.month}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-concreto transition-colors hover:bg-[#EDEBE4] hover:text-tinta"
            >
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <span className="font-dp-mono text-[12px] uppercase tracking-[0.1em] text-tinta">
              {MONTH_NAMES[month]} {year}
            </span>
            <Link
              href={`/dashboard/calendar?year=${nextMonth.year}&month=${nextMonth.month}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-concreto transition-colors hover:bg-[#EDEBE4] hover:text-tinta"
            >
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        }
      />

      <form action={createEvent} className="grid grid-cols-2 gap-2.5 border-b border-filete px-12 py-6 sm:grid-cols-5">
        <input name="title" placeholder="Título de la reunión" required className={`col-span-2 ${inputClass}`} />
        <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        <input name="time" type="time" defaultValue="09:00" className={inputClass} />
        <select name="project_id" className={selectClass}>
          <option value="">Sin proyecto</option>
          {(projects ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-2 w-fit sm:col-span-5">
          Agregar evento
        </SubmitButton>
      </form>

      <div className="px-12 py-8">
        <div className="dp-card grid grid-cols-7">
          {DAY_LABELS.map((label) => (
            <div key={label} className="border-b border-r border-filete px-2 py-2 text-center font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">
              {label}
            </div>
          ))}
          {cells.map((day, i) => (
            <div key={i} className={`min-h-[92px] border-b border-r border-filete p-2 ${day === null ? "bg-[#EDEBE4]" : ""}`}>
              {day !== null && (
                <>
                  <span
                    className={`font-dp-mono text-[11.5px] ${
                      todayMatches && day === now.getDate() ? "text-acento" : "text-concreto"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {(eventsByDay.get(day) ?? []).map((event) => (
                      <form key={event.id} action={deleteEvent.bind(null, event.id)}>
                        <button
                          type="submit"
                          title="Eliminar evento"
                          className="w-full cursor-pointer truncate border-l-2 border-tinta bg-superficie px-1.5 py-0.5 text-left font-dp-sans text-[10.5px] text-grafito transition-colors hover:border-acento hover:text-acento"
                        >
                          {new Date(event.starts_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} {event.title}
                        </button>
                      </form>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
