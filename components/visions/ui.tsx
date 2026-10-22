"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatementText } from "@/components/life-purpose/ui";
import { LifeAreaCard } from "@/components/settings/LifeAreaImage";
import type { LifeAreaId, Vision } from "@/lib/data";
import { useApp } from "@/lib/store";
import { FOUNDATION } from "@/lib/navigation";
import { areaColour, areaName } from "@/lib/visions";

// Building blocks for the Vision screens (Figma "Vision - Flow Screen 1–12", "Vision - Final Screen").

/**
 * The Life Purpose card at the top of every Vision screen: 329 × 244, the sky photo, "My Life
 * Purpose" (H3) and the client's statement in the glass panel. Tapping it opens the final screen.
 */
export function PurposeBanner() {
  const { lifePurpose: lp } = useApp();
  return (
    <Link
      href="/life-purpose/final"
      aria-label="Life Purpose"
      className="relative block h-purpose-banner w-content shrink-0 overflow-hidden rounded-24 shadow-image"
    >
      <Image src="/images/life-purpose/purpose-sky.webp" alt="" fill sizes="329px" className="object-cover object-[50%_20%]" />
      <div className="absolute inset-x-16 top-16">
        <p className="font-heading text-h3 text-white">Life Purpose</p>
        <p className="mt-4 text-caption text-white">The thread through every moment when I’m most alive</p>
      </div>
      {/* Figma places the panel at y 87; anchored to the bottom so longer statements still fit. */}
      <div className="absolute inset-x-16 bottom-16 rounded-12 bg-white/10 p-16 backdrop-blur-[2px]">
        {lp.statement.trim() ? (
          <StatementText statement={lp.statement} />
        ) : (
          <p className="text-body text-white">Your life purpose will appear here once you have written it.</p>
        )}
      </div>
    </Link>
  );
}

/**
 * Figma "Vision - Flow Screen 11": the My Life Purpose node (68px, star) at (32, 82) with its
 * title and line, joined to the Life Purpose card below by the thread. It leads to My Foundation,
 * so it is the Vision overview screens' way back. Sits at the top of the page (no pt-header-top).
 */
export function PurposeNode() {
  return (
    <div className="relative -mx-32 h-[154px] self-stretch">
      <Link href={FOUNDATION} aria-label="Life Purpose, back to Foundation" className="absolute left-32 top-[82px] z-10">
        <span className="flex size-node items-center justify-center rounded-pill border-hairline border-dashed border-primary-600 bg-background">
          <span className="flex size-node-inner items-center justify-center rounded-pill bg-primary-100">
            <Image src="/icons/star-green.svg" alt="" width={32} height={32} />
          </span>
        </span>
      </Link>
      <p className="absolute left-[108px] top-[87px] font-heading text-h4 text-black">Life Purpose</p>
      <p className="absolute left-[108px] top-[113px] w-[155px] text-caption text-ink-50">The thread through every moment when I’m most alive</p>
      <Image
        src="/images/life-purpose/connector-visions.svg"
        alt=""
        width={111}
        height={84}
        className="pointer-events-none absolute left-0 top-[116px] z-[1] -scale-y-100"
      />
    </div>
  );
}

/**
 * Where a vision edit returns to: the screen it was opened from (?from=), else the areas screen.
 * Editing from "My Vision" (all visions) and cancelling goes back there, not to finalising.
 */
export function useVisionReturn() {
  const from = useSearchParams().get("from");
  return from && from.startsWith("/visions") ? from : "/visions";
}
/** Carries the return screen on to the next step of the same edit. */
export function withFrom(path: string, from: string) {
  return from === "/visions" ? path : `${path}${path.includes("?") ? "&" : "?"}from=${encodeURIComponent(from)}`;
}

/** Cancel (outline) · area name (H3) · Save (Primary/600) — the row above each Vision step. */
export function FlowHeader({
  title,
  onCancel,
  onSave,
  saveDisabled,
}: {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <button type="button" onClick={onCancel} className="rounded-8 border border-background-700 px-12 py-8 text-button-cta text-background-700">
        Cancel
      </button>
      <h1 className="font-heading text-h3 text-black">{title}</h1>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="rounded-8 bg-primary-600 px-12 py-8 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}

/** Two equal buttons side by side (Vision - Flow Screen 6: "Feels mine" grey, "Go Deeper" green). */
export function SplitButtons({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full gap-8">{children}</div>;
}
export function GreyButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center rounded-8 bg-cancel py-16 text-button-cta text-cancel-text disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
export function GreenButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center rounded-8 bg-primary-600 py-16 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/**
 * An area with a vision (Vision - Flow Screen 11 / Final Screen): the wide LifeAreaCard. Tapping the
 * photo or its arrow turns it over to the vision: the statement and, when the client went
 * deeper, the line for each power word. The pencil on the back opens the area to edit it.
 * The back is drawn in place of the front (with a quick turn), so it shows in every browser.
 */
export function VisionCard({ vision, onArrow }: { vision: Vision; onArrow: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const id = vision.lifeArea;
  const name = areaName(id);
  return (
    <div className="h-area-card w-full [perspective:1000px]">
      <div key={flipped ? "back" : "front"} className="size-full animate-card-turn">
        {flipped ? (
          <VisionBack id={id} vision={vision} onClose={() => setFlipped(false)} onEdit={onArrow} />
        ) : (
          <LifeAreaCard id={id} name={name} variant="vision" onOpen={() => setFlipped(true)} onArrow={() => setFlipped(true)} />
        )}
      </div>
    </div>
  );
}

function VisionBack({ id, vision, onClose, onEdit }: { id: LifeAreaId; vision: Vision; onClose: () => void; onEdit: () => void }) {
  const deeper = Object.entries(vision.byPowerWord).filter(([, line]) => line.trim());
  return (
    <div className="flex size-full flex-col gap-12 overflow-y-auto rounded-24 bg-white p-16">
      <div className="flex items-center justify-between">
        <span className={`rounded-pill px-8 text-caption text-white ${areaColour(id).solid}`}>{areaName(id)}</span>
        <span className="flex items-center gap-4">
          <button type="button" aria-label={`Edit my ${areaName(id)} vision`} onClick={onEdit} className="flex size-icon items-center justify-center">
            <Image src="/icons/edit-3.svg" alt="" width={16} height={16} />
          </button>
          <button type="button" aria-label="Turn over" onClick={onClose} className="flex size-icon items-center justify-center">
            <Image src="/icons/x.svg" alt="" width={20} height={20} />
          </button>
        </span>
      </div>
      <p className="text-body text-black">{vision.statement}</p>
      {/* Go Deeper: the line written for each power word, under the statement. */}
      {deeper.map(([word, line]) => (
        <div key={word} className="flex flex-col gap-4 border-t-hairline border-background-600 pt-8">
          <span className="text-caption text-ink-60">{word}</span>
          <p className="text-body-small text-black">{line}</p>
        </div>
      ))}
    </div>
  );
}
