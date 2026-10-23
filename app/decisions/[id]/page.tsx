"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breakdown, DecisionCard, PageTitle } from "@/components/decisions/ui";
import BackButton from "@/components/shell/BackButton";
import { useHydrated } from "@/components/values/ui";
import { useApp } from "@/lib/store";

// One decision, opened from the list. What it shows depends on where the decision stands:
//   draft     — Figma "DT - Draft" (1667:12933): the card and "Continue where I left off".
//   completed — Figma "DT - Completed" (1667:12574): scored, not taken yet. The card, each choice's
//               breakdown, then Take Decision Later (back to the list) or Now (the final score).
//   decided   — Figma "DT - Decision Taken" (1667:12145): the card with the winning choice and
//               the breakdown, to read back.
export default function DecisionPage({ params }: { params: { id: string } }) {
  const hydrated = useHydrated();
  const d = useApp().decisions.find((x) => x.id === params.id);
  if (!hydrated) return null;
  if (!d) notFound();
  const flow = `/decisions/${d.id}/flow`;

  return (
    <main className="flex flex-col gap-20 px-32 pb-40 pt-header-top">
      <BackButton href="/decisions" />
      {d.status === "decided" ? (
        <PageTitle title="Final Decision" sub="Congratulations! You’ve taken your decision." />
      ) : (
        <PageTitle title="Pending Decision" sub="Take your decision" />
      )}
      <DecisionCard d={d} />

      {d.status === "draft" ? (
        <Link href={`${flow}?step=${d.step}`} className="flex items-center gap-8 self-end rounded-8 bg-primary-600 px-16 py-12 text-button-cta text-white">
          Continue Where I Left Off
          <Image src="/icons/arrow-right-white.svg" alt="" width={16} height={16} />
        </Link>
      ) : (
        <>
          <Breakdown d={d} />
          {d.status === "completed" && (
            <div className="flex gap-12">
              <Link href="/decisions" className="flex-1 rounded-8 bg-cancel py-12 text-center text-button-cta text-cancel-text">
                Take Decision Later
              </Link>
              <Link href={`${flow}?step=9`} className="flex-1 rounded-8 bg-primary-600 py-12 text-center text-button-cta text-white">
                Take Decision Now
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}
