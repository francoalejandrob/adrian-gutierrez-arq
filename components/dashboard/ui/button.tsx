import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-dp-mono font-medium " +
  "uppercase tracking-[0.12em] transition-[transform,box-shadow,background-color,border-color,color] duration-150 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

// Hard offset shadows (no blur, tinted to the accent) instead of a soft
// SaaS drop-shadow — reads as a stacked/layered card in the same
// technical-drafting language as the zero-radius system, and gives every
// primary/secondary button real depth + a second color on the surface.
// Press physics: the button travels toward its own shadow on :active, so
// it reads as a physical, pushable object rather than a flat rectangle.
const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-tinta bg-tinta text-papel shadow-[3px_3px_0_0_var(--color-acento)] " +
    "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-acento)] " +
    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-acento)] " +
    "disabled:shadow-[3px_3px_0_0_var(--color-corte)]",
  secondary:
    "border border-corte bg-superficie text-tinta shadow-[2px_2px_0_0_var(--color-tinta)] " +
    "hover:border-tinta hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--color-tinta)] " +
    "active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_0_var(--color-tinta)] " +
    "disabled:shadow-[2px_2px_0_0_var(--color-corte)]",
  tertiary: "border-none bg-transparent p-0 text-concreto hover:text-tinta",
  danger: "border-none bg-transparent p-0 text-concreto hover:text-acento",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-[9.5px]",
  md: "h-[38px] px-5 text-[10px]",
  lg: "h-[46px] px-6 text-[10px] tracking-[0.14em]",
};

// Class-string builder so the exact same look can be applied to a <Link>
// styled as a button (navigation must stay an <a>, never a <button> that
// fires client-side JS to move pages) as well as to real <button> elements.
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  const sizePart = variant === "tertiary" || variant === "danger" ? "" : sizes[size];
  return `${base} ${variants[variant]} ${sizePart}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}
