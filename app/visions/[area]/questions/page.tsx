"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import QuestionScreen from "@/components/QuestionScreen";
import { useHydrated } from "@/components/values/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import type { LifeAreaId } from "@/lib/data";
import { setVision, useApp } from "@/lib/store";
import { VISION_QUESTIONS, areaName, isLifeArea } from "@/lib/visions";

// Figma "Vision - Flow Screen 2–5": the four questions, one per screen (?q=1–4).
// All four are optional ("use any or all"): Next always moves on, and Save keeps what's written.
// Coach's notes for each question are comments in lib/visions.ts; they are never shown.
//
// HARD RULE: the app never writes a vision. It only asks and holds.
export default function QuestionsPage({ params }: { params: { area: string } }) {
  if (!isLifeArea(params.area)) notFound();
  return (
    <Suspense>
      <Questions area={params.area} />
    </Suspense>
  );
}

function Questions({ area }: { area: LifeAreaId }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const final = useApp().visions.areasFinal;
  const q = Math.min(4, Math.max(1, Number(useSearchParams().get("q")) || 1));
  // The questions open only once the life areas are finalised.
  useEffect(() => {
    if (hydrated && !final) router.replace("/visions");
  }, [hydrated, final, router]);
  if (!hydrated || !final) return null;
  return <Question key={q} area={area} q={q} />;
}

function Question({ area, q }: { area: LifeAreaId; q: number }) {
  const router = useRouter();
  const state = useApp();
  const vision = state.visions.byLifeArea[area];
  const question = VISION_QUESTIONS[q - 1];
  // null until the client types, so the saved answer shows once the store has loaded.
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? vision?.answers[question.key] ?? "";

  const keep = () => {
    if (draft === null) return;
    const answers = vision?.answers ?? { livedOnPurpose: "", doOrBe: "", energizingValues: "", lifetime: "" };
    setVision(area, { answers: { ...answers, [question.key]: draft } });
  };

  const topValues = state.values.selected.filter((v) => state.values.final.includes(v.id));

  return (
    <QuestionScreen
      title={areaName(area)}
      step={q}
      steps={5}
      label={question.text}
      value={value}
      onChange={setDraft}
      onCancel={() => router.push("/visions")}
      onSave={() => {
        keep();
        router.push("/visions");
      }}
      intro={
        <div className="flex flex-col gap-2">
          <p className="text-body-small text-black">Your Life Purpose, expressed in each area of your life.</p>
          <p className="text-caption text-ink-50">Four questions — use any or all</p>
        </div>
      }
      above={
        q === 1 ? (
          // The statement is already on the Life Purpose card at the top; this only points to it.
          <p className="rounded-12 bg-primary-100 p-12 text-body-small text-black">Read your Life Purpose above out loud first.</p>
        ) : q === 3 && topValues.length > 0 ? (
          <div className="flex flex-col gap-8">
            <p className="text-caption text-ink-50">Your top values</p>
            <div className="flex flex-wrap gap-8">
              {topValues.map((v) => (
                <span key={v.id} className="rounded-pill bg-primary-100 px-12 py-4 text-body-small text-primary-800">
                  {v.name}
                </span>
              ))}
            </div>
          </div>
        ) : null
      }
    >
      <PrimaryButton
        onClick={() => {
          keep();
          router.push(q < 4 ? `/visions/${area}/questions?q=${q + 1}` : `/visions/${area}/write`);
        }}
      >
        {q < 4 ? "Next" : "Do My Vision Statement"}
      </PrimaryButton>
    </QuestionScreen>
  );
}
