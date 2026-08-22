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
    <div className="mx-auto max-w-2xl bg-papel p-10 text-tinta">
      <div className="flex items-start justify-between border-b border-corte pb-6">
        <div>
          <p className="font-dp-serif text-2xl">Adrián Gutiérrez Arquitectura</p>
          <p className="mt-1.5 font-dp-mono text-[10px] uppercase tracking-[0.12em] text-concreto">Propuesta de honorarios</p>
        </div>
        <div className="text-right font-dp-mono text-[11px] text-concreto">
          <p>{new Date(quote.issue_date).toLocaleDateString("es-EC")}</p>
          {quote.valid_until && (
            <p>Válida hasta {new Date(quote.valid_until).toLocaleDateString("es-EC")}</p>
          )}
        </div>
      </div>

      <div className="mt-7 font-dp-sans text-[13px]">
        <p className="text-tinta">{quote.projects?.clients?.name}</p>
        <p className="text-concreto">{quote.projects?.name}</p>
        {quote.projects?.clients?.email && (
          <p className="text-concreto">{quote.projects.clients.email}</p>
        )}
      </div>

      <div className="mt-9">
        <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr] gap-4 border-b border-corte pb-2 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">
          <span>Descripción</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Precio unit.</span>
          <span className="text-right">Total</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[2fr_0.8fr_1fr_1fr] gap-4 border-b border-filete py-2.5 font-dp-sans text-[13px]">
            <span className="text-tinta">{item.description}</span>
            <span className="text-right font-dp-mono text-tinta">{item.quantity}</span>
            <span className="text-right font-dp-mono text-tinta">{currency.format(item.unit_price)}</span>
            <span className="text-right font-dp-mono text-tinta">{currency.format(item.quantity * item.unit_price)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <div className="w-64 font-dp-sans text-[13px]">
          <div className="flex justify-between py-1">
            <span className="text-concreto">Subtotal</span>
            <span className="font-dp-mono text-tinta">{currency.format(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-concreto">Descuento</span>
            <span className="font-dp-mono text-tinta">-{currency.format(quote.discount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-concreto">Impuesto ({quote.tax_rate}%)</span>
            <span className="font-dp-mono text-tinta">{currency.format(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-corte py-2.5">
            <span className="text-tinta">Total</span>
            <span className="font-dp-mono text-tinta">{currency.format(total)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-9 border-t border-filete pt-5 font-dp-sans text-[13px] text-grafito">
          <p className="mb-1.5 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Notas</p>
          <p>{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
