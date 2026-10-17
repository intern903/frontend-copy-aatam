"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LifeAreaCard, LifeAreaImageSheet } from "@/components/settings/LifeAreaImage";
import { useApp } from "@/lib/store";

// Figma "Life Area Images". Header (back → /settings) comes from the shell.
// One card per life area, in the app's life-area order. ?area=<id> opens that area's sheet.
function LifeAreaImages() {
  const router = useRouter();
  const openId = useSearchParams().get("area");
  const { cif } = useApp();
  const open = cif.lifeAreas.find((a) => a.id === openId);

  const go = (query: string) => router.replace(`/settings/life-area-images${query}`, { scroll: false });

  return (
    <main className="px-32">
      <p className="mt-20 text-body text-black">
        Make each life area feel like yours. Tap a card to change its picture.
      </p>
      <div className="mt-20 flex flex-col gap-12">
        {cif.lifeAreas.map((area) => (
          <LifeAreaCard key={area.id} id={area.id} name={area.name} onOpen={() => go(`?area=${area.id}`)} />
        ))}
      </div>
      {open && <LifeAreaImageSheet id={open.id} name={open.name} onClose={() => go("")} />}
    </main>
  );
}

export default function LifeAreaImagesPage() {
  return (
    <Suspense>
      <LifeAreaImages />
    </Suspense>
  );
}
