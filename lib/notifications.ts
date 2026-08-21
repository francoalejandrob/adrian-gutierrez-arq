import "server-only";
import { createAdminClient } from "./supabase/admin";
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, getResendClient } from "./resend";

type NotifyInput = {
  organizationId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  email?: boolean;
};

// Called from trusted server code only (Server Actions, route handlers) —
// never from a Client Component. Uses the service-role client because the
// caller is very often a portal user, who isn't an organization_member and
// so has no RLS grant to write a row the studio will read. Both the DB
// insert and the email are best-effort: a notification failing to send
// must never break the mutation that triggered it (same rule as the lead
// email in api/contact/route.ts).
export async function notifyStudio({
  organizationId,
  type,
  title,
  body = null,
  entityType = null,
  entityId = null,
  email = true,
}: NotifyInput) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      organization_id: organizationId,
      type,
      title,
      body,
      entity_type: entityType,
      entity_id: entityId,
    });
    if (error) console.error("notifyStudio insert error:", error);
  } catch (error) {
    console.error("notifyStudio insert failed:", error);
  }

  if (!email) return;

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: `ARCHI.OS <${CONTACT_FROM_EMAIL}>`,
      to: CONTACT_TO_EMAIL,
      subject: title,
      html: `<p>${body ?? title}</p>`,
    });
    if (error) console.error("notifyStudio email error:", error);
  } catch (error) {
    console.error("notifyStudio email failed (RESEND_API_KEY missing?):", error);
  }
}
