"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import { lifeCodeAreas, lifeCodeColour, lifeCodeTags } from "@/components/engine/LifeCodeCard";
import { Chip, DotTags, EngineFrame, EngineTop } from "@/components/engine/ui";
import { useHydrated } from "@/components/values/ui";
import { archiveLifeCode, restoreLifeCode, useApp } from "@/lib/store";

// Figma "RG - Guide" (one life code open) and "RG - Delete Guideline" (archive).
// The statement, its tags, and the three answers behind it. Edit opens the same five-step flow
// it was written in; archive keeps it (never deleted) and takes it out of the active list.

const REASONS = ["No longer relevant", "Already part of my life", "Duplicate"];

export default function LifeCodePage({ params }: { params: { id: string } }) {
  const hydrated = useHydrated();
  const code = useApp().lifeCodes.find((c) => c.id === params.id);
  const [archiving, setArchiving] = useState(false);

  if (!hydrated) return null;
  if (!code) {
    return (
      <EngineFrame top={<EngineTop />}>
        <p className="text-body-small text-ink-60">This life code isn’t here any more.</p>
      </EngineFrame>
    );
  }

  const answers = [
    { q: "Which life areas does this Life Code apply to?", a: lifeCodeAreas(code) },
    { q: "Does this Life Code fit one situation, or many situations in your life?", a: code.type === "micro" ? "One situation (Micro)" : "Many situations (Macro)" },
    { q: "How or when will you use this Life Code?", a: code.howOrWhenToUse || "Not answered yet." },
  ];
  const circle = "flex size-[28px] items-center justify-center rounded-pill bg-white";

  return (
    <EngineFrame top={<EngineTop />}>
      <div className="flex flex-col gap-16">
        <div className="flex justify-end gap-4">
          <Link href={`/life-code/new?edit=${code.id}`} aria-label="Edit this life code" className={circle}>
            <Image src="/icons/edit-3.svg" alt="" width={16} height={16} />
          </Link>
          {code.status === "active" ? (
            <button type="button" aria-label="Archive this life code" onClick={() => setArchiving(true)} className={circle}>
              <Image src="/icons/archive.svg" alt="" width={16} height={16} />
            </button>
          ) : (
            // Not in Figma: an archived life code can be brought back to the list.
            <button type="button" onClick={() => restoreLifeCode(code.id)} className="rounded-pill bg-white px-12 text-caption text-black">
              Restore
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-h3 text-black">{code.statement}</h1>
          <span className="flex items-center gap-8">
            <span className={`size-8 shrink-0 rounded-4 ${lifeCodeColour(code).solid}`} />
            <DotTags tags={code.status === "archived" ? [...lifeCodeTags(code), "Archived"] : lifeCodeTags(code)} />
          </span>
        </div>

        <div className="flex flex-col gap-8">
          {answers.map(({ q, a }) => (
            <section key={q} className="flex flex-col gap-4 rounded-24 bg-white p-16">
              <h2 className="text-caption text-ink-75">{q}</h2>
              <p className="text-body-small text-black">{a}</p>
            </section>
          ))}
        </div>
      </div>

      {archiving && <ArchiveSheet onClose={() => setArchiving(false)} onArchive={(reason) => archiveLifeCode(code.id, reason)} />}
    </EngineFrame>
  );
}

function ArchiveSheet({ onClose, onArchive }: { onClose: () => void; onArchive: (reason: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [other, setOther] = useState("");
  return (
    <PopUpSheet title="Archive my life code" onClose={onClose} variant="bottom">
      <p className="text-body-small text-black">Why am I archiving this life code?</p>
      <div className="flex flex-wrap gap-8">
        {REASONS.map((r) => (
          <Chip key={r} label={r} on={picked === r} onClick={() => setPicked(picked === r ? null : r)} />
        ))}
      </div>
      <textarea
        value={other}
        onChange={(e) => setOther(e.target.value)}
        placeholder="Any other reason"
        rows={3}
        className="w-full resize-none rounded-12 border-hairline border-background-600 bg-white p-12 text-body-small text-black outline-none placeholder:text-ink-50"
      />
      <div className="flex gap-8">
        <button type="button" onClick={onClose} className="flex-1 rounded-8 bg-cancel py-16 text-button-cta text-cancel-text">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onArchive([picked, other.trim()].filter(Boolean).join(" · "));
            onClose();
          }}
          className="flex-1 rounded-8 bg-primary-600 py-16 text-button-cta text-white"
        >
          Archive
        </button>
      </div>
    </PopUpSheet>
  );
}
