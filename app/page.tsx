"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Butterfly, { type ButterflyHandle } from "@/components/home/Butterfly";
import HomeHeader from "@/components/home/HomeHeader";
import Landing from "@/components/home/Landing";
import ModuleLabel from "@/components/home/ModuleLabel";
import { openCompanion } from "@/lib/companion";
import { getModuleProgress, type ModuleId } from "@/lib/modules";
import { cifDone, useApp } from "@/lib/store";

// Only needed after a tap on a locked or coach-led module: loaded then, not with the page.
const CoachPopup = dynamic(() => import("@/components/home/CoachPopup"));

// Label positions on the 393 × 852 Figma Homepage frame.
const modules: { id: ModuleId; label: string; position: React.CSSProperties }[] = [
  { id: "vision", label: "Vision", position: { left: 18, top: 340 } },
  { id: "values", label: "Values", position: { left: 98, top: 381 } },
  { id: "qualities", label: "Qualities", position: { left: 271, top: 363 } },
  { id: "guidelines", label: "Life Codes", position: { left: 125, top: 576 } },
  // Not where Figma has "Myself" (x 32, y 626): the longer name would run into My Companion,
  // so it sits one row up, clear of My Life Codes and the arrow beside it.
  { id: "myself", label: "Get to Know You form", position: { left: 18, top: 600 } },
];

export default function HomePage() {
  const router = useRouter();
  const state = useApp();
  const [showPopup, setShowPopup] = useState<"coach" | "cif" | null>(null);
  const butterfly = useRef<ButterflyHandle>(null);
  const busy = useRef(false);

  /** The butterfly flies to the tapped label first; the tap takes effect when it lands. */
  async function reach(el: HTMLElement, then: () => void) {
    if (busy.current) return;
    busy.current = true;
    await butterfly.current?.flyTo(el);
    busy.current = false;
    then();
  }

  function openDecisions(el: HTMLElement) {
    const locked = !cifDone(state);
    if (!locked) router.prefetch("/decisions");
    void reach(el, () => (locked ? setShowPopup("cif") : router.push("/decisions")));
  }

  function open(id: ModuleId, el: HTMLElement) {
    // Everything but the Get to Know You form (the CIF) stays locked until it is submitted.
    const locked = id !== "myself" && !cifDone(state);
    const { href } = getModuleProgress(state, id);
    // Fetch the next screen while the butterfly is in the air, so it opens the moment it lands.
    if (!locked && href) router.prefetch(href);
    void reach(el, () => {
      if (locked) setShowPopup("cif");
      else if (href) router.push(href);
      else setShowPopup("coach");
    });
  }

  return (
    <main className="relative h-frame w-full overflow-hidden">
      <Image
        src="/images/home-illustration.webp"
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
          label="Life Purpose"
          size="h4"
          progress={getModuleProgress(state, "lifePurpose")}
          locked={!cifDone(state)}
          onClick={(el) => open("lifePurpose", el)}
        />
      </div>

      {modules.map((m) => (
        <div key={m.id} className="absolute" style={m.position}>
          <ModuleLabel
            label={m.label}
            progress={getModuleProgress(state, m.id)}
            locked={m.id !== "myself" && !cifDone(state)}
            next={m.id === "myself" && !cifDone(state)}
            onClick={(el) => open(m.id, el)}
          />
        </div>
      ))}

      {/* Decisions (Figma Homepage 1690:2396), above the train, with the dotted arrow down to it. */}
      <div className="absolute" style={{ left: 225, top: 489 }}>
        <ModuleLabel label="Decisions" locked={!cifDone(state)} onClick={(el) => openDecisions(el)} />
      </div>
      <div className="pointer-events-none absolute flex items-center justify-center" style={{ left: 241, top: 509, width: 17, height: 39 }}>
        <div className="relative h-[17px] w-[39px] flex-none rotate-90 -scale-y-100">
          <Image src="/icons/decisions-arrow.svg" alt="" width={41} height={25} className="absolute max-w-none" style={{ left: -0.75, top: -7.34 }} />
        </div>
      </div>

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
            label="Journey"
            progress={getModuleProgress(state, "journey")}
            locked={!cifDone(state)}
            onClick={(el) => open("journey", el)}
          />
        </div>
      </div>

      {/* My Companion — the butterfly; opens the CCA chat, no progress state */}
      <div className="absolute" style={{ left: 91, top: 631 }}>
        <ModuleLabel
          label="Companion"
          locked={!cifDone(state)}
          onClick={(el) => void reach(el, () => (cifDone(state) ? openCompanion("home") : setShowPopup("cif")))}
        />
      </div>

      {/* Rests just left of "Companion", its own label. */}
      <Butterfly ref={butterfly} left={58} top={627} />

      <Landing />

      {showPopup && (
        <CoachPopup
          cif={showPopup === "cif"}
          onClose={() => {
            setShowPopup(null);
            butterfly.current?.flyHome();
          }}
        />
      )}
    </main>
  );
}
