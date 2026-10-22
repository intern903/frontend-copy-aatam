"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LpHeader, PrimaryButton } from "@/components/life-purpose/ui";
import { PurposeBanner } from "@/components/visions/ui";
import type { Trait } from "@/lib/data";
import { screenFor } from "@/lib/discovery";
import { useApp } from "@/lib/store";
import { useHydrated } from "./ui";

// Figma "VQ - Begin" (My Values / My Qualities): the confirmed lists, opened from My Foundation.
// Each row turns over when tapped to show its label and the moments that credited it.
// The pill at the top switches between the two lists; the nav (from the shell) sits below, and its
// Home goes to the home page. With nothing confirmed yet, the list area invites the client into
// the discovery instead (not in Figma).
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.

const KINDS = {
  values: {
    title: "Values",
    caption:
      "“Why” behind my choices - guiding principles for who I want to be",
    tint: "bg-blue-100",
    arrow: "bg-blue-500",
    other: {
      href: "/values/qualities",
      label: "Qualities",
      side: "right" as const,
    },
  },
  qualities: {
    title: "Qualities",
    caption: "“How” I feel when living on my values",
    tint: "bg-yellow-100",
    arrow: "bg-yellow-500",
    other: { href: "/values/mine", label: "Values", side: "left" as const },
  },
};

export default function MyList({ kind }: { kind: keyof typeof KINDS }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const app = useApp();
  const slice = app[kind];
  const k = KINDS[kind];
  const confirmed = slice.selected.filter((t) => slice.final.includes(t.id));
  const empty = confirmed.length === 0 && slice.added.length === 0;
  const run = app.discovery;
  const resumable = run && run.state.stage !== "done" && run.state.answered > 0;
  if (!hydrated) return null;

  return (
    <main className="flex flex-col px-32 pb-40">
      <LpHeader search />
      <div
        className={`mt-20 flex ${k.other.side === "right" ? "justify-end" : "justify-start"}`}
      >
        <Link
          href={k.other.href}
          className="flex items-center gap-4 rounded-24 bg-white px-16 py-8 text-body-medium text-black"
        >
          {k.other.side === "left" && (
            <Image
              src="/icons/chevron-right.svg"
              alt=""
              width={24}
              height={24}
              className="rotate-180"
            />
          )}
          {k.other.label}
          {k.other.side === "right" && (
            <Image
              src="/icons/chevron-right.svg"
              alt=""
              width={24}
              height={24}
            />
          )}
        </Link>
      </div>
      <div className="mt-20">
        <PurposeBanner />
      </div>
      <h1 className="mt-20 font-heading text-h1 text-black">{k.title}</h1>
      <p className="mt-4 text-caption text-ink-brown">{k.caption}</p>
      {empty ? (
        <div className="mt-32 flex flex-col gap-16">
          <p className="text-body text-black">
            {resumable
              ? "You are part-way through finding your values and qualities."
              : "Answer a few short questions to find your values and qualities."}
          </p>
          <PrimaryButton
            onClick={() =>
              router.push(resumable ? screenFor(run.state) : "/values")
            }
          >
            {resumable
              ? "Continue where I left off"
              : "Find my values & qualities"}
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-32 flex flex-col gap-12">
          {confirmed.map((t) => (
            <Row key={t.id} trait={t} tint={k.tint} arrow={k.arrow} />
          ))}
          {slice.added.map((name) => (
            <Row
              key={`added:${name}`}
              trait={{
                id: name,
                name,
                strength: "Emerging",
                moments: [],
                score: 0,
              }}
              added
              tint={k.tint}
              arrow={k.arrow}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function Row({
  trait,
  tint,
  arrow,
  added,
}: {
  trait: Trait;
  tint: string;
  arrow: string;
  added?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return open ? (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="flex w-full flex-col gap-8 rounded-24 bg-white p-16 text-left"
    >
      <span className="flex w-full items-center justify-between">
        <span className="text-body text-black">{trait.name}</span>
        <Image src="/icons/x.svg" alt="Close" width={20} height={20} />
      </span>
      <span className="border-t border-black" />
      <span className="text-body-small text-black/75">
        {added
          ? "Added by you"
          : `${trait.strength} · ${trait.moments.join(", ")}`}
      </span>
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`flex w-full items-center justify-between rounded-24 p-16 text-left ${tint}`}
    >
      <span className="font-heading text-h3 text-black">{trait.name}</span>
      <span className={`rounded-pill p-4 ${arrow}`}>
        <Image
          src="/icons/arrow-right-white.svg"
          alt=""
          width={20}
          height={20}
        />
      </span>
    </button>
  );
}
