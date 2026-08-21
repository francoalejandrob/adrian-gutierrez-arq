import Link from "next/link";
import { notFound } from "next/navigation";
import StatusSelect from "@/components/dashboard/status-select";
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
            <Link href={`/dashboard/projects/${quote.project_id}`} className="hover:text-naranja">
              {quote.projects?.clients?.name} — {quote.projects?.name}
            </Link>
          </p>
          <h1 className="font-display text-2xl text-carbon">
            Cotización del {new Date(quote.issue_date).toLocaleDateString("es-EC")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/quotes/${id}/print`}
            target="_blank"
            className="cursor-pointer border border-carbon px-4 py-2 text-xs uppercase tracking-wide text-carbon transition-colors hover:bg-carbon hover:text-white"
          >
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

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Ítems</h2>
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
              <tr key={item.id} className="border-b border-carbon/5">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{currency.format(item.unit_price)}</td>
                <td className="py-2 text-right">{currency.format(item.quantity * item.unit_price)}</td>
                <td className="py-2 text-right">
                  <form action={deleteQuoteItem.bind(null, id, item.id)}>
                    <button
                      type="submit"
                      className="cursor-pointer text-xs text-carbon/40 hover:text-red-600"
                    >
                      Eliminar
                    </button>
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
          <input
            name="description"
            placeholder="Descripción"
            required
            className="col-span-2 border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
          />
          <input
            name="quantity"
            type="number"
            step="0.01"
            placeholder="Cantidad"
            defaultValue="1"
            className="border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
          />
          <input
            name="unit_price"
            type="number"
            step="0.01"
            placeholder="Precio unitario"
            required
            className="border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
          />
          <button
            type="submit"
            className="col-span-4 w-fit cursor-pointer border border-carbon px-4 py-2 text-xs uppercase tracking-wide text-carbon transition-colors hover:bg-carbon hover:text-white"
          >
            Agregar ítem
          </button>
        </form>

        <div className="mt-6 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-carbon/60">Subtotal</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-carbon/60">Descuento</span>
              <span>-{currency.format(quote.discount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-carbon/60">Impuesto ({quote.tax_rate}%)</span>
              <span>{currency.format(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-carbon/10 py-2 font-medium">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Detalles</h2>
        <form action={boundUpdateMeta} className="grid grid-cols-2 gap-3">
          <label className="text-xs text-carbon/60">
            Descuento
            <input
              name="discount"
              type="number"
              step="0.01"
              defaultValue={quote.discount}
              className="mt-1 w-full border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
            />
          </label>
          <label className="text-xs text-carbon/60">
            Impuesto (%)
            <input
              name="tax_rate"
              type="number"
              step="0.01"
              defaultValue={quote.tax_rate}
              className="mt-1 w-full border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
            />
          </label>
          <label className="text-xs text-carbon/60">
            Válida hasta
            <input
              name="valid_until"
              type="date"
              defaultValue={quote.valid_until ?? ""}
              className="mt-1 w-full border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
            />
          </label>
          <label className="col-span-2 text-xs text-carbon/60">
            Notas
            <textarea
              name="notes"
              defaultValue={quote.notes ?? ""}
              rows={3}
              className="mt-1 w-full border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
            />
          </label>
          <button
            type="submit"
            className="col-span-2 w-fit cursor-pointer border border-carbon px-4 py-2 text-xs uppercase tracking-wide text-carbon transition-colors hover:bg-carbon hover:text-white"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
