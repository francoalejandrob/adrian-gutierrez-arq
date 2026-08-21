"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { contactNeeds } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactoForm() {
  const t = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    if (data.get("company")) {
      setStatus("success");
      form.reset();
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          need: data.get("need"),
          message: data.get("message"),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? t.contactoForm.genericError);
      }

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t.contactoForm.genericError,
      );
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        role="status"
        className="border border-naranja/40 bg-carbon/40 p-10 text-center"
      >
        <p className="font-display text-2xl text-hueso">
          {t.contactoForm.successTitle}
        </p>
        <p className="mt-3 text-sm text-hueso/70">
          {t.contactoForm.successBody}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label={t.contactoForm.name} htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full bg-transparent py-3 text-hueso outline-none"
          />
        </Field>

        <Field label={t.contactoForm.email} htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-transparent py-3 text-hueso outline-none"
          />
        </Field>

        <Field label={t.contactoForm.phone} htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="w-full bg-transparent py-3 text-hueso outline-none"
          />
        </Field>

        <Field label={t.contactoForm.need} htmlFor="need">
          <select
            id="need"
            name="need"
            required
            defaultValue=""
            className="w-full cursor-pointer bg-transparent py-3 text-hueso outline-none"
          >
            <option value="" disabled className="text-carbon">
              {t.contactoForm.needPlaceholder}
            </option>
            {contactNeeds.map((need) => (
              <option key={need} value={need} className="text-carbon">
                {t.contactoForm.needOptions[need]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t.contactoForm.message} htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="w-full resize-none bg-transparent py-3 text-hueso outline-none"
        />
      </Field>

      <AnimatePresence>
        {status === "error" && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="text-sm text-naranja"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={status === "loading"}
        className="press relative mt-2 w-fit cursor-pointer overflow-hidden bg-naranja px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] text-carbon transition-colors duration-200 hover:bg-naranja-oscuro disabled:cursor-not-allowed disabled:opacity-70"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={status === "loading" ? "loading" : "idle"}
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(3px)" }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="inline-block"
          >
            {status === "loading" ? t.contactoForm.sending : t.contactoForm.send}
          </motion.span>
        </AnimatePresence>
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/60 transition-colors duration-200 group-focus-within:text-naranja"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        <span className="absolute inset-x-0 bottom-0 h-px bg-hueso/30" />
        <span className="absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-naranja transition-transform duration-300 ease-out-strong group-focus-within:scale-x-100" />
      </div>
    </div>
  );
}
