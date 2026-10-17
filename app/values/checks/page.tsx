"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckChip, NextButton, QuestionText, TextLink, VqFrame, useDiscovery } from "@/components/values/ui";
import { ALL_QUALITY_NAMES, ALL_VALUE_NAMES, addMissing, finalView, finish, results, updateChecks, type Run } from "@/lib/discovery";
import { saveDiscoveryResults, setDiscovery } from "@/lib/store";

// Figma "VQ - Begin" (checks): the four validation steps, in order. The client's answers here
// override the scores: anything flagged as a wish or as borrowed comes out of the main lists.
// Every tap is saved, so the client can leave and come back to the same step.
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.
export default function ChecksPage() {
  const { run } = useDiscovery();
  if (!run) return null;
  return <Checks run={run} />;
}

function Checks({ run }: { run: Run }) {
  const { step, star, wish, other, added } = run.state.checks;
  const { values, qualities } = results(run.state);
  const items = [...values, ...qualities];
  const save = (r: Run) => setDiscovery(r);
  const toStep = (n: number) => save(updateChecks(run, { step: n }));
  const toggle = (list: string[], key: string, max?: number) =>
    list.includes(key) ? list.filter((k) => k !== key) : max && list.length >= max ? list : [...list, key];

  // Steps 2–4: Back goes to the previous step; on step 1 the arrow undoes the last answer.
  const onBack = step > 0 ? () => toStep(step - 1) : undefined;

  if (step === 0) {
    return (
      <VqFrame run={run}>
        <QuestionText>Here is what came through. Which two feel most like you?</QuestionText>
        <p className="text-body-small text-ink-50">Tap up to two.</p>
        <div className="flex flex-wrap gap-8">
          {items.map((x) => (
            <CheckChip key={x.key} label={x.name} on={star.includes(x.key)} onClick={() => save(updateChecks(run, { star: toggle(star, x.key, 2) }))} />
          ))}
        </div>
        <NextButton disabled={star.length === 0} onClick={() => toStep(1)}>
          Continue
        </NextButton>
      </VqFrame>
    );
  }

  if (step === 1 || step === 2) {
    const list = step === 1 ? wish : other;
    // Step 3: anything flagged as a wish in step 2 drops out of this list.
    const shown = step === 1 ? items : items.filter((x) => !wish.includes(x.key));
    return (
      <VqFrame run={run} onBack={onBack}>
        <QuestionText>
          {step === 1
            ? "Is any of these something you wish were true, rather than something that is true today?"
            : "Does any of these feel like it belongs to someone else’s expectations of you?"}
        </QuestionText>
        <p className="text-body-small text-ink-50">Tap any that apply, or skip.</p>
        <div className="flex flex-wrap gap-8">
          {shown.map((x) => (
            <CheckChip
              key={x.key}
              label={x.name}
              on={list.includes(x.key)}
              onClick={() => save(updateChecks(run, step === 1 ? { wish: toggle(wish, x.key) } : { other: toggle(other, x.key) }))}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <TextLink onClick={() => toStep(step - 1)}>Back</TextLink>
          <NextButton
            onClick={() =>
              // Leaving step 2 also drops anything now flagged as a wish from the "borrowed" list.
              save(updateChecks(run, step === 1 ? { step: 2, other: other.filter((k) => !wish.includes(k)) } : { step: 3 }))
            }
          >
            Continue
          </NextButton>
        </div>
      </VqFrame>
    );
  }

  return <Missing run={run} added={added} onBack={() => toStep(2)} />;
}

const NAMES = [...ALL_VALUE_NAMES, ...ALL_QUALITY_NAMES];

function Missing({ run, added, onBack }: { run: Run; added: Run["state"]["checks"]["added"]; onBack: () => void }) {
  const [text, setText] = useState("");
  const add = () => {
    setDiscovery(addMissing(run, text));
    setText("");
  };

  return (
    <VqFrame run={run} onBack={onBack}>
      <div className="flex flex-col gap-4">
        <QuestionText>Is anything important missing?</QuestionText>
        <p className="text-body-small text-ink-50">
          Type a value or quality in your own words. If it matches a word we use, we will file it there.
        </p>
      </div>
      <div className="flex gap-8">
        <input
          type="text"
          list="vq-names"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Courage, Family, Faith"
          autoComplete="off"
          aria-label="A value or quality"
          className="min-w-0 flex-1 rounded-12 border-hairline border-background-600 bg-white p-12 text-body text-black outline-none placeholder:text-ink-50"
        />
        <button type="button" onClick={add} disabled={!text.trim()} className="rounded-8 border border-primary-600 px-16 text-button-cta text-primary-600 disabled:opacity-50">
          Add
        </button>
      </div>
      <datalist id="vq-names">
        {NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      {added.length > 0 && (
        <div className="flex flex-wrap gap-8">
          {added.map((a, i) => (
            <button
              key={a.name}
              type="button"
              aria-label={`Remove ${a.name}`}
              onClick={() => setDiscovery(updateChecks(run, { added: added.filter((_, j) => j !== i) }))}
              className="flex items-center gap-8 rounded-pill bg-primary-500 px-12 py-8 text-body text-white"
            >
              {a.name}
              <Image src="/icons/x.svg" alt="" width={14} height={14} className="invert" />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <TextLink onClick={onBack}>Back</TextLink>
        <NextButton
          onClick={() => {
            // A word typed but not yet added still counts.
            const done = finish(text.trim() ? addMissing(run, text) : run);
            // The confirmed lists become the client's values and qualities.
            saveDiscoveryResults(finalView(done.state));
            setDiscovery(done);
          }}
        >
          Continue
        </NextButton>
      </div>
    </VqFrame>
  );
}
