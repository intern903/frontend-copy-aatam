"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when a not-started module is tapped. Not in Figma: it reuses the
// design's Check Mail card (cream, 16px radius, 40px padding, Body Large).
// Tap anywhere or press Escape to close.
// With `cif`, it says the Get to Know You form comes first and links to it.
export default function CoachPopup({ onClose, cif }: { onClose: () => void; cif?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Not open yet"
      onClick={onClose}
      className="absolute inset-0 z-20 flex items-center justify-center"
    >
      <div className="flex w-content flex-col items-center justify-center gap-20 rounded-16 bg-background p-check-mail">
        <p className="text-center text-body-large text-black">
          {cif ? "Your journey begins with filling out the Get to Know You form." : "Your coach will open this when you are ready."}
        </p>
        {cif && (
          <Link href="/cif" onClick={(e) => e.stopPropagation()} className="w-full rounded-8 bg-primary-600 py-16 text-center text-button-cta text-white">
            Open the form
          </Link>
        )}
      </div>
    </div>
  );
}
