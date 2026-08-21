import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap transition-all " +
  "duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja/40 focus-visible:ring-offset-1";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-carbon text-white hover:opacity-90",
  secondary: "border border-carbon text-carbon hover:bg-carbon hover:text-white",
  ghost: "text-carbon/60 hover:text-carbon",
  danger: "text-carbon/40 hover:text-red-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs uppercase tracking-wide",
  md: "px-4 py-2 text-sm font-medium",
  lg: "px-5 py-2.5 text-sm font-medium",
};

// Class-string builder so the exact same look can be applied to a <Link>
// styled as a button (navigation must stay an <a>, never a <button> that
// fires client-side JS to move pages) as well as to real <button> elements.
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}
