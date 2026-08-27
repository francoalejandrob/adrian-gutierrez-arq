import { NextResponse } from "next/server";
import { notifyStudio } from "@/lib/notifications";
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, getResendClient } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  need?: string;
  message?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_page?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const phone = payload.phone?.trim() ?? "";
  const location = payload.location?.trim() ?? "";
  const need = payload.need?.trim() ?? "";
  const message = payload.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Nombre, email y mensaje son obligatorios." },
      { status: 400 },
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json(
      { error: "El email no es válido." },
      { status: 400 },
    );
  }

  // Best-effort: create the lead in ARCHI.OS. Never blocks or fails the
  // email send below — if Supabase is down, the lead just isn't recorded,
  // but the studio still gets the email like before.
  try {
    const organizationId = process.env.ARCHIOS_ORGANIZATION_ID;
    if (!organizationId) {
      throw new Error("ARCHIOS_ORGANIZATION_ID is not configured");
    }

    const supabase = createAdminClient();
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();

    if (organization) {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          organization_id: organization.id,
          name,
          email,
          phone: phone || null,
          location: location || null,
          need: need || null,
          message,
          source: "web",
          utm_source: payload.utm_source || null,
          utm_medium: payload.utm_medium || null,
          utm_campaign: payload.utm_campaign || null,
          utm_term: payload.utm_term || null,
          utm_content: payload.utm_content || null,
          landing_page: payload.landing_page || null,
        })
        .select("id")
        .single();
      if (leadError) console.error("Lead insert error:", leadError);

      // Best-effort in-app notification. No email here — the studio
      // already gets the email below (this branch would just duplicate it).
      if (lead) {
        await notifyStudio({
          organizationId: organization.id,
          type: "lead.created",
          title: `Nuevo lead: ${name}`,
          body: message,
          entityType: "lead",
          entityId: lead.id,
          email: false,
        });
      }
    }
  } catch (error) {
    console.error("Lead insert failed:", error);
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: `Formulario web <${CONTACT_FROM_EMAIL}>`,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Nueva solicitud de contacto — ${name}`,
      html: `
        <h2>Nueva solicitud desde el sitio web</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(phone || "No proporcionado")}</p>
        <p><strong>Ciudad y país del proyecto:</strong> ${escapeHtml(location || "No especificado")}</p>
        <p><strong>¿Qué necesita?:</strong> ${escapeHtml(need || "No especificado")}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "No se pudo enviar el mensaje. Intenta de nuevo más tarde." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact route error:", error);
    return NextResponse.json(
      { error: "El servidor no está configurado para enviar correos todavía." },
      { status: 500 },
    );
  }
}
