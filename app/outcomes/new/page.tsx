"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OutcomeCard from "@/components/engine/OutcomeCard";
import {
  AreaChips,
  CancelGameSheet,
  ChoiceCard,
  CountPill,
  EngineFrame,
  EngineTop,
  FieldLabel,
  GoalsSheet,
  GreyCta,
  SectionHead,
  StackedButtons,
  Stepper,
} from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { Toggle } from "@/components/settings/SettingsList";
import { useHydrated } from "@/components/values/ui";
import type { LifeAreaId, OutcomeType } from "@/lib/data";
import { addDraftOutcome, cancelDraft, removeDraftOutcome, useApp } from "@/lib/store";

// Figma "RG - New Tasks" / "RG - Mapped goal" (Set Up New Outcomes). One outcome is set up in
// the order the design shows:
//   1. pick the life area  2. Doing or Being  3. write the outcome in my own words
//   4. map it to a goal, or keep it standalone  5. whether to track it
// "Add Outcome" puts it on the list above as a card; then Prioritize My Outcomes.
// The app never drafts, suggests or completes an outcome: the words are the client's.

type Form = { area: LifeAreaId | null; type: OutcomeType | null; text: string; goal: string | null | undefined; track: boolean | null };
const BLANK: Form = { area: null, type: null, text: "", goal: undefined, track: null };

export default function NewOutcomesPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { outcomes, cif } = useApp();
  const [form, setForm] = useState<Form>(BLANK);
  const [picking, setPicking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const leaving = useRef(false); // cancelling clears the end date; don't bounce to the dates step
  const draft = outcomes.draft.outcomes;
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const valid = !!form.area && !!form.type && form.text.trim().length > 0 && form.goal !== undefined;
  const goal = cif.keyResults.find((g) => g.id === form.goal);

  // The period's end comes first.
  useEffect(() => {
    if (hydrated && !outcomes.draft.end && !leaving.current) router.replace("/outcomes/dates");
  }, [hydrated, outcomes.draft.end, router]);
  if (!hydrated || !outcomes.draft.end) return null;

  function add() {
    if (!valid) return;
    addDraftOutcome({ lifeArea: form.area!, type: form.type!, text: form.text.trim(), goalId: form.goal ?? null, track: form.track ?? false });
    setForm(BLANK);
  }

  return (
    <EngineFrame top={<EngineTop />}>
      <div className="flex flex-col gap-12">
        <SectionHead
          title="Set Up New Outcomes"
          right={
            <CountPill>
              {draft.length} outcome{draft.length === 1 ? "" : "s"}
            </CountPill>
          }
        />
        <Stepper current={2} />
      </div>

      <div className="flex flex-col gap-16">
        {draft.length > 0 && (
          <div className="flex flex-col gap-8">
            {draft.map((o) => (
              <OutcomeCard key={o.id} outcome={o} onRemove={() => removeDraftOutcome(o.id)} />
            ))}
          </div>
        )}

        <section className="flex flex-col gap-16 rounded-24 bg-white p-16">
          <div className="flex flex-col gap-12">
            <FieldLabel required>Select life area</FieldLabel>
            <AreaChips selected={form.area ? [form.area] : []} onToggle={(id) => set({ area: form.area === id ? null : id })} />
          </div>
          <div className="flex flex-col gap-12">
            <FieldLabel required>Select type of outcome</FieldLabel>
            <div className="flex gap-8">
              <ChoiceCard title="Doing" sub="Something I do" on={form.type === "Doing"} onClick={() => set({ type: "Doing" })} />
              <ChoiceCard title="Being" sub="Something I feel" on={form.type === "Being"} onClick={() => set({ type: "Being" })} />
            </div>
          </div>
          <div className="flex flex-col gap-12">
            <FieldLabel required>Define outcome</FieldLabel>
            <textarea
              value={form.text}
              onChange={(e) => set({ text: e.target.value })}
              placeholder="e.g. Do yoga everyday"
              aria-label="Define outcome"
              className="h-answer-box w-full resize-none rounded-12 border-hairline border-background-600 bg-white p-12 text-body text-black outline-none placeholder:text-ink-50"
            />
          </div>
          <div className="flex flex-col gap-12">
            <FieldLabel required>Does this map to a goal?</FieldLabel>
            <div className="flex gap-8">
              <ChoiceCard title="Map to a goal" sub={goal ? goal.text : "Choose from my goals"} on={!!form.goal} onClick={() => setPicking(true)} />
              <ChoiceCard title="Do not map" sub="Keep it standalone" on={form.goal === null} onClick={() => set({ goal: null })} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-12">
            <FieldLabel>Do I want to track this outcome?</FieldLabel>
            <Toggle checked={form.track === true} onChange={(on) => set({ track: on })} label="Do I want to track this outcome?" />
          </div>
        </section>

        <button
          type="button"
          onClick={add}
          disabled={!valid}
          className="flex w-full items-center justify-center gap-8 rounded-24 border border-dashed border-background-800 px-16 py-8 text-body-small text-background-800 disabled:opacity-50"
        >
          <Image src="/icons/plus-dashed.svg" alt="" width={20} height={20} />
          Add Outcome
        </button>
      </div>

      <StackedButtons>
        <PrimaryButton
          disabled={draft.length === 0 && !valid}
          onClick={() => {
            add(); // an outcome filled in but not yet added still counts
            router.push("/outcomes/build-next");
          }}
        >
          Prioritize My Outcomes
        </PrimaryButton>
        <GreyCta onClick={() => setCancelling(true)}>Cancel My Game</GreyCta>
      </StackedButtons>

      {picking && (
        <GoalsSheet
          title="Map to a goal"
          onClose={() => setPicking(false)}
          onPick={(id) => {
            set({ goal: id });
            setPicking(false);
          }}
        />
      )}
      {cancelling && (
        <CancelGameSheet
          onKeep={() => setCancelling(false)}
          onCancel={() => {
            leaving.current = true;
            cancelDraft();
            router.push("/outcomes/period");
          }}
        />
      )}
    </EngineFrame>
  );
}
