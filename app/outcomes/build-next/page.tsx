"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OutcomeCard from "@/components/engine/OutcomeCard";
import { CancelGameSheet, CountPill, EngineFrame, EngineTop, GreyCta, SectionHead, StackedButtons, Stepper } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { BOOKING_URL } from "@/lib/cif";
import { cancelDraft, orderDraft, startPeriod, useApp } from "@/lib/store";

// Figma "RG - Proritize tasks" (1173:9740): the new outcomes, put in order by drag and drop with #1
// at the top. Press and hold a card, then drag it; a quick tap still turns the card over. The app
// never suggests an order.
// "Start New Game" opens Figma "RG - Book Session" (1642:4385): Start Game begins the period
// straight away; Book Session opens Dinesh's calendar and then "RG - Session Booked" (1642:4395),
// whose Start New Game begins the period. Both land on the current period.

const HOLD_MS = 250;

export default function BuildNextPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { outcomes } = useApp();
  const draft = outcomes.draft.outcomes;
  const [order, setOrder] = useState<string[] | null>(null); // while dragging
  const [dragging, setDragging] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"book" | "booked" | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Starting (or cancelling) empties the draft; don't bounce back into the build on the way out.
  const leaving = useRef(false);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const list = useRef<HTMLDivElement>(null);
  const hold = useRef<{ id: string; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const draggingRef = useRef<string | null>(null);
  const justDragged = useRef(false);

  // While a card is being dragged, a finger moving on the screen moves the card, not the page.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const stop = (e: TouchEvent) => {
      if (draggingRef.current) e.preventDefault();
    };
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  });

  useEffect(() => {
    if (hydrated && draft.length === 0 && !leaving.current) router.replace("/outcomes/new");
  }, [hydrated, draft.length, router]);
  if (!hydrated || draft.length === 0) return null;

  const ids = order ?? draft.map((o) => o.id);
  const byId = new Map(draft.map((o) => [o.id, o]));

  function onPointerDown(e: React.PointerEvent, id: string) {
    const pointer = e.pointerId;
    const target = list.current;
    hold.current = {
      id,
      y: e.clientY,
      timer: setTimeout(() => {
        target?.setPointerCapture?.(pointer);
        draggingRef.current = id;
        justDragged.current = true;
        setDragging(id);
      }, HOLD_MS),
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    // Moving before the hold completes is a scroll, not a drag.
    if (hold.current && !draggingRef.current && Math.abs(e.clientY - hold.current.y) > 8) {
      clearTimeout(hold.current.timer);
      hold.current = null;
    }
    const current = draggingRef.current;
    if (!current) return;
    // The slot is the row whose middle the pointer has passed.
    const others = ids.filter((id) => id !== current);
    let slot = others.length;
    for (let i = 0; i < others.length; i++) {
      const r = rows.current.get(others[i])?.getBoundingClientRect();
      if (r && e.clientY < r.top + r.height / 2) {
        slot = i;
        break;
      }
    }
    const next = [...others];
    next.splice(slot, 0, current);
    if (next.join() !== ids.join()) setOrder(next);
  }
  function endDrag() {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
    if (order) orderDraft(order);
    setOrder(null);
    setDragging(null);
    draggingRef.current = null;
  }
  function start() {
    leaving.current = true;
    startPeriod();
    router.push("/outcomes/period");
  }

  return (
    <EngineFrame top={<EngineTop />}>
      <div className="flex flex-col gap-12">
        <SectionHead
          title="Prioritize My Outcomes"
          right={
            <CountPill>
              {draft.length} outcome{draft.length === 1 ? "" : "s"}
            </CountPill>
          }
        />
        <Stepper current={3} />
      </div>

      <div className="flex flex-col gap-16">
        <p className="text-body-small text-black">Prioritize my tasks by drag and drop. #1 matters most.</p>
        <div ref={list} className="flex flex-col gap-8" onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {ids.map((id, i) => {
            const o = byId.get(id)!;
            const lifted = dragging === id;
            return (
              <div
                key={id}
                ref={(el) => {
                  if (el) rows.current.set(id, el);
                  else rows.current.delete(id);
                }}
                onPointerDown={(e) => onPointerDown(e, id)}
                onClickCapture={(e) => {
                  if (!justDragged.current) return;
                  justDragged.current = false;
                  e.stopPropagation();
                  e.preventDefault();
                }}
                aria-roledescription="draggable"
                className={`relative select-none rounded-24 transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ${
                  lifted ? "z-10 scale-[1.02] cursor-grabbing shadow-card" : "cursor-grab"
                }`}
              >
                <OutcomeCard outcome={o} rank={i + 1} />
              </div>
            );
          })}
        </div>
      </div>

      <StackedButtons>
        <PrimaryButton onClick={() => setSheet("book")}>Start New Game</PrimaryButton>
        <GreyCta onClick={() => setCancelling(true)}>Cancel My Game</GreyCta>
      </StackedButtons>

      {sheet && (
        <BookingSheet
          kind={sheet}
          end={outcomes.draft.end}
          onClose={() => setSheet(null)}
          onStart={start}
          onBook={() => {
            window.open(BOOKING_URL, "_blank", "noopener,noreferrer");
            setSheet("booked");
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

/**
 * Figma "RG - Book Session" / "RG - Session Booked": a Primary/500 card with the faded clock,
 * centred over a light scrim (tap outside to close). The session date starts at the period's end
 * (the next session is when the period closes); the date and time can both be changed.
 */
function BookingSheet({
  kind,
  end,
  onClose,
  onStart,
  onBook,
}: {
  kind: "book" | "booked";
  end: string | null;
  onClose: () => void;
  onStart: () => void;
  onBook: () => void;
}) {
  const [date, setDate] = useState(end ?? "");
  const [time, setTime] = useState("08:30");
  const title = kind === "book" ? "Book session with Dinesh" : "Session booked with Dinesh";
  const cta = "flex-1 rounded-8 bg-background px-16 py-12 text-button-cta text-primary-800";
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/25" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative flex w-content flex-col gap-12 overflow-hidden rounded-24 bg-primary-500 p-16">
        <Image src="/images/engine/booking-clock.svg" alt="" width={150} height={150} className="pointer-events-none absolute -left-[25px] -top-[48px] rotate-45" />
        <p className="relative font-heading text-h4 text-white">{title}</p>
        {kind === "book" ? (
          <div className="relative flex gap-12">
            <button type="button" onClick={onStart} className={cta}>
              Start Game
            </button>
            <button type="button" onClick={onBook} className={cta}>
              Book Session
            </button>
          </div>
        ) : (
          <>
            <div className="relative flex gap-8">
              <label className="flex min-w-0 flex-1 items-center gap-8 rounded-12 border border-background-600 bg-white px-12 py-8">
                <Image src="/icons/calendar.svg" alt="" width={20} height={20} />
                <input type="date" aria-label="Session date" value={date} onChange={(e) => setDate(e.target.value)} className="min-w-0 flex-1 bg-transparent text-body-small text-black outline-none" />
              </label>
              <label className="flex min-w-0 flex-1 items-center gap-8 rounded-12 border border-background-600 bg-white px-12 py-8">
                <Image src="/icons/clock-20.svg" alt="" width={20} height={20} />
                <input type="time" aria-label="Session time" value={time} onChange={(e) => setTime(e.target.value)} className="min-w-0 flex-1 bg-transparent text-body-small text-black outline-none" />
              </label>
            </div>
            <button type="button" onClick={onStart} className="relative w-full rounded-8 bg-background px-32 py-16 text-button-cta text-black">
              Start New Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
