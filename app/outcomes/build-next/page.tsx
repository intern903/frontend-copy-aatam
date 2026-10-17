"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import OutcomeCard, { CornerButton } from "@/components/engine/OutcomeCard";
import { CancelGameSheet, CountPill, EngineFrame, EngineTop, GreyCta, SectionHead, StackedButtons, Stepper } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { cancelDraft, orderDraft, startPeriod, useApp } from "@/lib/store";

// Figma "RG - Proritize tasks" and "RG - Start Game": the new outcomes, dragged into order with #1
// at the top (or moved one place with the chevrons), then "Start My New Game", which asks once
// before the period begins. The app never suggests an order.
// Drag by the #rank chip, so a tap on the photo still turns the card over.

export default function BuildNextPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { outcomes } = useApp();
  const draft = outcomes.draft.outcomes;
  const [order, setOrder] = useState<string[] | null>(null); // while dragging
  const [dragging, setDragging] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Starting (or cancelling) empties the draft; don't bounce back into the build on the way out.
  const leaving = useRef(false);
  const rows = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (hydrated && draft.length === 0 && !leaving.current) router.replace("/outcomes/new");
  }, [hydrated, draft.length, router]);
  if (!hydrated || draft.length === 0) return null;

  const ids = order ?? draft.map((o) => o.id);
  const byId = new Map(draft.map((o) => [o.id, o]));
  const move = (from: number, to: number) => {
    const next = [...ids];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    return next;
  };

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    // The slot is the row whose middle the pointer has passed.
    const others = ids.filter((id) => id !== dragging);
    let slot = others.length;
    for (let i = 0; i < others.length; i++) {
      const r = rows.current.get(others[i])?.getBoundingClientRect();
      if (r && e.clientY < r.top + r.height / 2) {
        slot = i;
        break;
      }
    }
    const next = [...others];
    next.splice(slot, 0, dragging);
    if (next.join() !== ids.join()) setOrder(next);
  }
  function endDrag() {
    if (order) orderDraft(order);
    setOrder(null);
    setDragging(null);
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
        <p className="text-body-small text-black">Prioritize my tasks. #1 matters most.</p>
        <div className="flex flex-col gap-8" onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {ids.map((id, i) => {
            const o = byId.get(id)!;
            return (
              <div
                key={id}
                ref={(el) => {
                  if (el) rows.current.set(id, el);
                  else rows.current.delete(id);
                }}
                className={`relative transition-opacity ${dragging === id ? "opacity-75" : ""}`}
              >
                <OutcomeCard
                  outcome={o}
                  rank={i + 1}
                  corner={
                    <>
                      <CornerButton label={`Move “${o.text}” down`} disabled={i === ids.length - 1} onClick={() => orderDraft(move(i, i + 1))}>
                        <Image src="/icons/chevron-down.svg" alt="" width={20} height={20} />
                      </CornerButton>
                      <CornerButton label={`Move “${o.text}” up`} disabled={i === 0} onClick={() => orderDraft(move(i, i - 1))}>
                        <Image src="/icons/chevron-up.svg" alt="" width={20} height={20} />
                      </CornerButton>
                    </>
                  }
                />
                {/* Drag handle over the #rank chip. */}
                <span
                  aria-hidden
                  onPointerDown={(e) => {
                    e.currentTarget.parentElement?.parentElement?.setPointerCapture?.(e.pointerId);
                    setDragging(id);
                  }}
                  className="absolute left-12 top-12 h-[28px] w-[44px] cursor-grab touch-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      <StackedButtons>
        <PrimaryButton onClick={() => setConfirming(true)}>Start My New Game</PrimaryButton>
        <GreyCta onClick={() => setCancelling(true)}>Cancel My Game</GreyCta>
      </StackedButtons>

      {confirming && (
        <PopUpSheet title="Ready to start?" onClose={() => setConfirming(false)} variant="bottom" closable={false}>
          <p className="text-body text-black">
            My {draft.length} task{draft.length === 1 ? " is" : "s are"} set. Once the period begins, they stay as they are.
          </p>
          <StackedButtons>
            <button
              type="button"
              onClick={() => {
                leaving.current = true;
                startPeriod();
                router.push("/outcomes/period");
              }}
              className="w-full rounded-8 bg-primary-600 py-16 text-button-cta text-white"
            >
              Yes, start my game
            </button>
            <GreyCta onClick={() => setConfirming(false)}>Not yet, one more look</GreyCta>
          </StackedButtons>
        </PopUpSheet>
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
