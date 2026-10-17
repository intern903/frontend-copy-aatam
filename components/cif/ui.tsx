"use client";

import Image from "next/image";
import { forwardRef } from "react";

// Building blocks for the CIF screens, from the Figma "CIF - Begin" frames.

// ---------- frame ----------

/** 7 rounded 4px segments; black fill over the Cancel grey track. */
export function ProgressBar({ fills }: { fills: number[] }) {
  return (
    <div className="flex w-full gap-8" aria-hidden>
      {fills.map((f, i) => (
        <span key={i} className="h-4 flex-1 overflow-hidden rounded-pill bg-cancel">
          <span className="block h-full rounded-pill bg-black" style={{ width: `${Math.round(f * 100)}%` }} />
        </span>
      ))}
    </div>
  );
}

/** Wordmark, progress bar and (optionally) the small grey section label above each question. */
export function CifFrame({
  fills,
  label,
  children,
}: {
  fills: number[];
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-32 pb-nav-clearance pt-cif-top">
      <Image src="/images/cif/wordmark.svg" alt="Aatam — The Bridge to I" width={150} height={65} className="mx-auto h-wordmark w-wordmark" priority />
      <div className="mt-40">
        <ProgressBar fills={fills} />
      </div>
      {label ? (
        <>
          <p className="mt-20 text-body-small text-ink-50">{label}</p>
          <div className="mt-16">{children}</div>
        </>
      ) : (
        <div className="mt-20">{children}</div>
      )}
    </main>
  );
}

// ---------- question parts ----------

export function QuestionHead({ meta, title, helper }: { meta?: React.ReactNode; title: string; helper?: string }) {
  return (
    <div className="flex flex-col gap-4">
      {meta && <div className="text-body-small text-ink-50">{meta}</div>}
      <h1 id="qtitle" className="font-heading text-h4 text-black">
        {title}
      </h1>
      {helper && <p className="text-body-small text-ink-50">{helper}</p>}
    </div>
  );
}

/** Meta line like "1 of 12 · Career" with Figma's 2px dot separator. */
export function Meta({ parts }: { parts: string[] }) {
  return (
    <span className="flex items-center gap-4">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-4">
          {i > 0 && <span aria-hidden className="size-2 rounded-2 bg-ink-60" />}
          {p}
        </span>
      ))}
    </span>
  );
}

/** The error for one field, rendered directly under that field. */
export function ErrorText({ message, id }: { message: string; id?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-8 text-caption text-danger">
      {message}
    </p>
  ) : null;
}

/** Skip link on the left (optional questions only), Continue on the right. */
export function Actions({
  onNext,
  onSkip,
  label = "Continue",
  disabled,
}: {
  onNext: () => void;
  onSkip?: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-24 flex items-center justify-between">
      {onSkip ? (
        <button type="button" onClick={onSkip} className="text-body-small text-ink-50 underline">
          Skip
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="rounded-8 bg-primary-600 px-24 py-12 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}

// ---------- options ----------

/** Single choice: a full-width card, text centred; picked = Primary/500 with a Primary/700 edge. */
export function ChoiceCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full rounded-12 border-hairline p-12 text-center text-body ${
        selected ? "border-primary-700 bg-primary-500 text-white" : "border-background-600 bg-white text-black"
      }`}
    >
      {label}
    </button>
  );
}

/** Multiple choice: card with a 20px tick box; full width in lists, sized to fit as chips. */
export function CheckCard({
  label,
  selected,
  onClick,
  trailing,
  chip,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
  chip?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={`flex items-center justify-between gap-10 rounded-12 border-hairline border-primary-700 p-12 text-left text-body ${
        chip ? "" : "w-full"
      } ${selected ? "bg-primary-500 text-white" : "bg-white text-black"}`}
    >
      <span className="flex items-center gap-10">
        <Tick on={selected} />
        {label}
      </span>
      {trailing}
    </button>
  );
}

export function Tick({ on }: { on: boolean }) {
  return on ? (
    <span className="flex size-check shrink-0 items-center justify-center rounded-8 bg-primary-700">
      <Image src="/icons/check.svg" alt="" width={16} height={16} />
    </span>
  ) : (
    <span className="size-check shrink-0 rounded-8 border-hairline border-ink-50 bg-white" />
  );
}

/** A toggle card in the quieter "special option" style (e.g. "I'm not sure yet…", "None of these"). */
export function SpecialCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full rounded-12 border-hairline p-12 text-left text-body-small ${
        selected ? "border-primary-700 bg-primary-500 text-white" : "border-background-600 bg-white text-ink-50"
      }`}
    >
      {label}
    </button>
  );
}

// ---------- text ----------

const boxClass =
  "w-full rounded-12 border-hairline border-background-600 bg-white p-12 text-black outline-none placeholder:text-ink-50";

// Both take a ref, so a missing answer can move focus to its field.
export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { large?: boolean }>(
  function TextInput({ large, className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={`${boxClass} ${large ? "text-body" : "text-body-small"} ${className ?? ""}`} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return <textarea ref={ref} rows={5} {...rest} className={`${boxClass} resize-none text-body-small ${className ?? ""}`} />;
  },
);

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-body-small text-black">{children}</span>;
}
