"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LpHeader, WordPill } from "@/components/life-purpose/ui";
import type { Cluster } from "@/lib/data";
import { BOARD_GRADIENTS, clusterColour, wordsFromStories } from "@/lib/lifePurpose";
import { setClusters, useApp } from "@/lib/store";

// Figma "LP - Select Cluster 1/2" (portrait) and "LP - Select Cluster Landscape" (phone on its side).
// The client's words lie scattered on a board that scrolls sideways; tapping a word puts it in
// the current cluster (it fills with the cluster's colour, grows, and a thread joins it to the
// cluster's other words). Words already in another cluster leave the pool. Two buttons, per the
// Life Purpose flow: "Next" finishes this cluster and starts another; "Wrap up" stays muted until
// every word is in a cluster, then takes Next's place. The client groups the words; the app never groups them itself.
// Landscape shows on a phone held sideways, or with ?landscape=1 for testing on desktop.
// ?cluster=N opens on cluster N.

const ROW_H = 56;
const TILTS = [-4, 0, 4, -4, 4, 0, -4, 4];

/** Lays the words out in loose rows across a board of the given width, each with a small tilt. */
function layout(words: string[], width: number) {
  let x = 16;
  let y = 14;
  return words.map((word, i) => {
    const w = word.length * 8.4 + 34;
    if (x + w > width - 16) {
      x = 16 + (i % 3) * 6;
      y += ROW_H;
    }
    const spot = { word, x, y, w, tilt: TILTS[i % TILTS.length] };
    x += w + 14;
    return spot;
  });
}

/** A phone turned on its side (short and wide). Desktop windows stay portrait. */
function useLandscape(forced: boolean) {
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const sync = () => setLandscape(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return forced || landscape;
}

export default function ClusteringPage() {
  return (
    <Suspense>
      <Clustering />
    </Suspense>
  );
}

function Clustering() {
  const router = useRouter();
  const params = useSearchParams();
  const landscape = useLandscape(params.get("landscape") === "1");
  const { lifePurpose: lp } = useApp();
  const words = useMemo(() => wordsFromStories(lp.stories), [lp.stories]);
  const canvasW = landscape ? 900 : 560;
  const spots = useMemo(() => layout(words, canvasW), [words, canvasW]);
  const canvasH = Math.max(landscape ? 272 : 521, (spots[spots.length - 1]?.y ?? 0) + ROW_H + 40);

  const clusters: Cluster[] = lp.clusters;
  const [current, setCurrent] = useState(() => {
    const asked = Number(params.get("cluster"));
    return asked >= 1 ? Math.min(asked - 1, lp.clusters.length) : Math.max(0, lp.clusters.length - 1);
  });
  const [zoom, setZoom] = useState(1);
  const colour = clusterColour(current);

  const clusterOf = (word: string) =>
    clusters.findIndex((c) => c.words.some((w) => w.toLowerCase() === word.toLowerCase()));
  const unclustered = words.filter((w) => clusterOf(w) === -1);
  const working: Cluster[] = current < clusters.length ? clusters : [...clusters, { name: "", words: [] }];
  const currentWords = working[current]?.words ?? [];
  const allClustered = unclustered.length === 0 && words.length > 0;

  function toggle(word: string) {
    const inCurrent = clusterOf(word) === current;
    const next = working.map((c, i) => {
      const without = c.words.filter((w) => w.toLowerCase() !== word.toLowerCase());
      return i === current && !inCurrent ? { ...c, words: [...without, word] } : { ...c, words: without };
    });
    // Drop clusters emptied out (other than the one being built), keeping the current index right.
    const kept = next.filter((c, i) => c.words.length > 0 || i === current);
    setCurrent(kept.indexOf(next[current]));
    setClusters(kept.filter((c) => c.words.length > 0));
  }

  const points = currentWords
    .map((w) => spots.find((s) => s.word.toLowerCase() === w.toLowerCase()))
    .filter(Boolean)
    .map((s) => `${s!.x + s!.w / 2},${s!.y + 20}`)
    .join(" ");

  const pill = (
    <div className={`inline-flex shrink-0 items-center gap-8 rounded-pill px-[17px] py-8 ${colour.soft}`}>
      <span className={`size-12 rounded-pill ${colour.solid}`} />
      <span className="text-body-medium text-primary-800">Cluster {current + 1}</span>
    </div>
  );

  const board = (
    <div className="relative size-full">
      <div
        className="size-full overflow-auto rounded-24"
        style={{ backgroundImage: `linear-gradient(105deg, ${BOARD_GRADIENTS[current % BOARD_GRADIENTS.length]} 0%, rgb(255 255 255 / 0) 100%)` }}
      >
        <div style={{ width: canvasW * zoom, height: canvasH * zoom }}>
          <div className="relative origin-top-left" style={{ width: canvasW, height: canvasH, transform: `scale(${zoom})` }}>
            <svg className="pointer-events-none absolute inset-0" width={canvasW} height={canvasH} aria-hidden>
              <polyline points={points} fill="none" stroke={colour.line} strokeWidth={1} strokeDasharray="4 4" />
            </svg>
            {spots.map((s) => {
              const owner = clusterOf(s.word);
              const mine = owner === current;
              if (owner !== -1 && !mine) return null; // already used: out of the pool
              return (
                <div key={s.word} className="absolute" style={{ left: s.x, top: s.y }}>
                  <WordPill
                    word={s.word}
                    tilt={s.tilt}
                    large={mine}
                    fill={mine ? colour.solid : undefined}
                    onClick={() => toggle(s.word)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 flex gap-4">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.15).toFixed(2)))}>
          <Image src="/icons/plus-circle.svg" alt="" width={32} height={32} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}>
          <Image src="/icons/minus-circle.svg" alt="" width={32} height={32} />
        </button>
      </div>
    </div>
  );

  const circles = working.map((c, i) =>
    c.words.length || i === current ? (
      <button
        key={i}
        type="button"
        aria-label={`Cluster ${i + 1}, ${c.words.length} words`}
        aria-current={i === current}
        onClick={() => setCurrent(i)}
        className={`flex size-icon-button shrink-0 items-center justify-center rounded-pill font-mono text-stat-large text-white ${clusterColour(i).solid}`}
      >
        {c.words.length}
      </button>
    ) : null,
  );

  // While clusters are being made: "Next" starts the next cluster and "Wrap up" is disabled.
  // Once the last word is in a cluster, "Wrap up" takes Next's place.
  const actions = (vertical: boolean) => (
    <div className={`flex gap-8 ${vertical ? "flex-col items-stretch" : "items-center"}`}>
      {allClustered ? (
        <button type="button" onClick={() => router.push("/life-purpose/naming")} className="rounded-8 bg-olive px-16 py-8 text-button-cta text-white">
          Wrap up
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={currentWords.length === 0}
            onClick={() => setCurrent(working.length)}
            className="rounded-8 bg-primary-600 px-16 py-8 text-button-cta text-white disabled:opacity-50"
          >
            Next
          </button>
          <button type="button" disabled aria-disabled className="cursor-not-allowed rounded-8 bg-cancel px-16 py-8 text-button-cta text-cancel-text opacity-50">
            Wrap up
          </button>
        </>
      )}
    </div>
  );

  if (!words.length) {
    return (
      <main className="px-32 pb-24">
        <LpHeader />
        <p className="mt-24 text-body text-black">Your key words come from your life stories.</p>
        <Link href="/life-purpose/stories" className="mt-16 inline-block rounded-8 bg-primary-600 px-16 py-12 text-button-cta text-white">
          Add my life stories
        </Link>
      </main>
    );
  }

  if (landscape) {
    // Figma "LP - Select Cluster Landscape": header across the top, board on the left,
    // cluster circles stacked on the right, "Wrap Up" (olive) bottom right.
    return (
      <main className="fixed inset-0 z-30 flex flex-col gap-12 bg-background px-32 py-24">
        <div className="flex items-center gap-16">
          <Link href="/life-purpose" aria-label="Back" className="flex size-icon-button shrink-0 items-center justify-center rounded-pill bg-white">
            <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} />
          </Link>
          {pill}
          <p className="text-body-small text-black">Tap the words that feel like they belong together.</p>
        </div>
        <div className="flex min-h-0 flex-1 gap-16">
          <div className="min-w-0 flex-1">{board}</div>
          <div className="flex w-[96px] flex-col items-end justify-between">
            <div className="flex flex-col gap-8 overflow-y-auto">{circles}</div>
            {actions(true)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-32 pb-24">
      <LpHeader />
      <div className="mt-16">{pill}</div>
      <p className="mt-8 text-body-small text-black">
        Tap the words that feel like they belong together. All keywords/phrases must be clustered.
      </p>
      <div className="mt-16 h-cluster-board w-content">{board}</div>
      <div className="mt-20 flex items-center justify-between">
        <div className="flex gap-8 overflow-x-auto">{circles}</div>
        {actions(false)}
      </div>
    </main>
  );
}
