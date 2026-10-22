"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// The companion's butterfly (public/icons/companion.svg, the same mark as the nav), resting on the
// home illustration beside "Companion". When a module is tapped it flies over and perches on that
// label, as if reaching out to it, and only then does the tap take effect.
// Pure CSS + the Web Animations API: no library, nothing to download but a 24px SVG.

const SIZE = 28;
// Unhurried: time grows with distance (a short hop ~1.1s, across the screen ~1.8s).
const flightMs = (dist: number) => Math.round(Math.min(1800, Math.max(1100, 900 + dist * 2.2)));
const STEPS = 40; // points sampled along the path, so the curve and sway stay smooth

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
    // A soft curve (quadratic Bézier) that rises above both ends, with a gentle side-to-side sway
    // and a lean into the direction of travel, like a butterfly drifting rather than a dart.
    const dx = x - from.x;
    const dy = y - from.y;
    const dist = Math.hypot(dx, dy);
    const cx = from.x + dx / 2 + dy * 0.15;
    const cy = Math.min(from.y, y) - Math.min(90, 40 + dist * 0.15);
    const lean = Math.max(-18, Math.min(18, dx / 10));
    const frames: Keyframe[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const u = 1 - t;
      const sway = Math.sin(t * Math.PI * 3) * 6 * Math.sin(t * Math.PI); // fades in and out
      const px = u * u * from.x + 2 * u * t * cx + t * t * x + sway;
      const py = u * u * from.y + 2 * u * t * cy + t * t * y;
      const tilt = lean * Math.sin(t * Math.PI) + Math.cos(t * Math.PI * 3) * 4 * Math.sin(t * Math.PI);
      frames.push({ transform: `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)` });
    }
    setFlying(true);
    const anim = el.animate(frames, {
      duration: flightMs(dist),
      easing: "cubic-bezier(0.4, 0, 0.3, 1)", // eases off and settles gently onto the label
      fill: "forwards",
    });
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
