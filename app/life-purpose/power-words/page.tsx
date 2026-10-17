"use client";

import { LpHeader, PrimaryButton } from "@/components/life-purpose/ui";
import { clusterColour } from "@/lib/lifePurpose";
import { useApp } from "@/lib/store";

// Figma "LP - Power Words": each named cluster as a power word, with its words under it.
export default function PowerWordsPage() {
  const { lifePurpose: lp } = useApp();
  const named = lp.clusters.filter((c) => c.name.trim());
  const wordCount = named.reduce((n, c) => n + c.words.length, 0);

  return (
    <main className="flex min-h-screen flex-col px-32 pb-40">
      <LpHeader />
      <h1 className="mt-24 font-heading text-h1 text-black">My power words are...</h1>
      <p className="mt-8 text-body-small text-ink-80">
        I turned {wordCount} key words/phrases into {named.length} power word{named.length === 1 ? "" : "s"}
      </p>
      <div className="mt-20 flex flex-col gap-24">
        {named.map((c, i) => (
          <section
            key={c.name + i}
            className="flex flex-col items-start gap-8 motion-safe:animate-rise"
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
          >
            <span className={`rounded-16 px-16 py-8 font-heading text-h2 text-white ${clusterColour(i).solid}`}>{c.name}</span>
            <p className="flex flex-wrap items-center gap-4 text-caption text-ink-60">
              {c.words.map((w, j) => (
                <span key={w} className="flex items-center gap-4">
                  {j > 0 && <span aria-hidden className="size-4 rounded-2 bg-ink-60" />}
                  {w}
                </span>
              ))}
            </p>
          </section>
        ))}
      </div>
      <div className="mt-auto pt-40">
        <PrimaryButton href="/life-purpose/write">Start with My Life Purpose</PrimaryButton>
      </div>
    </main>
  );
}
