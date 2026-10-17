"use client";

import { useState } from "react";
import { OptionButton, QuestionText, TAP_MS, TextLink, VqFrame, shuffle, useDiscovery } from "@/components/values/ui";
import { answerTrade, current } from "@/lib/discovery";

// The trade-off screens (same layout as the question screen). Two steps per question: which one
// would you keep, then which would you give up first, with the kept option removed and a
// "Change my first choice" link. Options are shuffled each time the question appears.
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.
export default function TradeOffPage() {
  const { run, act } = useDiscovery();
  if (!run) return null;
  const c = current(run.state);
  if (c.kind !== "trade") return null;
  return (
    <Trade
      key={c.question.id}
      run={run}
      text={c.question.text}
      options={c.options}
      onDone={(keep, drop) => act((r) => answerTrade(r, keep, drop))}
    />
  );
}

function Trade({
  run,
  text,
  options,
  onDone,
}: {
  run: NonNullable<ReturnType<typeof useDiscovery>["run"]>;
  text: string;
  options: { key: string; text: string }[];
  onDone: (keep: string, drop: string) => void;
}) {
  const [order] = useState(() => shuffle(options));
  const [keep, setKeep] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const stepTwo = keep !== null;

  function tap(key: string) {
    setPicked(key);
    setTimeout(() => {
      setPicked(null);
      if (keep === null) setKeep(key);
      else onDone(keep, key);
    }, TAP_MS);
  }

  return (
    // On step two, the back arrow returns to step one rather than undoing the previous answer.
    <VqFrame run={run} onBack={stepTwo ? () => setKeep(null) : undefined}>
      <QuestionText>{text}</QuestionText>
      <p className="text-body-small text-ink-50">{stepTwo ? "And which one would you give up first?" : "Which one would you keep?"}</p>
      <div className="flex flex-col gap-8">
        {order
          .filter((o) => o.key !== keep)
          .map((o) => (
            <OptionButton key={o.key} text={o.text} picked={picked === o.key} disabled={picked !== null} onClick={() => tap(o.key)} />
          ))}
      </div>
      {stepTwo && (
        <div>
          <TextLink onClick={() => setKeep(null)}>Change my first choice</TextLink>
        </div>
      )}
    </VqFrame>
  );
}
