"use client";

import Image from "next/image";
import type { Outcome, Period } from "@/lib/data";
import { openCompanion } from "@/lib/companion";
import { addDays, dateOf, isoDate, periodDays, today } from "@/lib/outcomes";
import { toggleTick } from "@/lib/store";
import { areaColour } from "@/lib/visions";

// Daily tracking for an outcome the client chose to track, shared by Today and the current
// period. One tick a day; ticking it leads straight into the companion ("I just completed: …").
// The bar has one part per day of the period, filled for the days ticked and plain otherwise:
// never red, never marked against a day.

export function tickedToday(o: Outcome) {
  return o.ticks.includes(isoDate(today()));
}

/** Figma "Results Game State/Front Side": the 33 × 32 circle with the check, in the area colour. */
export function TickButton({ outcome }: { outcome: Outcome }) {
  const { solid } = areaColour(outcome.lifeArea);
  const ticked = tickedToday(outcome);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ticked}
      aria-label={`Done today: ${outcome.text}`}
      onClick={() => {
        toggleTick(outcome.id, isoDate(today()));
        if (!ticked) openCompanion("outcomes", `I just completed: ${outcome.text}`);
      }}
      className={`flex h-[32px] w-[33px] shrink-0 items-center justify-center rounded-pill border p-4 ${ticked ? solid : "bg-white"} ${solid.replace("bg-", "border-")}`}
    >
      <Image src="/icons/check-circle-white.svg" alt="" width={24} height={24} />
    </button>
  );
}

export function DayBar({ outcome, period }: { outcome: Outcome; period: Period }) {
  const { solid, soft } = areaColour(outcome.lifeArea);
  const total = periodDays(period).total;
  const start = dateOf(period.start);
  return (
    <div className="flex w-full gap-2" aria-label={`${outcome.ticks.length} of ${total} days ticked`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-4 flex-1 rounded-4 ${outcome.ticks.includes(isoDate(addDays(start, i))) ? solid : soft}`} />
      ))}
    </div>
  );
}
