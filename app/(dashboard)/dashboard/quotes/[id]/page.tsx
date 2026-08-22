import Link from "next/link";
import { notFound } from "next/navigation";
import StatusSelect from "@/components/dashboard/status-select";
import { buttonClass } from "@/components/dashboard/ui/button";
import Section from "@/components/dashboard/ui/section";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass, labelClass, textareaClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABELS, QUOTE_STATUSES, quoteTotal } from "@/lib/supabase/types";
import {
  addQuoteItem,
  deleteQuoteItem,
  updateQuoteMeta,
  updateQuoteStatus,
} from "../../projects/[id]/finance-actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function QuoteDetailPage(props: PageProps<"/dashboard/quotes/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_items(*), projects(id, name, clients(name))")
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();

  const items = [...quote.quote_items].sort((a, b) => a.position - b.position);
  const { subtotal, tax, total } = quoteTotal(items, quote.discount, quote.tax_rate);

  const boundUpdateStatus = updateQuoteStatus.bind(null, quote.project_id, id);
  const boundAddItem = addQuoteItem.bind(null, id);
  const boundUpdateMeta = updateQuoteMeta.bind(null, id);

  return (
    <div>
      <div className="border-b border-corte px-12 pb-[30px] pt-[52px]">
        <Link
          href="/dashboard/quotes"
          className="mb-[18px] inline-block font-dp-mono text-[10px] uppercase tracking-[0.14em] text-concreto hover:text-tinta"
        >
          ← Cotizaciones
        </Link>
        <div className="flex items-end justify-between gap-10">
          <div>
            <Link
              href={`/dashboard/projects/${quote.project_id}?tab=finance`}
              className="font-dp-mono text-[10px] uppercase tracking-[0.13em] text-concreto hover:text-tinta"
            >
              {quote.projects?.clients?.name} — {quote.projects?.name}
            </Link>
            <h1 className="mt-3 font-dp-serif text-[38px] leading-none tracking-[-0.015em] text-tinta">
              Cotización del {new Date(quote.issue_date).toLocaleDateString("es-EC")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/quotes/${id}/print`} target="_blank" className={buttonClass("secondary", "sm")}>
              Vista imprimible
            </Link>
            <StatusSelect
              action={boundUpdateStatus}
              defaultValue={quote.status}
              options={QUOTE_STATUSES.map((status) => ({
                value: status,
                label: QUOTE_STATUS_LABELS[status],
              }))}
            />
          </div>
        </div>
      </div>

      <div className="px-12 py-10">
        <Section title="Ítems">
          <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr] gap-4 border-b border-corte pb-3 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">
            <span>Descripción</span>
            <span className="text-right">Cantidad</span>
            <span className="text-right">Precio unit.</span>
            <span className="text-right">Total</span>
            <span></span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr] items-center gap-4 border-b border-filete py-3">
              <span className="font-dp-sans text-[13px] text-tinta">{item.description}</span>
              <span className="text-right font-dp-mono text-[12.5px] text-tinta">{item.quantity}</span>
              <span className="text-right font-dp-mono text-[12.5px] text-tinta">{currency.format(item.unit_price)}</span>
              <span className="text-right font-dp-mono text-[12.5px] text-tinta">{currency.format(item.quantity * item.unit_price)}</span>
              <form action={deleteQuoteItem.bind(null, id, item.id)} className="text-right">
                <SubmitButton variant="danger" size="sm">
                  Eliminar
                </SubmitButton>
              </form>
            </div>
          ))}
          {items.length === 0 && <p className="py-3 font-dp-sans text-sm text-concreto">Sin ítems todavía.</p>}

          <form action={boundAddItem} className="mt-5 grid grid-cols-4 gap-2.5">
            <input name="description" placeholder="Descripción" required className={`col-span-2 ${inputClass}`} />
            <input
              name="quantity"
              type="number"
              step="0.01"
              placeholder="Cantidad"
              defaultValue="1"
              className={inputClass}
            />
            <input
              name="unit_price"
              type="number"
              step="0.01"
              placeholder="Precio unitario"
              required
              className={inputClass}
            />
            <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
              Agregar ítem
            </SubmitButton>
          </form>

          <div className="mt-8 flex justify-end">
            <div className="w-64 font-dp-sans text-[13px]">
              <div className="flex justify-between py-1.5">
                <span className="text-concreto">Subtotal</span>
                <span className="font-dp-mono text-tinta">{currency.format(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-concreto">Descuento</span>
                <span className="font-dp-mono text-tinta">-{currency.format(quote.discount)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-concreto">Impuesto ({quote.tax_rate}%)</span>
                <span className="font-dp-mono text-tinta">{currency.format(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-corte py-2.5">
                <span className="text-tinta">Total</span>
                <span className="font-dp-mono text-tinta">{currency.format(total)}</span>
              </div>
            </div>
          </div>
        </Section>

        <div className="mt-10 border-t border-filete pt-10">
          <Section title="Detalles">
            <form action={boundUpdateMeta} className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="discount" className={labelClass}>
                  Descuento
                </label>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  step="0.01"
                  defaultValue={quote.discount}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="tax_rate" className={labelClass}>
                  Impuesto (%)
                </label>
                <input
                  id="tax_rate"
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  defaultValue={quote.tax_rate}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="valid_until" className={labelClass}>
                  Válida hasta
                </label>
                <input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  defaultValue={quote.valid_until ?? ""}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <label htmlFor="notes" className={labelClass}>
                  Notas
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={quote.notes ?? ""}
                  rows={3}
                  className={textareaClass}
                />
              </div>
              <SubmitButton size="md" pendingLabel="Guardando…" className="col-span-2 w-fit">
                Guardar
              </SubmitButton>
            </form>
          </Section>
        </div>
      </div>
    </div>
  );
}
