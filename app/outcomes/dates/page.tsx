"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CancelGameSheet, Chip, EngineFrame, EngineTop, GreyCta, SectionHead, StackedButtons, Stepper } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { addDays, daysBetween, isoDate, shortDate, today } from "@/lib/outcomes";
import { cancelDraft, setDraftEnd, useApp } from "@/lib/store";

// Figma "RG - New Date Selection Empty / Selected": the next period starts today (fixed) and the
// client picks when it ends, by date or with 2–5 weeks. The end is meant to land on the next
// session with Dinesh, so booking it sits right here. Saved to the period being built.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function DatesPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { outcomes } = useApp();
  const [cancelling, setCancelling] = useState(false);
  const start = isoDate(today());
  const end = outcomes.draft.end;
  const days = end ? daysBetween(start, end) : 0;
  const valid = !!end && days > 0;
  const startDate = today();

  if (!hydrated) return null;

  return (
    <EngineFrame top={<EngineTop />}>
      <div className="flex flex-col gap-12">
        <SectionHead title="Set Up New Dates" />
        <Stepper current={1} />
      </div>

      <div className="flex flex-col gap-16">
        <p className="text-body-small text-black">My game starts today. Choose when it ends.</p>
        <div className="flex flex-col gap-12 rounded-24 bg-white px-12 py-12">
          <div className="flex items-center gap-16 px-4">
            <span className="w-[40px] text-body-small text-ink-60">Starts</span>
            <span className="flex-1 text-body-small text-black">
              {MONTHS[startDate.getMonth()]} {startDate.getDate()} (Today)
            </span>
            <span className="rounded-pill bg-primary-500 px-8 py-2 text-caption text-white">Fixed</span>
          </div>
          <span className="border-t-hairline border-background-600" />
          <label className="flex items-center gap-16 px-4">
            <span className="w-[40px] text-body-small text-ink-60">Ends</span>
            <input
              type="date"
              min={isoDate(addDays(startDate, 1))}
              value={end ?? ""}
              onChange={(e) => setDraftEnd(e.target.value || null)}
              className="flex-1 rounded-12 border-hairline border-background-600 bg-white px-12 py-8 text-body-small text-black outline-none"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-8">
          {[2, 3, 4, 5].map((w) => {
            const iso = isoDate(addDays(startDate, w * 7));
            return <Chip key={w} label={`${w} weeks`} on={end === iso} onClick={() => setDraftEnd(iso)} />;
          })}
        </div>
        {valid && (
          <p className="text-body-small text-black">
            My game runs for {days} days, ending on {shortDate(end!)}.
          </p>
        )}
        <div className="flex flex-col gap-12 rounded-24 bg-primary-500 p-16">
          <p className="font-heading text-h4 text-white">Book session with Dinesh</p>
          <Link href="/book-call" className="self-end rounded-8 bg-white px-16 py-12 text-button-cta text-black">
            Book
          </Link>
        </div>
      </div>

      <StackedButtons>
        <PrimaryButton disabled={!valid} onClick={() => router.push("/outcomes/new")}>
          Define My Outcomes
        </PrimaryButton>
        <GreyCta onClick={() => setCancelling(true)}>Cancel My Game</GreyCta>
      </StackedButtons>

      {cancelling && (
        <CancelGameSheet
          onKeep={() => setCancelling(false)}
          onCancel={() => {
            cancelDraft();
            router.push("/outcomes/period");
          }}
        />
      )}
    </EngineFrame>
  );
}
