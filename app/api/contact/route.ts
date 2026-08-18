import { NextResponse } from "next/server";
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, getResendClient } from "@/lib/resend";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  need?: string;
  message?: string;
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
