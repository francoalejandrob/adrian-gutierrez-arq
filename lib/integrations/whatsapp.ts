import "server-only";

// Real wiring against the WhatsApp Business Cloud API (Graph API), gated
// on config. Not exercised end-to-end (no test number yet). Nothing in
// the UI calls this yet this phase — it's the interface the plan asked
// for ("arquitectura preparada"), ready for whichever event ends up
// triggering it once there's a real business need.
//
// Constraint worth knowing before wiring a caller: a plain text message
// (as below) only delivers inside the 24h customer-initiated session
// window. Outside that window, Meta requires a pre-approved template
// message instead — a separate, more involved call this file doesn't
// implement yet.

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export type IntegrationResult<T> =
  | { configured: false; reason: string }
  | { configured: true; data: T };

export async function sendWhatsAppMessage(
  to: string,
  body: string,
): Promise<IntegrationResult<{ messageId: string }>> {
  if (!isWhatsAppConfigured()) {
    return {
      configured: false,
      reason:
        "Falta configurar WhatsApp Business Cloud API: WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID. Ver INTEGRATION_SETUP.md.",
    };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp Cloud API error (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { messages: { id: string }[] };
  return { configured: true, data: { messageId: data.messages[0]?.id ?? "" } };
}
