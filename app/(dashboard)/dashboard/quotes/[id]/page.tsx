import Link from "next/link";
import { Printer } from "lucide-react";
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
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-carbon/50">
            <Link href={`/dashboard/projects/${quote.project_id}`} className="transition-colors hover:text-naranja">
              {quote.projects?.clients?.name} — {quote.projects?.name}
            </Link>
          </p>
          <h1 className="font-display text-2xl text-carbon">
            Cotización del {new Date(quote.issue_date).toLocaleDateString("es-EC")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/quotes/${id}/print`} target="_blank" className={buttonClass("secondary", "sm")}>
            <Printer size={14} strokeWidth={1.75} aria-hidden="true" />
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

      <Section title="Ítems">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-left text-xs uppercase tracking-wide text-carbon/40">
              <th className="pb-2">Descripción</th>
              <th className="pb-2 text-right">Cantidad</th>
              <th className="pb-2 text-right">Precio unit.</th>
              <th className="pb-2 text-right">Total</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
              >
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-right font-mono">{item.quantity}</td>
                <td className="py-2.5 text-right font-mono">{currency.format(item.unit_price)}</td>
                <td className="py-2.5 text-right font-mono">{currency.format(item.quantity * item.unit_price)}</td>
                <td className="py-2.5 text-right">
                  <form action={deleteQuoteItem.bind(null, id, item.id)}>
                    <SubmitButton variant="danger" size="sm" className="normal-case tracking-normal">
                      Eliminar
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-sm text-carbon/40">
                  Sin ítems todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <form action={boundAddItem} className="mt-4 grid grid-cols-4 gap-2">
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

        <div className="mt-6 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-carbon/60">Subtotal</span>
              <span className="font-mono">{currency.format(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-carbon/60">Descuento</span>
              <span className="font-mono">-{currency.format(quote.discount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-carbon/60">Impuesto ({quote.tax_rate}%)</span>
              <span className="font-mono">{currency.format(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-carbon/10 py-2 font-medium">
              <span>Total</span>
              <span className="font-mono">{currency.format(total)}</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Detalles">
        <form action={boundUpdateMeta} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
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
          <div className="col-span-2 flex flex-col gap-1.5">
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
  );
}
