"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { parentOf } from "@/lib/navigation";

/**
 * The back control every header in the app renders (Figma: a 40px white circle with the left
 * arrow, top-left at y 70). With no props it goes to the screen's parent in the flow
 * (lib/navigation.ts), never to the browser's previous page. `href` fixes a destination;
 * `onClick` handles back inside a screen (e.g. the previous question of a run on one URL).
 * Renders nothing on home, which has no parent.
 */
export default function BackButton({ href, onClick }: { href?: string; onClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  // The query is read at tap time (no useSearchParams, so no Suspense boundary is needed).
  const target = () => href ?? parentOf(pathname, new URLSearchParams(window.location.search));
  if (!onClick && !href && parentOf(pathname) === null) return null;

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => {
        if (onClick) return onClick();
        const to = target();
        if (to) router.push(to);
      }}
      className="flex size-icon-button shrink-0 items-center justify-center rounded-pill bg-white"
    >
      <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} />
    </button>
  );
}

/** The same control pinned at the header position (32, 70), for screens laid out without a header row. */
export function FloatingBack(props: { href?: string; onClick?: () => void }) {
  return (
    <div className="absolute left-32 top-header-top z-10">
      <BackButton {...props} />
    </div>
  );
}
