"use client";

import BackButton from "@/components/shell/BackButton";
import Image from "next/image";
import Link from "next/link";
import LifeCodeCard from "@/components/engine/LifeCodeCard";
import { DayBar, TickButton } from "@/components/engine/Tracking";
import { DotTags, OutOfTen, PurposeGoals, ScoreBoxes, SectionHead, useTabSwipe } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import type { Outcome, Period } from "@/lib/data";
import { byPriority, periodDays } from "@/lib/outcomes";
import { setOutcomeScore, useApp } from "@/lib/store";
import { areaColour, areaName } from "@/lib/visions";

// Figma "RG - Today": the tab My Journey opens on. "My Game · N days left" leads to the current
// period; My Life Codes leads to the list; then today's tracking for the outcomes the client
// chose to track. A Doing outcome is ticked once a day, and its bar has one part per day of the
// period, filled for the days ticked (never marked against the others). A Being outcome is
// scored out of 10. Ticking one opens the companion with "I just completed: …".
// Under the My Life Codes banner, five of the client's life codes and "See all" (Engine flow 0A.1).
// "My Game ›" (or a swipe left) goes to the current period.

export default function TodayPage() {
  const hydrated = useHydrated();
  const { outcomes, lifeCodes } = useApp();
  const swipe = useTabSwipe({ left: "/outcomes/period" });
  const codes = lifeCodes.filter((c) => c.status === "active");
  const period = outcomes.period;
  const days = period ? periodDays(period) : null;
  const tracked = byPriority(outcomes.currentPeriod).filter((o) => o.track);

  return (
    <main {...swipe} className="flex touch-pan-y flex-col gap-20 px-32 pb-40">
      <div className="flex items-center justify-between pt-header-top">
        <BackButton />
        <Link href="/outcomes/period" className="flex items-center gap-4 rounded-24 bg-white px-16 py-8 text-body-medium text-black">
          My Game
          {days && (
            <>
              <span className="size-2 rounded-2 bg-ink-60" />
              {days.left > 0 ? `${days.left} day${days.left === 1 ? "" : "s"} left` : "Ready to close"}
            </>
          )}
          <Image src="/icons/chevron-right-20.svg" alt="" width={20} height={20} />
        </Link>
      </div>
      <div className="-mt-4">
        <PurposeGoals />
      </div>

      <Link href="/life-code" className="relative flex items-center justify-end gap-4 overflow-hidden rounded-24 px-16 pb-40 pt-16">
        <Image src="/images/engine/life-codes-banner.jpg" alt="" fill sizes="329px" className="object-cover object-[50%_45%]" />
        <span className="relative font-heading text-h3 text-black">My Life Codes</span>
        <Image src="/icons/chevron-right-24.svg" alt="" width={24} height={24} className="relative" />
      </Link>

      {hydrated && (
        <div className="-mt-8 flex flex-col gap-8">
          {codes.length === 0 ? (
            <p className="text-body-small text-ink-60">Your life codes build up as you go, and the first ones will show here.</p>
          ) : (
            <>
              {codes.slice(0, 5).map((c) => (
                <LifeCodeCard key={c.id} code={c} href={`/life-code/${c.id}`} compact />
              ))}
              <Link href="/life-code" className="self-end text-caption text-primary-600 underline">
                See all {codes.length} life codes
              </Link>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-16">
        <SectionHead title="My Today’s Outcomes Tracking" />
        {!hydrated ? null : !period ? (
          <div className="flex flex-col gap-12 rounded-24 bg-white px-16 py-12">
            <p className="text-body-small text-black">No period yet. Set one up to start tracking.</p>
            <PrimaryButton href="/outcomes/period">Go to My Current Period</PrimaryButton>
          </div>
        ) : tracked.length === 0 ? (
          <p className="text-body-small text-ink-60">
            Nothing to track today. Outcomes you choose to track when you set up a period show here.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {tracked.map((o) =>
              o.type === "Doing" ? (
                <DoingRow key={o.id} outcome={o} period={period} />
              ) : (
                <BeingRow key={o.id} outcome={o} />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Head({ outcome, right }: { outcome: Outcome; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-body text-black">{outcome.text}</p>
        <span className="flex items-center gap-8">
          <span className={`size-8 shrink-0 rounded-4 ${areaColour(outcome.lifeArea).solid}`} />
          <DotTags tags={[areaName(outcome.lifeArea), outcome.type]} />
        </span>
      </div>
      {right}
    </div>
  );
}

function DoingRow({ outcome, period }: { outcome: Outcome; period: Period }) {
  return (
    <section className="flex flex-col gap-8 rounded-24 bg-white px-16 py-12">
      <Head outcome={outcome} right={<TickButton outcome={outcome} />} />
      <DayBar outcome={outcome} period={period} />
    </section>
  );
}

function BeingRow({ outcome }: { outcome: Outcome }) {
  const { solid, soft } = areaColour(outcome.lifeArea);
  return (
    <section className="flex flex-col gap-8 rounded-24 bg-white px-16 py-12">
      <Head outcome={outcome} right={<OutOfTen score={outcome.score} />} />
      <ScoreBoxes score={outcome.score} colours={{ on: solid, off: soft }} label={`${outcome.text}, out of 10`} onPick={(n) => setOutcomeScore(outcome.id, n)} />
    </section>
  );
}
