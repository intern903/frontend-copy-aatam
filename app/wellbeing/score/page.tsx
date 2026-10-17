"use client";

import { useRouter } from "next/navigation";
import { CountPill, EngineFrame, EngineTop, OutOfTen, ScoreBoxes, SectionHead, Stepper } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { scoredQualities } from "@/lib/outcomes";
import { setQualityScore, submitWellbeing, useApp } from "@/lib/store";

// Figma "RG - Score Well-being": the client's qualities (their confirmed list from Values &
// Qualities, in their wording, never added to or reordered here), each with ten boxes to tap,
// all on one screen. Submit opens once every quality has a score. Last period's numbers stay
// hidden until this one is submitted, so they can't anchor the answer. Saved to store.wellbeing.

export default function ScoreWellbeingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const state = useApp();
  const qualities = scoredQualities(state);
  const { scores } = state.wellbeing;
  const allScored = qualities.length > 0 && qualities.every((q) => typeof scores[q] === "number");

  if (!hydrated) return null;

  return (
    <EngineFrame top={<EngineTop />}>
      <div className="flex flex-col gap-12">
        <SectionHead
          title="Score My Well-being"
          right={
            <CountPill>
              {qualities.length} qualit{qualities.length === 1 ? "y" : "ies"}
            </CountPill>
          }
        />
        <Stepper current={0} />
      </div>

      {qualities.length === 0 ? (
        <div className="flex flex-col gap-12 rounded-24 bg-white px-16 py-12">
          <p className="text-body-small text-black">Your qualities come from My Values &amp; Qualities. Find them first, then come back to score them.</p>
          <PrimaryButton href="/values">Find my qualities</PrimaryButton>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <p className="text-body-small text-black">Score my well-being between 1-10</p>
          <div className="flex flex-col gap-8">
            {qualities.map((q, i) => {
              const score = typeof scores[q] === "number" ? (scores[q] as number) : null;
              return (
                <section key={q} className="flex flex-col gap-8 rounded-24 bg-white px-16 py-12">
                  <div className="flex items-center justify-between">
                    <h2 className="text-body text-black">{q}</h2>
                    <OutOfTen score={score} />
                  </div>
                  <ScoreBoxes score={score} toneIndex={i} label={`${q}, out of 10`} onPick={(n) => setQualityScore(q, n)} />
                </section>
              );
            })}
          </div>
        </div>
      )}

      {qualities.length > 0 && (
        <PrimaryButton
          disabled={!allScored}
          onClick={() => {
            submitWellbeing();
            router.push("/wellbeing/results");
          }}
        >
          Submit
        </PrimaryButton>
      )}
    </EngineFrame>
  );
}
