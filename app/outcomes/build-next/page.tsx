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
// The held card follows the finger exactly; the others slide out of its way as it passes their
// middle, and on release it glides into its slot before the new order is saved.
// "Start New Game" opens Figma "RG - Book Session" (1642:4385): Start Game begins the period
// straight away; Book Session opens Dinesh's calendar and then "RG - Session Booked" (1642:4395),
// whose Start New Game begins the period. Both land on the current period.

const HOLD_MS = 250;
const GAP = 8; // gap-8 between the cards
const SETTLE_MS = 180;

type Drag = { id: string; from: number; startY: number; rects: DOMRect[] };

export default function BuildNextPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { outcomes } = useApp();
  const draft = outcomes.draft.outcomes;
  // The card being dragged, how far it has moved, and the slot it would drop into.
  const [dragging, setDragging] = useState<string | null>(null);
  const [dy, setDy] = useState(0);
  const [slot, setSlot] = useState(0);
  const [settling, setSettling] = useState(false);
  const [instant, setInstant] = useState(false); // no transition on the frame the order is saved
  const [sheet, setSheet] = useState<"book" | "booked" | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Starting (or cancelling) empties the draft; don't bounce back into the build on the way out.
  const leaving = useRef(false);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const list = useRef<HTMLDivElement>(null);
  const hold = useRef<{ id: string; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const draggingRef = useRef<string | null>(null);
  const drag = useRef<Drag | null>(null);
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

  const ids = draft.map((o) => o.id);
  const byId = new Map(draft.map((o) => [o.id, o]));

  function onPointerDown(e: React.PointerEvent, id: string) {
    if (settling) return;
    const pointer = e.pointerId;
    const target = list.current;
    const startY = e.clientY;
    hold.current = {
      id,
      y: startY,
      timer: setTimeout(() => {
        target?.setPointerCapture?.(pointer);
        // Measured once, at the start: the cards don't move in the page while one is dragged.
        const rects = ids.map((x) => rows.current.get(x)!.getBoundingClientRect());
        const from = ids.indexOf(id);
        drag.current = { id, from, startY, rects };
        draggingRef.current = id;
        justDragged.current = true;
        setDy(0);
        setSlot(from);
        setDragging(id);
        navigator.vibrate?.(10);
      }, HOLD_MS),
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    // Moving before the hold completes is a scroll, not a drag.
    if (hold.current && !draggingRef.current && Math.abs(e.clientY - hold.current.y) > 8) {
      clearTimeout(hold.current.timer);
      hold.current = null;
    }
    const d = drag.current;
    if (!d || settling) return;
    const top = d.rects[0].top;
    const bottom = d.rects[d.rects.length - 1].bottom;
    const r = d.rects[d.from];
    // Kept within the list, so the card can't be dragged off it.
    const move = Math.min(Math.max(e.clientY - d.startY, top - r.top), bottom - r.bottom);
    const middle = r.top + r.height / 2 + move;
    let next = d.from;
    d.rects.forEach((o, i) => {
      const m = o.top + o.height / 2;
      if (i < d.from && middle < m) next--;
      if (i > d.from && middle > m) next++;
    });
    setDy(move);
    setSlot(next);
  }
  /** How far the others move out of the way: by the dragged card's height and the gap. */
  function shiftOf(i: number) {
    const d = drag.current;
    if (!d || i === d.from) return 0;
    const h = d.rects[d.from].height + GAP;
    if (i < d.from && i >= slot) return h;
    if (i > d.from && i <= slot) return -h;
    return 0;
  }
  function endDrag() {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
    const d = drag.current;
    if (!d || settling) return;
    draggingRef.current = null;
    // Glide into the slot, then save the order with no transition (it is already in place).
    const r = d.rects;
    const to = slot > d.from ? r[slot].bottom - r[d.from].bottom : slot < d.from ? r[slot].top - r[d.from].top : 0;
    setSettling(true);
    setDy(to);
    setTimeout(() => {
      const next = ids.filter((x) => x !== d.id);
      next.splice(slot, 0, d.id);
      setInstant(true);
      if (slot !== d.from) orderDraft(next);
      drag.current = null;
      setDragging(null);
      setDy(0);
      setSettling(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }, SETTLE_MS);
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
          title="Prioritize Outcomes"
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
            const y = lifted ? dy : dragging ? shiftOf(i) : 0;
            // The dragged card tracks the finger with no lag; everything else eases.
            const ease = instant || (lifted && !settling) ? "none" : `transform ${SETTLE_MS}ms ease-out, box-shadow 150ms`;
            const rank = dragging ? (lifted ? slot : i + Math.sign(shiftOf(i))) + 1 : i + 1;
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
                style={{ transform: `translateY(${y}px)${lifted ? " scale(1.03)" : ""}`, transition: ease }}
                className={`relative select-none rounded-24 [-webkit-touch-callout:none] motion-reduce:!transition-none ${
                  lifted ? "z-10 cursor-grabbing shadow-card" : "cursor-grab"
                }`}
              >
                <OutcomeCard outcome={o} rank={rank} />
              </div>
            );
          })}
        </div>
      </div>

      <StackedButtons>
        <PrimaryButton onClick={() => setSheet("book")}>Start New Game</PrimaryButton>
        <GreyCta onClick={() => setCancelling(true)}>Cancel Game</GreyCta>
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
