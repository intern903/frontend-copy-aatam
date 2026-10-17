"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LpHeader, PrimaryButton } from "@/components/life-purpose/ui";
import { clusterColour, sparksFor } from "@/lib/lifePurpose";
import { setClusters, setPowerWords, useApp } from "@/lib/store";

// Figma "LP - Name Cluster 1/2": one cluster at a time.
// HARD RULE: the app suggests, the client decides. The name field starts with whatever the
// client typed before (or empty); a "spark" only goes in the field when the client taps it.
export default function NamingPage() {
  return (
    <Suspense>
      <Naming />
    </Suspense>
  );
}

// ?cluster=N opens on cluster N (links in /_index).
function Naming() {
  const router = useRouter();
  const asked = Number(useSearchParams().get("cluster"));
  const { lifePurpose: lp } = useApp();
  const clusters = lp.clusters;
  const [index, setIndex] = useState(() =>
    asked >= 1 ? Math.min(asked - 1, Math.max(0, clusters.length - 1)) : Math.max(0, clusters.findIndex((c) => !c.name.trim())),
  );

  if (!clusters.length) {
    return (
      <main className="px-32">
        <LpHeader />
        <p className="mt-24 text-body text-black">Group your words into clusters first.</p>
      </main>
    );
  }

  const cluster = clusters[Math.min(index, clusters.length - 1)];
  const colour = clusterColour(index);
  const last = index >= clusters.length - 1;
  const setName = (name: string) => setClusters(clusters.map((c, i) => (i === index ? { ...c, name } : c)));

  return (
    <main className="flex min-h-screen flex-col px-32 pb-40">
      <LpHeader />
      {/* One bar per cluster, in its colour; clusters still to name are faded. */}
      <div className="-mx-32 mt-20 flex gap-8" aria-hidden>
        {clusters.map((_, i) => (
          <span key={i} className={`h-4 flex-1 ${clusterColour(i).solid} ${i > index ? "opacity-30" : ""}`} />
        ))}
      </div>

      <h1 className="mt-24 font-heading text-h1 text-black">What do these words say about me?</h1>
      <div className="mt-16 flex flex-wrap gap-8">
        {cluster.words.map((w) => (
          <span key={w} className={`rounded-pill px-16 py-8 text-body-medium text-white ${colour.solid}`}>
            {w}
          </span>
        ))}
      </div>

      <label className="mt-32 flex flex-col gap-4">
        <span className="sr-only">Cluster name</span>
        <input
          value={cluster.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Give this cluster a name"
          className="w-full bg-transparent font-heading text-h2 text-black outline-none placeholder:text-ink-muted"
        />
        <span className="h-px w-full" style={{ backgroundColor: colour.line }} />
      </label>
      <p className="mt-12 text-body-small text-black">Look at the words together. What do they have in common?</p>

      <p className="mt-24 text-body text-black">Need a spark?</p>
      <div className="mt-8 flex flex-wrap gap-8">
        {sparksFor(cluster.words).map((w) => (
          <button key={w} type="button" onClick={() => setName(w)} className="rounded-pill bg-white px-16 py-4 text-body text-ink-75">
            {w}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-40">
        <PrimaryButton
          disabled={!cluster.name.trim()}
          onClick={() => {
            if (!last) return setIndex(index + 1);
            setPowerWords(clusters.map((c) => c.name.trim()));
            router.push("/life-purpose/power-words");
          }}
        >
          {last ? "See My Power Words" : "Next Cluster"}
        </PrimaryButton>
      </div>
    </main>
  );
}
