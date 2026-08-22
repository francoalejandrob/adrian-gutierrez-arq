"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import Button, { type ButtonSize, type ButtonVariant } from "./button";

// Wraps useFormStatus so every <form action={serverAction}> gets a real
// pending state (disabled + label swap) instead of staying clickable
// while the mutation is in flight — the previous version left every
// submit button in its normal state during the request, inviting double
// submits with no feedback that anything was happening. Extra button
// props (name/value) pass through so two SubmitButtons in the same form
// can each submit a different value — the standard HTML pattern already
// used for the portal's Aprobar/Solicitar cambios pair.
export default function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children" | "className">) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className} {...rest}>
      {pending && (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
