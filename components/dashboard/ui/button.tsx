import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-dp-mono font-medium " +
  "uppercase tracking-[0.12em] transition-[transform,box-shadow,background-color,border-color,color] duration-150 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

// Soft, subtle shadow (not the previous pass's hard offset "stacked
// card" shadow) — superseded by the reference dashboard the user shared,
// which uses clean flat buttons with barely-there elevation. Tactile
// feedback on :active is now a small translateY, not a shadow-offset
// press.
const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-tinta bg-tinta text-papel shadow-[0_1px_2px_rgba(15,15,14,0.05),0_4px_10px_rgba(15,15,14,0.12)] " +
    "hover:bg-grafito active:translate-y-px active:shadow-[0_1px_2px_rgba(15,15,14,0.08)]",
  secondary:
    "border border-corte bg-superficie text-tinta shadow-[0_1px_2px_rgba(15,15,14,0.04)] " +
    "hover:border-tinta hover:bg-papel active:translate-y-px",
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
