"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// The companion's butterfly (public/icons/companion.svg, the same mark as the nav), resting on the
// home illustration beside "Companion". When a module is tapped it flies over and perches on that
// label, as if reaching out to it, and only then does the tap take effect.
// Pure CSS + the Web Animations API: no library, nothing to download but a 24px SVG.

const SIZE = 28;
const FLIGHT_MS = 650;

export type ButterflyHandle = {
  /** Fly to the element and perch on its top-left edge. Resolves when it lands. */
  flyTo: (el: HTMLElement) => Promise<void>;
  /** Fly back to the resting spot (after a pop-up is closed). */
  flyHome: () => void;
};

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default forwardRef<ButterflyHandle, { left: number; top: number }>(function Butterfly({ left, top }, ref) {
  const body = useRef<HTMLDivElement>(null);
  const at = useRef({ x: 0, y: 0 }); // offset from the resting spot
  const [flying, setFlying] = useState(false);

  function fly(x: number, y: number) {
    const el = body.current;
    const from = at.current;
    at.current = { x, y };
    if (!el || reducedMotion()) {
      if (el) el.style.transform = `translate(${x}px, ${y}px)`;
      return Promise.resolve();
    }
    // An arc: up and over, leaning into the direction of travel.
    const lean = Math.max(-25, Math.min(25, (x - from.x) / 8));
    const midX = (from.x + x) / 2;
    const midY = Math.min(from.y, y) - 50;
    setFlying(true);
    const anim = el.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) rotate(0deg)` },
        { transform: `translate(${midX}px, ${midY}px) rotate(${lean}deg)`, offset: 0.5 },
        { transform: `translate(${x}px, ${y}px) rotate(0deg)` },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.45, 0.05, 0.35, 1)", fill: "forwards" },
    );
    return anim.finished.then(() => {
      el.style.transform = `translate(${x}px, ${y}px)`;
      anim.cancel();
      setFlying(false);
    });
  }

  useImperativeHandle(ref, () => ({
    flyTo(target) {
      const home = body.current?.offsetParent?.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      if (!home) return Promise.resolve();
      // Perch just above the label's left end.
      return fly(r.left - home.left - left + 2, r.top - home.top - top - SIZE + 8);
    },
    flyHome() {
      void fly(0, 0);
    },
  }));

  return (
    <div
      ref={body}
      aria-hidden
      className="pointer-events-none absolute z-10 will-change-transform"
      style={{ left, top, width: SIZE, height: SIZE }}
    >
      {/* Wings beat by squeezing the mark sideways; faster in flight, slow and gentle at rest. */}
      <div className={flying ? "" : "animate-hover motion-reduce:animate-none"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a 1 KB SVG; next/image adds nothing */}
        <img
          src="/icons/companion.svg"
          alt=""
          width={SIZE}
          height={SIZE}
          className={`drop-shadow motion-reduce:animate-none ${flying ? "animate-flap-fast" : "animate-flap"}`}
        />
      </div>
    </div>
  );
});
