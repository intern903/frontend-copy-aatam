"use client";

import Image from "next/image";
import { useState } from "react";
import { LifeAreaCard } from "@/components/settings/LifeAreaImage";
import type { Outcome } from "@/lib/data";
import { areaColour, areaName } from "@/lib/visions";

/**
 * One outcome (Figma "RG - Game Card", "RG - New Game Card", "RG - Prioritize New Game Card").
 * Front: the life area's photo card (LifeAreaCard "vision") with the outcome's rank top-left, its
 * Doing or Being tag bottom-left and a control top-right. Tapping the photo turns it over to
 * the client's own words; the X turns it back.
 *
 * Doing and Being are drawn the same size, weight and colour: neither outranks the other.
 */
export default function OutcomeCard({
  outcome,
  rank,
  corner,
  status,
  onRemove,
}: {
  outcome: Outcome;
  rank?: number;
  corner?: React.ReactNode; // top-right control (note, chevrons)
  status?: React.ReactNode; // shown at the foot of the back (e.g. "Done")
  onRemove?: () => void; // the X on a card still being built removes it
}) {
  const [flipped, setFlipped] = useState(false);
  const colour = areaColour(outcome.lifeArea).solid;
  const name = areaName(outcome.lifeArea);

  return (
    // Only the side facing the client is drawn (with a quick turn). Both sides used to be stacked
    // in 3D, and the hidden front kept catching taps, so the X on the back did nothing.
    <div className="h-area-card w-full [perspective:1000px]">
      <div
        key={flipped ? "back" : "front"}
        className="relative size-full animate-card-turn"
      >
        {!flipped ? (
          <div className="absolute inset-0">
            <LifeAreaCard
              id={outcome.lifeArea}
              name={name}
              variant="vision"
              onOpen={() => setFlipped(true)}
              onArrow={() => setFlipped(true)}
            />
            {rank !== undefined && (
              <span
                className={`pointer-events-none absolute left-12 top-12 rounded-pill px-8 py-2 font-mono text-body text-white ${colour}`}
              >
                #{rank}
              </span>
            )}
            <TypeTag
              type={outcome.type}
              colour={colour}
              className="pointer-events-none absolute bottom-12 left-12"
            />
            {corner && (
              <div className="absolute right-12 top-12 flex items-center gap-4">
                {corner}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between gap-12 overflow-y-auto rounded-24 bg-white p-16">
            <div className="flex flex-col gap-12">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Turn over"
                  onClick={() => setFlipped(false)}
                  className="flex size-icon items-center justify-center"
                >
                  <Image src="/icons/x.svg" alt="" width={16} height={16} />
                </button>
                <TypeTag type={outcome.type} colour={colour} />
              </div>
              <p className="text-body text-black">{outcome.text}</p>
            </div>
            {(status || onRemove) && (
              <div className="flex items-center justify-between">
                {status ?? <span />}
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="text-caption text-ink-60 underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypeTag({
  type,
  colour,
  className = "",
}: {
  type: Outcome["type"];
  colour: string;
  className?: string;
}) {
  return (
    <span
      className={`rounded-pill px-8 py-2 text-caption text-white ${colour} ${className}`}
    >
      {type}
    </span>
  );
}

/** The 28px white circle with a Primary/500 ring that holds a card's top-right control. */
export function CornerButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-[28px] items-center justify-center rounded-pill border-2 border-primary-500 bg-white p-4 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
