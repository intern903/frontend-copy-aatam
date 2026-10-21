"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CoachPopup from "@/components/home/CoachPopup";
import HomeHeader from "@/components/home/HomeHeader";
import ModuleLabel from "@/components/home/ModuleLabel";
import { openCompanion } from "@/lib/companion";
import { getModuleProgress, type ModuleId } from "@/lib/modules";
import { cifDone, useApp } from "@/lib/store";

// Label positions on the 393 × 852 Figma Homepage frame.
const modules: { id: ModuleId; label: string; position: React.CSSProperties }[] = [
  { id: "vision", label: "My Vision", position: { left: 18, top: 340 } },
  { id: "values", label: "My Values", position: { left: 98, top: 381 } },
  { id: "qualities", label: "My Qualities", position: { left: 271, top: 363 } },
  { id: "guidelines", label: "My Life Codes", position: { left: 125, top: 576 } },
  // Not where Figma has "Myself" (x 32, y 626): the longer name would run into My Companion,
  // so it sits one row up, clear of My Life Codes and the arrow beside it.
  { id: "myself", label: "Get to Know You form", position: { left: 18, top: 600 } },
];

export default function HomePage() {
  const router = useRouter();
  const state = useApp();
  const [showPopup, setShowPopup] = useState<"coach" | "cif" | null>(null);

  function open(id: ModuleId) {
    // Everything but the Get to Know You form (the CIF) stays locked until it is submitted.
    if (id !== "myself" && !cifDone(state)) return setShowPopup("cif");
    const { href } = getModuleProgress(state, id);
    if (href) router.push(href);
    else setShowPopup("coach");
  }

  return (
    <main className="relative h-frame w-full overflow-hidden">
      <Image
        src="/images/home-illustration.png"
        alt="A traveller on a hillside at dusk watches a steam train cross a stone bridge towards the mountains, under a bright guiding star."
        fill
        priority
        sizes="393px"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-black/10" />

      <HomeHeader name={state.user?.name ?? ""} />

      {/* My Life Purpose — the star */}
      <div className="absolute" style={{ left: 110, top: 124 }}>
        <ModuleLabel
          label="My Life Purpose"
          size="h4"
          progress={getModuleProgress(state, "lifePurpose")}
          locked={!cifDone(state)}
          onClick={() => open("lifePurpose")}
        />
      </div>

      {modules.map((m) => (
        <div key={m.id} className="absolute" style={m.position}>
          <ModuleLabel
            label={m.label}
            progress={getModuleProgress(state, m.id)}
            locked={m.id !== "myself" && !cifDone(state)}
            next={m.id === "myself" && !cifDone(state)}
            onClick={() => open(m.id)}
          />
        </div>
      ))}

      {/* Arrow beside My Life Codes */}
      <Image
        src="/icons/guidelines-arrow.svg"
        alt=""
        width={19}
        height={17}
        className="absolute"
        style={{ left: 170, top: 560 }}
      />

      {/* My Journey — the train; tilted 9.5° as in Figma. Held from the right edge, not Figma's
          left, so a wider label (lock, tick or percentage) never runs off the screen. */}
      <div className="absolute flex items-center justify-end" style={{ right: 20, top: 539.56, height: 31.94 }}>
        <div className="rotate-[9.5deg]">
          <ModuleLabel
            label="My Journey"
            progress={getModuleProgress(state, "journey")}
            locked={!cifDone(state)}
            onClick={() => open("journey")}
          />
        </div>
      </div>

      {/* My Companion — the butterfly; opens the CCA chat, no progress state */}
      <div className="absolute" style={{ left: 91, top: 631 }}>
        <ModuleLabel
          label="My Companion"
          locked={!cifDone(state)}
          onClick={() => (cifDone(state) ? openCompanion("home") : setShowPopup("cif"))}
        />
      </div>

      {showPopup && <CoachPopup cif={showPopup === "cif"} onClose={() => setShowPopup(null)} />}
    </main>
  );
}
