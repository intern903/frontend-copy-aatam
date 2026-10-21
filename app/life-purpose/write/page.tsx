"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckRow, LpHeader, PrimaryButton } from "@/components/life-purpose/ui";
import { CHECKLIST, checkState, clusterColour, usesWord, type CheckId } from "@/lib/lifePurpose";
import { saveDraft, useApp } from "@/lib/store";

// Figma "LP - First Draft".
// HARD RULE: the app never generates the statement. It never writes a suggested sentence into
// the box — the box opens empty, or with the client's own last draft.
export default function WritePage() {
  const router = useRouter();
  const { lifePurpose: lp } = useApp();
  const [text, setText] = useState(lp.statement);
  // Auto-ticks are a help only; the client can tick or untick any item, and nothing is gated on it.
  const [overrides, setOverrides] = useState<Partial<Record<CheckId, boolean>>>({});
  const on = checkState(text, overrides);

  return (
    <main className="px-32 pb-40">
      {/* Not in the Figma frame: a way back to the power words. */}
      <LpHeader />

      {/* Power words over the photo; a word brightens once it's in the draft. */}
      <div className="relative mt-16 flex h-power-card flex-col items-center gap-8 overflow-hidden rounded-24 bg-white px-12 py-20">
        <Image src="/images/life-purpose/power-words.png" alt="" fill sizes="329px" className="object-cover object-[50%_75%]" />
        <p className="relative text-center text-body text-black">My Power Words</p>
        <div className="relative flex flex-wrap justify-center gap-8">
          {lp.powerWords.map((w, i) => (
            <span
              key={w}
              className={`rounded-16 px-12 py-4 font-heading text-h4 text-white ${clusterColour(i).solid} ${usesWord(text, w) ? "opacity-50" : ""}`}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* The shape, for reference only — not a sentence to copy. */}
      <div className="mt-20 flex flex-col gap-10 rounded-12 border border-dashed border-black bg-white p-16">
        <p className="text-caption text-ink-80">A strong purpose follows this shape (for reference only)</p>
        <p className="text-body text-black">
          My purpose in life is to <em className="font-semibold">___ (Driver)</em> by{" "}
          <em className="font-semibold">___ (Process)</em> to <em className="font-semibold">___ (Outcome)</em>
        </p>
      </div>

      <h1 className="mt-20 font-heading text-h2 text-black">My Draft</h1>
      <p className="mt-4 text-caption text-ink-80">Life purpose must pass all checklists mentioned below.</p>
      <textarea
        aria-label="My draft life purpose"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="My purpose in life is to ..."
        className="mt-12 min-h-[80px] w-full resize-none rounded-12 border border-black/20 bg-white p-12 text-body-small text-black outline-none placeholder:text-black/20"
      />

      <div className="mt-12 flex flex-col gap-8">
        {CHECKLIST.map((c) => (
          <CheckRow key={c.id} label={c.label} on={on(c.id)} onClick={() => setOverrides((o) => ({ ...o, [c.id]: !on(c.id) }))} />
        ))}
      </div>

      <div className="mt-24">
        <PrimaryButton
          disabled={!text.trim()}
          onClick={() => {
            saveDraft(text.trim());
            router.push("/life-purpose");
          }}
        >
          Draft feels mine
        </PrimaryButton>
      </div>
    </main>
  );
}
