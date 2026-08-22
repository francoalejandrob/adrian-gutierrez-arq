// Shared class strings for form controls across the dashboard. Centralized
// so every input/select/textarea gets the same focus-visible ring (plain
// `outline-none focus:border-carbon` has no keyboard-focus indicator once
// the outline is removed — a real accessibility gap the previous version
// had everywhere) and the same disabled treatment, instead of each form
// re-typing (and slowly drifting from) the same class string.

export const labelClass = "text-[11.5px] text-carbon/50";

export const inputClass =
  "rounded-lg border border-carbon/15 bg-white px-3.5 py-2.5 text-[13.5px] text-carbon outline-none transition-colors " +
  "duration-150 placeholder:text-carbon/30 focus:border-carbon focus:ring-2 focus:ring-naranja/25 " +
  "disabled:cursor-not-allowed disabled:bg-hueso/60 disabled:text-carbon/40";

export const selectClass = `cursor-pointer ${inputClass}`;

export const textareaClass = `${inputClass} resize-none`;
