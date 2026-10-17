"use client";

import Image from "next/image";
import { forwardRef, useId, useState } from "react";

// Label (Body Medium) over a white 32px input with the inset shadow; password fields get the eye toggle.
// `error` renders directly under this field; the ref lets the form move focus here when it fails.
const AuthField = forwardRef<
  HTMLInputElement,
  {
    label: string;
    placeholder: string;
    type: "text" | "email" | "password";
    name: string;
    autoComplete: string;
    value: string;
    onChange: (value: string) => void;
    error?: React.ReactNode;
  }
>(function AuthField({ label, placeholder, type, name, autoComplete, value, onChange, error }, ref) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const errorId = useId();

  return (
    <label className="flex w-full flex-col gap-4">
      <span className="text-body-medium text-ink-brown">{label}</span>
      <span className="flex w-full items-center justify-between gap-8 rounded-4 bg-white p-8 shadow-input-inset">
        <input
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          type={isPassword && visible ? "text" : type}
          name={name}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-16 min-w-0 flex-1 bg-transparent text-caption text-ink-brown outline-none placeholder:text-ink-brown/50"
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
            className="shrink-0"
          >
            <Image src="/icons/eye.svg" alt="" width={16} height={16} />
          </button>
        )}
      </span>
      {error && (
        <span id={errorId} role="alert" className="w-full text-caption-lg text-pink-700">
          {error}
        </span>
      )}
    </label>
  );
});
export default AuthField;

export function AuthSubmit({ label = "Let’s start the journey within..." }: { label?: string }) {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center rounded-8 bg-primary-600 py-16 text-button-cta text-white"
    >
      {label}
    </button>
  );
}

// Not in the design: shown only when something blocks sign-in.
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="w-full text-caption-lg text-pink-700">
      {children}
    </p>
  );
}
