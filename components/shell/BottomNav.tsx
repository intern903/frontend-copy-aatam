"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleForPath } from "@/lib/cca-script";
import { openCompanion } from "@/lib/companion";
import { cifDone, useApp } from "@/lib/store";
import type { NavItem } from "./shell-config";

// Figma "BNB-21" (original file): 329 × 75 pill, Primary/600, fixed 20px above the bottom.
// Four items, each with its icon and its name (Figma shows the name on the active one only; the
// names are on all four so each tab reads the same everywhere). The active one is full white
// with the underline. Spaced evenly across the pill.

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
  // Like every module but the Get to Know You form, the companion stays locked until the form
  // is sent: its button is left out of the nav entirely.
  const companionOpen = cifDone(useApp());
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-20 left-1/2 z-10 flex h-nav w-content -translate-x-1/2 items-center rounded-pill bg-primary-600 px-8"
    >
      {items
        .filter((item) => item.key !== "companion" || companionOpen)
        .map((item) => {
          const on = item.key === active;
          // Every item shows its icon and its name, so each tab is called the same thing
          // wherever the bar appears; the current one is full white with the underline.
          const body = (
            <>
              <Image src={item.icon} alt="" width={24} height={24} className={item.key === "companion" ? "-m-[1px]" : ""} />
              <span className={`whitespace-nowrap text-caption ${on ? "text-white" : "text-white/70"}`}>{item.label}</span>
              <Image src="/icons/nav-underline.svg" alt="" width={17} height={2} className={on ? "" : "invisible"} />
            </>
          );
          const cls = "flex min-w-0 flex-1 flex-col items-center justify-center gap-2 py-8";
          return on ? (
            <div key={item.key} aria-current="page" className={cls}>
              {body}
            </div>
          ) : item.href ? (
            <Link key={item.key} href={item.href} className={cls}>
              {body}
            </Link>
          ) : (
            <button key={item.key} type="button" onClick={() => openCompanion(moduleKey)} className={cls}>
              {body}
            </button>
          );
        })}
    </nav>
  );
}
