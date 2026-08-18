import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurada.");
  }
  return new Resend(apiKey);
}

export const CONTACT_TO_EMAIL =
  process.env.CONTACT_TO_EMAIL ?? "adriangch95@gmail.com";

export const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";
