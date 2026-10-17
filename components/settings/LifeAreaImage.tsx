"use client";

import Image from "next/image";
import { useRef } from "react";
import { lifeAreaImageDefaults, type LifeAreaId } from "@/lib/data";
import { setAreaImage, useMedia } from "@/lib/media";
import { setLifeAreaImageChoice, useApp } from "@/lib/store";
import { areaColour } from "@/lib/visions";
import BottomSheet from "./BottomSheet";
import { OutlineButton } from "./Form";

/** The picture an area shows: an uploaded one (this session only) or its default. */
export function useAreaImage(id: LifeAreaId) {
  const media = useMedia();
  const { settings } = useApp();
  const uploaded = settings.lifeAreaImages[id] === "custom" ? media.areas[id] : undefined;
  return uploaded ?? lifeAreaImageDefaults[id];
}

export function AreaPicture({ id }: { id: LifeAreaId }) {
  const src = useAreaImage(id);
  return src.startsWith("blob:") ? (
    // Uploaded photo held as an object URL, so next/image can't optimise it.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
  ) : (
    <Image src={src} alt="" fill sizes="353px" className="object-cover" />
  );
}

/**
 * A life area's picture card, in the three layouts Figma uses:
 * - "settings" (Settings → Life Area Images): 150px tall, name chip bottom-left, edit control top-right.
 * - "tile" (Vision - Flow Screen 1/12): 160px-square photo with a full-width name chip under it;
 *   `faded` at 50% for an area that has no vision yet.
 * - "vision" (Vision - Flow Screen 11 / Final): 329 × 150 photo with the name chip and an arrow
 *   sitting in a notch cut out of the bottom-right corner. `onArrow` is the arrow's own action.
 */
export function LifeAreaCard({
  id,
  name,
  onOpen,
  variant = "settings",
  faded,
  onArrow,
}: {
  id: LifeAreaId;
  name: string;
  onOpen: () => void;
  variant?: "settings" | "tile" | "vision";
  faded?: boolean;
  onArrow?: () => void;
}) {
  const colour = areaColour(id).solid;

  if (variant === "tile") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={faded ? `${name}, no vision yet` : name}
        className={`flex w-full flex-col gap-8 ${faded ? "opacity-50" : ""}`}
      >
        <span className="relative block aspect-square w-full overflow-hidden rounded-24">
          <AreaPicture id={id} />
        </span>
        <span className={`w-full truncate rounded-pill px-8 py-2 text-body-small text-white ${colour}`}>{name}</span>
      </button>
    );
  }

  if (variant === "vision") {
    return (
      <div className="relative h-area-card w-full overflow-hidden rounded-24">
        <button type="button" onClick={onOpen} aria-label={`${name} vision`} className="absolute inset-0">
          <AreaPicture id={id} />
        </button>
        {/* The notch: a Background/500 corner with the chip and arrow inside it. */}
        <div className="absolute bottom-0 right-0 flex items-end gap-4 rounded-tl-24 bg-background pb-8 pl-8 pr-4 pt-8">
          <span className={`rounded-pill px-12 py-4 text-body text-white ${colour}`}>{name}</span>
          <button type="button" onClick={onArrow ?? onOpen} aria-label={`Open ${name}`} className={`rounded-pill p-4 ${colour}`}>
            <Image src="/icons/arrow-right-white.svg" alt="" width={24} height={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Change the ${name} picture`}
      className="relative h-area-card w-full shrink-0 overflow-hidden rounded-24"
    >
      <AreaPicture id={id} />
      <span className={`absolute bottom-16 left-16 whitespace-nowrap rounded-pill px-12 py-4 text-body text-white ${colour}`}>
        {name}
      </span>
      <span className="absolute right-16 top-16 flex rounded-pill bg-background p-8">
        <Image src="/icons/edit-2.svg" alt="" width={12} height={12} />
      </span>
    </button>
  );
}

export function LifeAreaImageSheet({ id, name, onClose }: { id: LifeAreaId; name: string; onClose: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAreaImage(id, URL.createObjectURL(file));
    // Only the choice is saved to localStorage; the uploaded image does not persist in this prototype.
    setLifeAreaImageChoice(id, "custom");
    e.target.value = "";
  }

  function reset() {
    setAreaImage(id, null);
    setLifeAreaImageChoice(id, "default");
  }

  return (
    <BottomSheet title={`${name} image`} onClose={onClose}>
      <div className="relative h-area-card w-full overflow-hidden rounded-24">
        <AreaPicture id={id} />
      </div>
      <div className="flex gap-12">
        <OutlineButton icon="/icons/upload.svg" label="Upload Photo" onClick={() => fileInput.current?.click()} />
        <OutlineButton icon="/icons/refresh-cw.svg" label="Reset to default" onClick={reset} />
      </div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleFile} />
    </BottomSheet>
  );
}
