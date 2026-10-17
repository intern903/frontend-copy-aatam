"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleForPath } from "@/lib/cca-script";
import { openCompanion } from "@/lib/companion";
import type { NavItem } from "./shell-config";

// Figma "BNB-21" (original file): 329 × 75 pill, Primary/600, fixed 20px above the bottom.
// Four items; the active one shows its label with an underline, the others their icon.
// In Figma the items are padded 25.5px and spread edge to edge, which overflows the pill
// when "My Journey" or "My Companion" is active — here they're spaced evenly instead.

const items: { key: NavItem; label: string; icon: string; href?: string }[] = [
  { key: "home", label: "My Home", icon: "/icons/home.svg", href: "/" },
  // Figma links this to "LP - Final State"; it always opens there, finished or not.
  { key: "foundation", label: "My Foundation", icon: "/icons/foundation.svg", href: "/life-purpose/final" },
  // My Journey opens the Engine's Today tab (Figma "RG - Today").
  { key: "journey", label: "My Journey", icon: "/icons/compass.svg", href: "/outcomes/today" },
  { key: "companion", label: "My Companion", icon: "/icons/companion.svg" },
];

export default function BottomNav({ active }: { active: NavItem | null }) {
  // The companion opens with the script for the screen it was opened from.
  const moduleKey = moduleForPath(usePathname());
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-20 left-1/2 z-10 flex h-nav w-content -translate-x-1/2 items-center justify-around rounded-pill bg-primary-600"
    >
      {items.map((item) =>
        item.key === active ? (
          <div
            key={item.key}
            aria-current="page"
            className="flex shrink-0 flex-col items-center justify-center gap-nav-underline py-20"
          >
            <span className="whitespace-nowrap text-body-medium text-white">{item.label}</span>
            <Image src="/icons/nav-underline.svg" alt="" width={17} height={2} />
          </div>
        ) : item.href ? (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            className="flex shrink-0 items-center justify-center py-nav-item"
          >
            <Image src={item.icon} alt="" width={24} height={24} />
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            aria-label={item.label}
            onClick={() => openCompanion(moduleKey)}
            className="flex shrink-0 items-center justify-center py-nav-item"
          >
            {/* Exported with stroke bounds (24px); the logo's own box in Figma is 21.9 × 22. */}
            <Image src={item.icon} alt="" width={24} height={24} className="-m-[1px]" />
          </button>
        ),
      )}
    </nav>
  );
}
