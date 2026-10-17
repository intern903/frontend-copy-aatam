"use client";

import BackButton from "@/components/shell/BackButton";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BreakScreen, ChapterScreen, CifStep } from "@/components/cif/Screens";
import { CifFrame } from "@/components/cif/ui";
import { CHAPTERS, chapterOf, flow, type CifState } from "@/lib/cif";
import { cifBack, cifGo, resetCif, submitCif, useApp } from "@/lib/store";

// The CIF, one question per screen. Where the client is lives in store.cif.progress, so they
// can leave and come back to the exact question. ?step=<id> jumps to a screen (summary, /_index).
function Cif() {
  const router = useRouter();
  const params = useSearchParams();
  const { cif } = useApp();
  const s: CifState = { answers: cif.answers, lifeAreas: cif.lifeAreas, progress: cif.progress };
  const steps = flow(s);
  const [resumeAt, setResumeAt] = useState<string | null>(null);

  useEffect(() => {
    const step = params.get("step");
    if (step && steps.includes(step)) {
      cifGo(step, false);
      router.replace("/cif", { scroll: false });
      return;
    }
    // Returning mid-form: welcome them back first, then carry on where they left off.
    if (!cif.progress.submittedAt && cif.progress.current !== "welcome") setResumeAt(cif.progress.current);
    // Run once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = cif.progress.current;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentStep]);

  // A step dropped by a changed answer (e.g. a branch) falls forward to the same chapter.
  let current = cif.progress.current;
  if (!steps.includes(current)) {
    current = steps.find((x) => chapterOf(x) >= chapterOf(current)) ?? "welcome";
  }

  function submit() {
    submitCif();
    router.push("/cif/thanks");
  }

  if (resumeAt || current === "welcome") {
    return (
      <>
        <Welcome
          resumeAt={resumeAt}
          hasProgress={cif.progress.history.length > 0 || cif.progress.submittedAt !== null}
          onContinue={() => {
            if (resumeAt) cifGo(resumeAt, false);
            else cifGo("ch1");
            setResumeAt(null);
          }}
          onRestart={() => {
            resetCif();
            setResumeAt(null);
          }}
        />
      </>
    );
  }

  // Progress: chapters before this one full, this one part-filled, later ones empty.
  const ch = chapterOf(current);
  const fills = CHAPTERS.map((_, i) => {
    const n = i + 1;
    if (ch >= 8 || n < ch) return 1;
    if (n > ch) return 0;
    const inChapter = steps.filter((x) => chapterOf(x) === n);
    return Math.max(0.06, (inChapter.indexOf(current) + 1) / inChapter.length);
  });
  const isIntro = /^(ch\d|break:\d)$/.test(current);
  const label = current === "summary" ? "Summary" : isIntro ? undefined : CHAPTERS[ch - 1]?.title;
  const canGoBack = current !== "ch1";

  return (
    <>
      <div className="relative">
        {/* Not in the Figma frames: one question back, or home from the first screen. */}
        <div className="absolute left-32 top-cif-top z-10">
          <BackButton onClick={canGoBack ? () => cifBack(steps) : undefined} />
        </div>
        <CifFrame fills={fills} label={label}>
          {cif.progress.editing && current !== "summary" && (
            <button
              type="button"
              onClick={() => cifGo("summary")}
              className="mb-12 text-caption text-primary-600"
            >
              Back to summary
            </button>
          )}
          {/^ch\d$/.test(current) ? (
            <ChapterScreen n={+current.slice(2)} s={s} />
          ) : current.startsWith("break:") ? (
            <BreakScreen n={+current.slice(6)} />
          ) : (
            <CifStep key={current} step={current} s={s} onSubmit={submit} />
          )}
        </CifFrame>
      </div>
    </>
  );
}

// Figma "CIF - Begin" welcome: large logo, title, two lines, full-width button.
function Welcome({
  resumeAt,
  hasProgress,
  onContinue,
  onRestart,
}: {
  resumeAt: string | null;
  hasProgress: boolean;
  onContinue: () => void;
  onRestart: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center px-32 pb-nav-clearance pt-cif-logo-top text-center">
      <Image src="/images/cif/logo-large.svg" alt="Aatam — The Bridge to I" width={215} height={200} className="h-logo-large w-logo-large" priority />
      <h1 className="mt-40 font-heading text-h1 text-black">{resumeAt ? "Welcome back" : "Before We Begin"}</h1>
      {resumeAt ? (
        <p className="mt-16 text-body text-black">Your answers are saved. Pick up where you left off, or start again.</p>
      ) : (
        <>
          <p className="mt-16 text-body text-black">
            A few questions to help me understand where you are right now. It takes about 10 minutes. There are no
            right answers, and only I see what you share.
          </p>
          <p className="mt-32 text-body text-black">Your progress saves as you go, so you can stop and come back.</p>
        </>
      )}
      <div className="mt-auto flex w-full flex-col items-center gap-16 pt-40">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-8 bg-primary-600 py-16 text-button-cta text-white"
        >
          {resumeAt ? "Continue" : "Let’s Begin"}
        </button>
        {hasProgress && (
          <button
            type="button"
            onClick={() => window.confirm("Clear your answers and start again?") && onRestart()}
            className="text-body-small text-ink-50 underline"
          >
            Start again
          </button>
        )}
      </div>
    </main>
  );
}

export default function CifPage() {
  return (
    <Suspense>
      <Cif />
    </Suspense>
  );
}
