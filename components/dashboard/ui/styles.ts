// Shared class strings for form controls across the dashboard. Centralized
// so every input/select/textarea gets the same focus-visible ring (plain
// `outline-none focus:border-carbon` has no keyboard-focus indicator once
// the outline is removed — a real accessibility gap the previous version
// had everywhere) and the same disabled treatment, instead of each form
// re-typing (and slowly drifting from) the same class string.

export const labelClass = "text-xs uppercase tracking-wide text-carbon/60";

export const inputClass =
  "border border-carbon/20 bg-white px-3 py-2 text-sm text-carbon outline-none transition-colors " +
  "duration-150 placeholder:text-carbon/30 focus:border-carbon focus:ring-2 focus:ring-naranja/25 " +
  "disabled:cursor-not-allowed disabled:bg-hueso/60 disabled:text-carbon/40";

export const selectClass = `cursor-pointer ${inputClass}`;

export const textareaClass = `${inputClass} resize-none`;
