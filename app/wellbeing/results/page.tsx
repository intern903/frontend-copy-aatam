"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ScoreRings } from "@/components/engine/PeriodSummary";
import { EngineFrame, EngineTop, SectionHead, Stepper } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { averageScore, byPriority, lastScores, overallPercent, priorityPercent, scoredQualities } from "@/lib/outcomes";
import { closePeriod, useApp } from "@/lib/store";

// Both scores together (Engine flow, phase 3), drawn as the rings on Figma "RG - Prior":
// My Outcomes (Overall %, Priority %) and My Well-Being (this period's average), side by side and
// the same size, never merged into one number. One plain line says what each means, then each
// quality against last period as plain numbers: a change, never a problem.
// "Set Up New Dates" closes the period (it moves to Prior) and starts building the next one.

export default function WellbeingResultsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const state = useApp();
  const { outcomes, wellbeing } = state;
  const list = byPriority(outcomes.currentPeriod);
  const overall = overallPercent(list);
  const priority = priorityPercent(list);
  const average = averageScore(wellbeing.scores);
  const last = lastScores(state);
  const lastAverage = last ? averageScore(last) : null;
  const leaving = useRef(false); // closing the period clears the scores; don't bounce back to scoring

  useEffect(() => {
    if (hydrated && !wellbeing.submitted && !leaving.current) router.replace("/wellbeing/score");
  }, [hydrated, wellbeing.submitted, router]);
  if (!hydrated || !wellbeing.submitted) return null;

  return (
    <EngineFrame top={<EngineTop />}>
      <div className="flex flex-col gap-12">
        <SectionHead title="Scores" />
        <Stepper current={0} />
      </div>

      <div className="flex flex-col gap-16 rounded-24 bg-white px-16 py-12">
        <ScoreRings
          items={[
            ...(outcomes.period
              ? [
                  { label: "Overall", value: overall / 100, text: `${overall}%` },
                  { label: "Priority", value: priority / 100, text: `${priority}%` },
                ]
              : []),
            { label: "Well-being", value: (average ?? 0) / 10, text: average === null ? "--" : String(average) },
          ]}
        />
        <div className="flex flex-col gap-8">
          {outcomes.period && (
            <p className="text-body-small text-black">
              <span className="text-body-medium">Outcomes</span> is what I did: overall, the share of outcomes done; priority,
              the same with #1 counting the most.
            </p>
          )}
          <p className="text-body-small text-black">
            <span className="text-body-medium">Well-Being</span> is how I felt while doing it: the average of my qualities
            {lastAverage !== null ? `, ${lastAverage} last period` : ""}.
          </p>
        </div>
        <div className="flex flex-col gap-8">
          {scoredQualities(state).map((q) => {
            const now = wellbeing.scores[q];
            const before = last?.[q];
            return (
              <div key={q} className="flex items-center justify-between border-t-hairline border-background-600 pt-8">
                <span className="text-body-small text-black">{q}</span>
                <span className="font-mono text-data-table text-black">
                  {typeof now === "number" ? `${now}/10` : "--"}
                  {typeof before === "number" && <span className="text-ink-50"> · last {before}/10</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <PrimaryButton
        onClick={() => {
          leaving.current = true;
          if (outcomes.period) closePeriod({ overall, priority, wellbeing: average ?? 0 });
          router.push("/outcomes/dates");
        }}
      >
        Set Up New Dates
      </PrimaryButton>
    </EngineFrame>
  );
}
