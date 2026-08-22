// Shared class strings for form controls across the dashboard/portal.
// Per the "16 Design system" sheet of the mockup: surface = superficie,
// border = corte, focus = border turns tinta with no halo (the ring on
// mouse click is deliberately absent — keyboard users still get a
// visible :focus-visible outline via the .dp-scope rule in globals.css,
// which is a separate, keyboard-only mechanism, not a conflict with the
// "no halo" resting-state aesthetic).

export const labelClass =
  "font-dp-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-grafito";

export const inputClass =
  "h-[38px] w-full border border-corte bg-superficie px-3.5 font-dp-sans text-[13px] text-tinta outline-none " +
  "transition-colors duration-150 placeholder:text-concreto focus:border-tinta " +
  "disabled:cursor-not-allowed disabled:bg-papel disabled:text-concreto";

export const selectClass = `cursor-pointer ${inputClass}`;

export const textareaClass = `${inputClass} h-auto resize-none py-2.5`;
