"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OutcomeCard from "@/components/engine/OutcomeCard";
import { EmergedCodes, OutcomeStrips, ScoreRings } from "@/components/engine/PeriodSummary";
import { ChoiceCard, CountPill, EngineFrame, EngineTop, FieldLabel, OutOfTen, ScoreBoxes, SectionHead } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { byPriority, overallPercent, priorityPercent, shortDate } from "@/lib/outcomes";
import { reviewOutcome, setOutcomeScore, useApp } from "@/lib/store";

// The period-end review (Engine flow, phase 1): every outcome, one per screen, in the order the
// client set. The client says Done or Not done; there is no middle option, and the screen
// reacts the same way to both. A Being outcome also gets its score out of 10. Notes written
// during the period show underneath, so nothing is recalled from nothing. Each answer saves as
// it is given, so the close can stop half-way and pick up at the same outcome.
// Ends in the summary: the life codes first, then the outcomes, then the two percentages.

export default function ClosingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { outcomes } = useApp();
  const list = byPriority(outcomes.currentPeriod);
  const [index, setIndex] = useState<number | null>(null);

  // Open at the first outcome not yet reviewed (or the summary if all are).
  useEffect(() => {
    if (!hydrated || index !== null) return;
    if (!outcomes.period) {
      router.replace("/outcomes/period");
      return;
    }
    const next = list.findIndex((o) => !o.closed);
    setIndex(next === -1 ? list.length : next);
  }, [hydrated, index, outcomes.period, list, router]);

  if (!hydrated || index === null || !outcomes.period) return null;
  if (index >= list.length) return <Summary onBack={() => setIndex(Math.max(0, list.length - 1))} />;

  const o = list[index];
  return (
    <EngineFrame top={<EngineTop onBack={index > 0 ? () => setIndex(index - 1) : undefined} />}>
      <div className="flex flex-col gap-16">
        <SectionHead
          title={`Close Period ${outcomes.period.number}`}
          right={
            <CountPill>
              {index + 1} of {list.length}
            </CountPill>
          }
        />
        <OutcomeCard key={o.id} outcome={o} rank={o.priority ?? index + 1} />
        <section className="flex flex-col gap-16 rounded-24 bg-white p-16">
          <p className="text-body text-black">{o.text}</p>
          {o.notes.length > 0 && (
            <div className="flex flex-col gap-8">
              <p className="text-caption text-ink-75">My notes</p>
              {o.notes.map((n) => (
                <p key={n.id} className="text-body-small text-black">
                  <span className="text-caption text-ink-60">{shortDate(n.at)} · </span>
                  {n.text}
                </p>
              ))}
            </div>
          )}
          {o.type === "Being" && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <FieldLabel>Where am I now, between 1-10?</FieldLabel>
                <OutOfTen score={o.score} />
              </div>
              <ScoreBoxes score={o.score} toneIndex={index} label="Score out of 10" onPick={(n) => setOutcomeScore(o.id, n)} />
            </div>
          )}
          <div className="flex flex-col gap-8">
            <FieldLabel required>Did I do it?</FieldLabel>
            <div className="flex gap-8">
              <ChoiceCard title="Done" on={o.closed && o.done} onClick={() => reviewOutcome(o.id, true)} />
              <ChoiceCard title="Not done" on={o.closed && !o.done} onClick={() => reviewOutcome(o.id, false)} />
            </div>
          </div>
        </section>
        <Link
          href={`/life-code/new?source=${encodeURIComponent("My Outcomes")}&period=${outcomes.period.id}&return=/outcomes/closing`}
          className="text-center text-body-small text-primary-600 underline"
        >
          Is there a life code I want to add from this?
        </Link>
        <PrimaryButton disabled={!o.closed} onClick={() => setIndex(index + 1)}>
          {index + 1 < list.length ? "Next Outcome" : "See My Period"}
        </PrimaryButton>
      </div>
    </EngineFrame>
  );
}

function Summary({ onBack }: { onBack: () => void }) {
  const { outcomes, lifeCodes } = useApp();
  const period = outcomes.period!;
  const list = byPriority(outcomes.currentPeriod);
  const overall = overallPercent(list);
  const priority = priorityPercent(list);
  return (
    <EngineFrame top={<EngineTop onBack={onBack} />}>
      <div className="flex flex-col gap-16">
        <SectionHead title={`Period ${period.number}`} right={<CountPill>{list.filter((o) => o.done).length} of {list.length} done</CountPill>} />
        <div className="flex flex-col gap-16 rounded-24 bg-white px-16 py-12">
          <EmergedCodes codes={lifeCodes.filter((c) => c.periodId === period.id)} />
          <OutcomeStrips outcomes={list} />
          <ScoreRings
            items={[
              { label: "Overall", value: overall / 100, text: `${overall}%` },
              { label: "Priority", value: priority / 100, text: `${priority}%` },
            ]}
          />
          <p className="text-caption text-ink-60">
            Overall is the share of outcomes done. Priority weights each by its place: #1 counts the most.
          </p>
        </div>
        <PrimaryButton href="/wellbeing/score">Score My Well-being</PrimaryButton>
      </div>
    </EngineFrame>
  );
}
