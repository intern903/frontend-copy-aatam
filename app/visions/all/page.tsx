"use client";

import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { PurposeBanner, PurposeNode, VisionCard } from "@/components/visions/ui";
import { lifeAreas } from "@/lib/data";
import { useApp } from "@/lib/store";
import { hasVision } from "@/lib/visions";

// Figma "Vision - Final Screen": every vision in one view, under the Life Purpose card. Each area
// is its wide card, stacked and scrolled; tap a card to turn it over and read the vision, and
// the pencil opens that area to edit it (and Cancel comes back here). The My Life Purpose node at
// the top leads to My Foundation, as on the areas screen. The bottom nav stays on "My Foundation".
export default function AllVisionsPage() {
  const router = useRouter();
  const { visions } = useApp();
  const done = lifeAreas.filter((a) => hasVision(visions.byLifeArea[a.id]));

  return (
    <main className="flex flex-col items-center gap-20 px-32 pb-40">
      <PurposeNode />
      <div>
        <PurposeBanner />
      </div>
      <div className="flex w-content flex-col gap-20">
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-h3 text-black">Vision</h1>
          <p className="text-caption text-ink-brown">Life Purpose, expressed in each area of my life</p>
        </div>
        {done.length === 0 ? (
          <>
            <p className="text-body-small text-ink-50">Your visions will appear here once you have written them.</p>
            <PrimaryButton href="/visions">Start my visions</PrimaryButton>
          </>
        ) : (
          <div className="flex flex-col gap-10">
            {done.map((a) => (
              <VisionCard key={a.id} vision={visions.byLifeArea[a.id]!} onArrow={() => router.push(`/visions/${a.id}/write?from=${encodeURIComponent("/visions/all")}`)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
