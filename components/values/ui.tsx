"use client";

import BackButton from "@/components/shell/BackButton";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PurposeBanner } from "@/components/visions/ui";
import { back, newRun, progress, screenFor, type Run } from "@/lib/discovery";
import { setDiscovery, useApp } from "@/lib/store";

// Building blocks for the Values & Qualities screens (Figma "VQ - Begin" frames).
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.

/** True once the saved state has loaded in the browser (so redirects don't fire on the server copy). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/**
 * The run in progress, saved to the store after every change. Sends the client to the screen the
 * run belongs on (question, trade-off, checks or results), or to the intro if there is no run.
 */
export function useDiscovery() {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const run = useApp().discovery;
  const target = run ? screenFor(run.state) : "/values";

  useEffect(() => {
    if (hydrated && target !== pathname) router.replace(target);
  }, [hydrated, target, pathname, router]);

  const act = (change: (r: Run) => Run) => setDiscovery(change(run ?? newRun()));
  return { run: hydrated && target === pathname ? run : null, act };
}

/**
 * Back arrow, Life Purpose card, the plain progress bar and "My values & qualities"
 * (Figma: arrow y 70, card y 130, bar y 394, label y 418, content y 454).
 * The arrow undoes the last answer when there is history, or leaves for the intro.
 */
export function VqFrame({ run, onBack, children }: { run: Run; onBack?: () => void; children: React.ReactNode }) {
  const pct = Math.round(progress(run.state) * 100);
  const goBack = onBack ?? (run.history.length ? () => setDiscovery(back(run)) : undefined);
  return (
    <main className="flex flex-col px-32 pb-40 pt-header-top">
      <div className="flex h-icon-button items-center">
        <BackButton onClick={goBack} />
      </div>
      <div className="mt-20">
        <PurposeBanner />
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-20 h-4 w-content overflow-hidden rounded-pill bg-cancel"
      >
        <span className="block h-full rounded-pill bg-black transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-20 text-body-small text-ink-50">Values &amp; qualities</p>
      <div className="mt-16 flex flex-col gap-16">{children}</div>
    </main>
  );
}

/** The question (H4). */
export function QuestionText({ children }: { children: React.ReactNode }) {
  return <h1 className="font-heading text-h4 text-black">{children}</h1>;
}

/** An answer: white card, or Primary/500 with white text once tapped. */
export function OptionButton({ text, picked, disabled, onClick }: { text: string; picked: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={picked}
      className={`w-full rounded-12 border-hairline p-12 text-left text-body transition-colors ${
        picked ? "border-primary-700 bg-primary-500 text-white" : "border-background-600 bg-white text-black"
      }`}
    >
      {text}
    </button>
  );
}

/** Shuffles a copy (Fisher–Yates). */
export function shuffle<T>(items: T[]) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** How long a tapped option stays highlighted before the next question appears. */
export const TAP_MS = 260;

/** A pill with a round tick (Figma "Here is what came through"). */
export function CheckChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`flex items-center gap-8 rounded-pill border-hairline px-12 py-8 text-body ${
        on ? "border-primary-700 bg-primary-500 text-white" : "border-background-600 bg-white text-black"
      }`}
    >
      {on ? (
        <span className="flex size-check items-center justify-center rounded-pill bg-primary-700">
          <Image src="/icons/check.svg" alt="" width={14} height={14} />
        </span>
      ) : (
        <span className="size-check rounded-pill border border-background-600" />
      )}
      {label}
    </button>
  );
}

/** Right-aligned "Continue"-style button (Figma CTA: Primary/600, 24 × 12 padding). */
export function NextButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-8 bg-primary-600 px-24 py-12 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </button>
    </div>
  );
}

/** A plain text link (Back between the checks, "Change my first choice"). */
export function TextLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-body-small text-primary-600 underline">
      {children}
    </button>
  );
}
