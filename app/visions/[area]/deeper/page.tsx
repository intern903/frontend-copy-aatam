"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import QuestionScreen from "@/components/QuestionScreen";
import { useVisionReturn, withFrom } from "@/components/visions/ui";
import { CheckRow, PrimaryButton } from "@/components/life-purpose/ui";
import type { LifeAreaId } from "@/lib/data";
import { setVision, useApp } from "@/lib/store";
import { VISION_CHECKLIST, areaName, isLifeArea, visionCheckState, type VisionCheckId } from "@/lib/visions";

// Figma "Vision - Flow Screen 7–10" ("Go Deeper"): the area's vision in a green card, then one
// line for each of the client's power words (?word=1…N), each optional. The last screen's
// button is "Feels True" and returns to the areas. Saved to the vision's byPowerWord.
//
// HARD RULE: the app never writes a vision. It only asks and holds.
export default function DeeperPage({ params }: { params: { area: string } }) {
  if (!isLifeArea(params.area)) notFound();
  return (
    <Suspense>
      <Deeper area={params.area} />
    </Suspense>
  );
}

function Deeper({ area }: { area: LifeAreaId }) {
  const words = useApp().lifePurpose.powerWords;
  const n = Math.min(Math.max(1, words.length), Math.max(1, Number(useSearchParams().get("word")) || 1));
  return <Word key={n} area={area} n={n} />;
}

function Word({ area, n }: { area: LifeAreaId; n: number }) {
  const router = useRouter();
  const back = useVisionReturn(); // the screen this edit was opened from
  const { visions, lifePurpose: lp } = useApp();
  const vision = visions.byLifeArea[area];
  const word = lp.powerWords[n - 1] ?? "";
  const last = n >= lp.powerWords.length;
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? vision?.byPowerWord[word] ?? "";
  const [overrides, setOverrides] = useState<Partial<Record<VisionCheckId, boolean>>>({});
  const on = visionCheckState(text, lp.statement, lp.powerWords, overrides);
  const name = areaName(area);

  const keep = () => {
    if (draft !== null && word) setVision(area, { byPowerWord: { ...(vision?.byPowerWord ?? {}), [word]: draft.trim() } });
  };

  return (
    <QuestionScreen
      title={name}
      step={n}
      steps={Math.max(1, lp.powerWords.length)}
      label={`My ${name.toLowerCase()} vision for ‘${word}’`}
      value={text}
      onChange={setDraft}
      placeholder="I ..."
      onCancel={() => router.push(back)}
      onSave={() => {
        keep();
        router.push(back);
      }}
      intro={
        <div className="flex flex-col gap-8 rounded-24 bg-primary-100 p-16">
          <h2 className="font-heading text-h4 text-black">My {name} Vision</h2>
          <p className="rounded-12 border-hairline border-background-600 bg-primary-500 p-12 text-body-small text-white">
            {vision?.statement}
          </p>
        </div>
      }
      below={
        <div className="flex flex-col gap-8">
          {VISION_CHECKLIST.map((c) => (
            <CheckRow key={c.id} label={c.label} on={on(c.id)} onClick={() => setOverrides((o) => ({ ...o, [c.id]: !on(c.id) }))} />
          ))}
        </div>
      }
    >
      <PrimaryButton
        onClick={() => {
          keep();
          router.push(last ? back : withFrom(`/visions/${area}/deeper?word=${n + 1}`, back));
        }}
      >
        {last ? "Feels mine" : "Next"}
      </PrimaryButton>
    </QuestionScreen>
  );
}
