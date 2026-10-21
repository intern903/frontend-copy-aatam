"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import QuestionScreen from "@/components/QuestionScreen";
import { CheckRow, PrimaryButton } from "@/components/life-purpose/ui";
import { GreenButton, GreyButton, SplitButtons, useVisionReturn, withFrom } from "@/components/visions/ui";
import type { LifeAreaId } from "@/lib/data";
import { setVision, useApp } from "@/lib/store";
import {
  VISION_CHECKLIST,
  VISION_QUESTIONS,
  areaName,
  isLifeArea,
  visionCheckState,
  type VisionCheckId,
} from "@/lib/visions";

// Figma "Vision - Flow Screen 6": the client's earlier answers in cards that scroll sideways,
// then their vision for the area in their own words ("I …") with a live checklist under it.
// "Feels True" keeps it and returns to the areas; "Go Deeper" keeps it and goes through the
// power words one by one. Saved to store.visions.byLifeArea.
//
// HARD RULE: the app never writes a vision. It only asks and holds. The box starts with whatever
// the client wrote before (or empty) and nothing is ever put into it for them.
export default function WritePage({ params }: { params: { area: string } }) {
  if (!isLifeArea(params.area)) notFound();
  return (
    <Suspense>
      <Write area={params.area} />
    </Suspense>
  );
}

function Write({ area }: { area: LifeAreaId }) {
  const router = useRouter();
  const back = useVisionReturn(); // the screen this edit was opened from
  const { visions, lifePurpose: lp } = useApp();
  const vision = visions.byLifeArea[area];
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? vision?.statement ?? "";
  // Ticks are a help only: the client can tick or untick any item, and nothing waits on them.
  const [overrides, setOverrides] = useState<Partial<Record<VisionCheckId, boolean>>>({});
  const on = visionCheckState(text, lp.statement, lp.powerWords, overrides);
  const name = areaName(area);
  const answered = VISION_QUESTIONS.filter((q) => vision?.answers[q.key]?.trim());

  const keep = () => setVision(area, { statement: text.trim() });
  // Figma "Want to go deeper" (1642:1917): Save asks whether to take the vision through every
  // power word. Yes → the deeper screens; No → saved, back to where the edit started.
  const [askDeeper, setAskDeeper] = useState(false);
  const canGoDeeper = text.trim().length > 0 && lp.powerWords.length > 0;

  return (
    <QuestionScreen
      title={name}
      step={5}
      steps={5}
      label={`My vision for ‘${name}’`}
      required
      value={text}
      onChange={setDraft}
      placeholder="I ..."
      onCancel={() => router.push(back)}
      onSave={() => {
        if (canGoDeeper) return setAskDeeper(true);
        if (text.trim()) keep();
        router.push(back);
      }}
      top={
        answered.length > 0 && (
          // Runs past the right gutter so the next card peeks in, as in Figma.
          <div className="-mr-32 flex snap-x gap-8 self-stretch overflow-x-auto pr-32">
            {answered.map((q) => (
              <Link
                key={q.key}
                href={`/visions/${area}/questions?q=${VISION_QUESTIONS.indexOf(q) + 1}`}
                className="flex h-answer-card w-content shrink-0 snap-start flex-col gap-8 overflow-hidden rounded-24 bg-white p-16"
              >
                <p className="text-caption text-black/75">{q.text}</p>
                <span className="border-t-hairline border-black/50" />
                <p className="line-clamp-3 text-body-small text-black">{vision!.answers[q.key]}</p>
              </Link>
            ))}
          </div>
        )
      }
      below={
        <div className="flex flex-col gap-8">
          {VISION_CHECKLIST.map((c) => (
            <CheckRow key={c.id} label={c.label} on={on(c.id)} onClick={() => setOverrides((o) => ({ ...o, [c.id]: !on(c.id) }))} />
          ))}
        </div>
      }
    >
      <SplitButtons>
        <GreyButton
          disabled={!text.trim()}
          onClick={() => {
            keep();
            router.push(back);
          }}
        >
          Feels mine
        </GreyButton>
        <GreenButton
          disabled={!text.trim() || lp.powerWords.length === 0}
          onClick={() => {
            keep();
            router.push(withFrom(`/visions/${area}/deeper`, back));
          }}
        >
          Go Deeper
        </GreenButton>
      </SplitButtons>
      <Link href={`/visions/${area}/board`} className="text-center text-body-small text-primary-600 underline">
        My vision board
      </Link>
      {askDeeper && (
        <PopUpSheet title="Want to go deeper?" radius="md" closable={false} onClose={() => setAskDeeper(false)}>
          <p className="text-body text-black">Take my vision through every power word.</p>
          <div className="flex flex-col gap-6">
            <PrimaryButton
              onClick={() => {
                keep();
                router.push(withFrom(`/visions/${area}/deeper`, back));
              }}
            >
              Yes, go deeper
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                keep();
                router.push(back);
              }}
              className="w-full rounded-8 bg-cancel py-16 text-button-cta text-black"
            >
              No, save
            </button>
          </div>
        </PopUpSheet>
      )}
    </QuestionScreen>
  );
}
