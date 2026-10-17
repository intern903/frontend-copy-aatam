"use client";

import { useEffect, useRef } from "react";

/** Horizontal swipe (touch) plus Left/Right arrow keys, for testing on desktop. */
export function useSwipe({ onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void; onSwipeRight: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onSwipeLeft();
      if (e.key === "ArrowRight") onSwipeRight();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return; // a tap or a vertical drag
      if (dx > 0) onSwipeRight();
      else onSwipeLeft();
    },
  };
}
