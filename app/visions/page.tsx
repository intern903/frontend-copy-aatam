"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { LifeAreaCard } from "@/components/settings/LifeAreaImage";
import { PurposeBanner, PurposeNode, VisionCard } from "@/components/visions/ui";
import { lifeAreas } from "@/lib/data";
import { addVisionArea, finalizeVisionAreas, removeVisionArea, useApp } from "@/lib/store";
import { hasVision, pickedAreas } from "@/lib/visions";

// Figma "Vision - Flow Screen 1 / 12 / 11": the Life Purpose card, then "My Vision" and the
// client's picked life areas (their CIF focus areas plus any they add). An area with a vision is
// the wide card with its preview (tap to read it, arrow to edit); one without is a faded tile —
// its empty state — that starts the four questions. "Add Life Area" adds another area.
// The client first settles their areas (add, or take off with the ×) and taps "Finalise My Life
// Areas"; only then do the tiles open the questions, and the areas can't be changed after.
//
// The My Life Purpose node at the top leads back to My Foundation (it is this screen's back).
//
// HARD RULE: the app never writes a vision. It only asks and holds.
export default function VisionsPage() {
  const router = useRouter();
  const state = useApp();
  const [adding, setAdding] = useState(false);
  const picked = pickedAreas(state);
  const byArea = state.visions.byLifeArea;
  const withVision = picked.filter((a) => hasVision(byArea[a.id]));
  const without = picked.filter((a) => !hasVision(byArea[a.id]));
  const others = lifeAreas.filter((a) => !picked.some((p) => p.id === a.id));
  const final = state.visions.areasFinal;

  return (
    <main className="flex flex-col items-center gap-20 px-32 pb-40">
      <PurposeNode />
      <div>
        <PurposeBanner />
      </div>

      <div className="flex w-content flex-col gap-20">
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-h3 text-black">My Vision</h1>
          <p className="text-caption text-ink-brown">My Life Purpose, expressed in each area of my life</p>
        </div>

        <div className="grid grid-cols-2 gap-10">
          {withVision.map((a) => (
            <div key={a.id} className="col-span-2">
              <VisionCard vision={byArea[a.id]!} onArrow={() => router.push(`/visions/${a.id}/write`)} />
            </div>
          ))}
          {without.map((a) =>
            final ? (
              <LifeAreaCard key={a.id} id={a.id} name={a.name} variant="tile" faded onOpen={() => router.push(`/visions/${a.id}/questions`)} />
            ) : (
              // Still choosing: the tile can't be opened yet; the × takes it off the list.
              <div key={a.id} className="relative">
                <LifeAreaCard id={a.id} name={a.name} variant="tile" onOpen={() => {}} />
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => removeVisionArea(a.id)}
                  className="absolute right-8 top-8 flex size-icon items-center justify-center rounded-pill bg-background"
                >
                  <Image src="/icons/x.svg" alt="" width={16} height={16} />
                </button>
              </div>
            ),
          )}
          {!final && others.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex aspect-square flex-col items-center justify-center gap-10 rounded-12 bg-white p-12"
            >
              <Image src="/icons/plus.svg" alt="" width={32} height={32} />
              <span className="text-body text-black/50">Add Life Area</span>
            </button>
          )}
        </div>

        {!final ? (
          <div className="flex flex-col gap-8">
            <p className="text-caption text-ink-brown">Choose the life areas you want a vision for. Once you finalise them, the questions open and the areas stay as they are.</p>
            <PrimaryButton disabled={picked.length === 0} onClick={finalizeVisionAreas}>
              Finalise My Life Areas
            </PrimaryButton>
          </div>
        ) : (
          withVision.length > 0 && <PrimaryButton href="/visions/all">Feels mine</PrimaryButton>
        )}
      </div>

      {adding && (
        // Not in Figma: the list behind "Add Life Area", built from the same pop-up.
        <PopUpSheet title="Add Life Area" radius="md" onClose={() => setAdding(false)}>
          <div className="flex flex-col gap-8">
            {others.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  addVisionArea(a.id);
                  setAdding(false);
                }}
                className="flex flex-col items-start rounded-12 border-hairline border-background-600 p-12 text-left"
              >
                <span className="text-body text-black">{a.name}</span>
                <span className="text-caption text-ink-50">{a.description}</span>
              </button>
            ))}
          </div>
        </PopUpSheet>
      )}
    </main>
  );
}
