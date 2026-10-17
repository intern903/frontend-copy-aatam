"use client";

import { useState } from "react";
import { OptionButton, QuestionText, TAP_MS, VqFrame, shuffle, useDiscovery } from "@/components/values/ui";
import { answerPick, current } from "@/lib/discovery";

// Figma "VQ - Begin" (question): one question at a time. The options are shuffled each time a
// question appears; a tapped option is highlighted briefly so the tap registers, then the next
// question comes. The client sees only the question and its options.
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.
export default function QuestionPage() {
  const { run, act } = useDiscovery();
  if (!run) return null;
  const c = current(run.state);
  if (c.kind !== "pick") return null;
  // Keyed by question + answer count, so a new question (or Back) gets a fresh shuffle.
  return <Pick key={c.question.id} text={c.question.text} options={c.question.options} onPick={(i) => act((r) => answerPick(r, i))} run={run} />;
}

function Pick({
  text,
  options,
  onPick,
  run,
}: {
  text: string;
  options: string[];
  onPick: (index: number) => void;
  run: NonNullable<ReturnType<typeof useDiscovery>["run"]>;
}) {
  const [order] = useState(() => shuffle(options.map((_, i) => i)));
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <VqFrame run={run}>
      <QuestionText>{text}</QuestionText>
      <div className="flex flex-col gap-8">
        {order.map((i) => (
          <OptionButton
            key={i}
            text={options[i]}
            picked={picked === i}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              setTimeout(() => onPick(i), TAP_MS);
            }}
          />
        ))}
      </div>
    </VqFrame>
  );
}
