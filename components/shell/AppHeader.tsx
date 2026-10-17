"use client";

import Image from "next/image";
import BackButton from "./BackButton";

// Figma "Frame 366": 329 × 40 at (32, 70); 40px white pill buttons, 24px icons,
// optional H3 title between them (Settings screens).
export default function AppHeader({
  back,
  search,
  title,
  backHref,
}: {
  back: boolean;
  search: boolean;
  title?: string;
  backHref?: string; // fixed destination; without it, the screen's parent (lib/navigation.ts)
}) {
  return (
    <header
      className={`mx-auto flex h-icon-button w-content items-center ${
        back || title ? "justify-between" : "justify-end"
      }`}
    >
      {back && <BackButton href={backHref} />}
      {title && <h1 className="whitespace-nowrap font-heading text-h3 text-black">{title}</h1>}
      {search ? (
        <button
          type="button"
          aria-label="Search"
          className="flex size-icon-button items-center justify-center rounded-pill bg-white"
        >
          <Image src="/icons/search.svg" alt="" width={24} height={24} />
        </button>
      ) : (
        // Empty 40px slot, as in Figma, so the title stays centred
        title && <span aria-hidden className="size-icon-button" />
      )}
    </header>
  );
}
