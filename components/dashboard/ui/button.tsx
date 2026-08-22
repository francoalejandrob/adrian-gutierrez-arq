import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-dp-mono font-medium " +
  "uppercase tracking-[0.12em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "border border-tinta bg-tinta text-papel hover:border-acento hover:bg-acento",
  secondary: "border border-corte bg-transparent text-tinta hover:border-tinta",
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
