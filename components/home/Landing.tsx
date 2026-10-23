"use client";

import { useEffect, useRef, useState } from "react";

// Figma "Landing animation 1 → 2 → 3" (1713:11752, 1707:11682, 1707:11716), played into the
// Homepage the first time it opens in a browser session:
//   1  the cream screen
//   2  the Aatam logo (329 × 311) settles in at the centre
//   3  we fly into its sun: the logo grows to Figma's 7615 × 7200 with its centre 1765px below the
//      screen's, so the sun's glow fills the screen
//   then the glow dissolves and the Homepage is underneath.
// A tap skips it; with reduced motion it doesn't play. Web Animations API only, no library.

const SEEN_KEY = "aatam-landing-seen";
const ZOOM = 7615 / 329; // Figma frame 3 ÷ frame 2
const DROP = 1765; // px the logo's centre sits below the screen's centre in frame 3

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function Landing() {
  // Read on first render: this only mounts in the browser (AuthGuard renders after the session check).
  const [show, setShow] = useState(() => !alreadySeen());
  const overlay = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: it simply plays again next time.
    }
    const o = overlay.current;
    const l = logo.current;
    if (!o || !l) return;
    let cancelled = false;
    const run = async () => {
      // 2 — the logo settles in.
      await l.animate(
        [
          { opacity: 0, transform: "scale(0.92)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 800, delay: 300, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" },
      ).finished;
      // 3 — a beat, then into the sun (slow start, long glide as the glow fills the screen).
      await l.animate(
        [
          { transform: "translateY(0) scale(1)" },
          { transform: `translateY(${DROP}px) scale(${ZOOM})` },
        ],
        { duration: 1500, delay: 500, easing: "cubic-bezier(0.55, 0, 0.25, 1)", fill: "forwards" },
      ).finished;
      // The glow dissolves into the Homepage.
      await o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: "ease-out", fill: "forwards" }).finished;
      if (!cancelled) setShow(false);
    };
    run().catch(() => {}); // an animation cancelled by a skip rejects; nothing to do
    return () => {
      cancelled = true;
    };
  }, [show]);

  if (!show) return null;
  return (
    <div
      ref={overlay}
      role="presentation"
      onClick={() => setShow(false)}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- an SVG drawn at up to 23×: next/image would rasterise it */}
      <img
        ref={logo}
        src="/images/landing/logo.svg"
        alt="Aatam — The Bridge to I"
        width={329}
        height={311}
        fetchPriority="high"
        className="h-[311px] w-[329px] max-w-none opacity-0 will-change-transform"
      />
    </div>
  );
}
