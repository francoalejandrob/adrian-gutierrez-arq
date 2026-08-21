import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { quoteTotal } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function QuotePrintPage(props: PageProps<"/dashboard/quotes/[id]/print">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_items(*), projects(name, clients(name, email, phone))")
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();

  const items = [...quote.quote_items].sort((a, b) => a.position - b.position);
  const { subtotal, tax, total } = quoteTotal(items, quote.discount, quote.tax_rate);

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-carbon">
      <div className="flex items-start justify-between border-b border-carbon/20 pb-6">
        <div>
          <p className="font-display text-xl">Adrián Gutiérrez Arquitectura</p>
          <p className="mt-1 text-sm text-carbon/60">Cotización</p>
        </div>
        <div className="text-right text-sm text-carbon/60">
          <p>{new Date(quote.issue_date).toLocaleDateString("es-EC")}</p>
          {quote.valid_until && (
            <p>Válida hasta {new Date(quote.valid_until).toLocaleDateString("es-EC")}</p>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm">
        <p className="font-medium">{quote.projects?.clients?.name}</p>
        <p className="text-carbon/60">{quote.projects?.name}</p>
        {quote.projects?.clients?.email && (
          <p className="text-carbon/60">{quote.projects.clients.email}</p>
        )}
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-carbon/20 text-left text-xs uppercase tracking-wide text-carbon/50">
            <th className="pb-2">Descripción</th>
            <th className="pb-2 text-right">Cantidad</th>
            <th className="pb-2 text-right">Precio unit.</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-carbon/10">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right font-mono">{item.quantity}</td>
              <td className="py-2 text-right font-mono">{currency.format(item.unit_price)}</td>
              <td className="py-2 text-right font-mono">{currency.format(item.quantity * item.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
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
          <div className="flex justify-between border-t border-carbon/20 py-2 font-medium">
            <span>Total</span>
            <span className="font-mono">{currency.format(total)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-8 border-t border-carbon/10 pt-4 text-sm text-carbon/70">
          <p className="mb-1 text-xs uppercase tracking-wide text-carbon/40">Notas</p>
          <p>{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
