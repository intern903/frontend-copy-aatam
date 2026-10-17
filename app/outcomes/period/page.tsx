"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import OutcomeCard, { CornerButton } from "@/components/engine/OutcomeCard";
import { DayBar, TickButton } from "@/components/engine/Tracking";
import { DotTags, EngineFrame, Ring, SectionHead, useTabSwipe } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import type { Outcome, OutcomeNote } from "@/lib/data";
import { byPriority, dateOf, isoDate, periodDays, shortDate, today } from "@/lib/outcomes";
import { addOutcomeNote, useApp } from "@/lib/store";

// Figma "RG - Game" (Current period): every outcome of the period in priority order, each with
// a control to add a note, and the days-left card. Notes are the moment plus the client's
// words; they stay with their outcome inside this period and are never scored.
// The plus beside the heading starts building the next period (muted while one is running);
// the clock opens Prior periods and the trend.
// A period past its end shows "Ready to close": neutral, never red or overdue.
// An outcome the client tracks also shows today's tick top-right (Figma's check circle) and,
// on the back of its card, the day-by-day bar. "‹ Today" (or a swipe right) goes to Today.

export default function PeriodPage() {
  const hydrated = useHydrated();
  const { outcomes } = useApp();
  const [noteFor, setNoteFor] = useState<Outcome | null>(null);
  const period = outcomes.period;
  const list = byPriority(outcomes.currentPeriod);
  const days = period ? periodDays(period) : null;
  const ready = days !== null && days.left <= 0;
  const swipe = useTabSwipe({ right: "/outcomes/today" });
  const notes = list
    .flatMap((o) => o.notes.map((n) => ({ ...n, outcome: o.text })))
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <EngineFrame
      swipe={swipe}
      top={
        // Figma "RG - Game": the "‹ Today" pill back to the Today tab.
        <div className="flex pt-[82px]">
          <Link href="/outcomes/today" aria-label="Back to Today" className="flex items-center gap-4 rounded-24 bg-white px-16 py-8 text-body-medium text-black">
            <Image src="/icons/chevron-right-20.svg" alt="" width={20} height={20} className="rotate-180" />
            Today
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-16">
        <SectionHead
          title="My Current Period"
          right={
            <span className="flex items-center">
              {period ? (
                <span aria-label="Start a new period (after this one closes)" className="flex size-[32px] items-center justify-center opacity-50">
                  <Image src="/icons/plus-circle-rg.svg" alt="" width={24} height={24} />
                </span>
              ) : (
                <Link href="/outcomes/dates" aria-label="Start a new period" className="flex size-[32px] items-center justify-center">
                  <Image src="/icons/plus-circle-rg.svg" alt="" width={24} height={24} />
                </Link>
              )}
              <Link href="/outcomes/prior" aria-label="Prior periods and trend" className="flex size-[32px] items-center justify-center">
                <Image src="/icons/clock.svg" alt="" width={24} height={24} />
              </Link>
            </span>
          }
        />

        {!hydrated ? null : !period || !days ? (
          <div className="flex flex-col gap-12 rounded-24 bg-white px-16 py-12">
            <p className="text-body text-black">No period yet.</p>
            <p className="text-body-small text-ink-60">Choose when your first period ends, then set the outcomes you want in it.</p>
            <PrimaryButton href="/outcomes/dates">Set up my period</PrimaryButton>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-24 bg-white px-16 py-12">
              <div className="flex flex-col gap-4">
                <DotTags tags={[`Period ${period.number}`, `Ends ${shortDate(period.end)}`]} />
                <p className="font-heading text-h2 text-black">
                  {ready ? "Ready to close" : `${days.left} day${days.left === 1 ? "" : "s"} left`}
                </p>
              </div>
              <div className="size-[60px]">
                <Ring value={days.gone / days.total}>
                  <span className="font-mono text-data-table text-black">
                    {days.gone}/{days.total}
                  </span>
                </Ring>
              </div>
            </div>

            {ready && <PrimaryButton href="/outcomes/closing">Close this period</PrimaryButton>}

            <div className="flex flex-col gap-12">
              {list.map((o, i) => (
                <OutcomeCard
                  key={o.id}
                  outcome={o}
                  rank={o.priority ?? i + 1}
                  corner={
                    <>
                      <CornerButton label={`Add a note to “${o.text}”`} onClick={() => setNoteFor(o)}>
                        <Image src="/icons/plus-small.svg" alt="" width={16} height={16} />
                      </CornerButton>
                      {o.track && o.type === "Doing" && <TickButton outcome={o} />}
                    </>
                  }
                  status={
                    o.track || o.notes.length > 0 ? (
                      <span className="flex w-full flex-col gap-8">
                        {o.track && o.type === "Doing" && <DayBar outcome={o} period={period} />}
                        {o.track && o.type === "Being" && <span className="text-caption text-black">Today: {o.score === null ? "--" : `${o.score}/10`}</span>}
                        {o.notes.length > 0 && <span className="text-caption text-black">{o.notes.length} note{o.notes.length === 1 ? "" : "s"}</span>}
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {notes.length > 0 && (
        <div className="flex flex-col gap-16">
          <SectionHead title="My Current Game Notes" />
          <div className="flex flex-col gap-12">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} about={n.outcome} />
            ))}
          </div>
        </div>
      )}

      {noteFor && <NoteSheet outcome={outcomes.currentPeriod.find((o) => o.id === noteFor.id) ?? noteFor} onClose={() => setNoteFor(null)} />}
    </EngineFrame>
  );
}

/** "Yesterday · 7:40 am" / "Oct, 4 · 5:15 pm" */
function when(at: string) {
  const d = new Date(at);
  const day = dateOf(isoDate(d)).getTime();
  const now = today().getTime();
  const label =
    day === now ? "Today" : now - day === 24 * 60 * 60 * 1000 ? "Yesterday" : `${shortDate(isoDate(d)).replace(" ", ", ")}`;
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  return [label, time];
}

function NoteCard({ note, about }: { note: OutcomeNote; about?: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-24 border border-background-600 bg-white px-16 py-12">
      <p className="text-body text-black">{note.text}</p>
      <DotTags tags={about ? [...when(note.at), about] : when(note.at)} />
    </div>
  );
}

/** A note against one outcome: what the client noticed, in their words. */
function NoteSheet({ outcome, onClose }: { outcome: Outcome; onClose: () => void }) {
  const [text, setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    addOutcomeNote(outcome.id, text.trim());
    setText("");
  };
  return (
    <PopUpSheet title="Notes" onClose={onClose} variant="bottom">
      <p className="text-body-small text-ink-60">{outcome.text}</p>
      <div className="flex gap-8">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="What did you notice today?"
          aria-label="What did you notice today?"
          autoFocus
          className="min-w-0 flex-1 rounded-12 border border-background-600 bg-white px-16 py-12 text-body-small text-black outline-none placeholder:text-ink-50"
        />
        <button type="button" onClick={add} disabled={!text.trim()} className="rounded-12 bg-primary-600 px-16 text-button-cta text-white disabled:opacity-50">
          Add
        </button>
      </div>
      {outcome.notes.length > 0 && (
        <div className="flex max-h-[40vh] flex-col gap-12 overflow-y-auto">
          {[...outcome.notes].reverse().map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </PopUpSheet>
  );
}
