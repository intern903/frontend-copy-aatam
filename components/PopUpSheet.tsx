"use client";

import Image from "next/image";
import { useEffect } from "react";

// The app's one pop-up, from the Figma pop-up frames (LP FAQs, Edit Draft, Previous Drafts,
// "Does this feel true?", Settings sheets): Background/500 panel, 20px padding, H4 title with an
// optional close X, a 1px divider under it.
//   center — a 329px card in the middle of the screen (Life Purpose pop-ups)
//   bottom — full width with 24px top corners (Settings sheets)
// Figma shows no grab handle and no backdrop; a light black/25 scrim keeps the cream panel
// readable on the cream screen. Dismiss: the X, tapping the scrim, or Escape.
export default function PopUpSheet({
  title,
  onClose,
  variant = "center",
  radius = "lg",
  closable = true,
  children,
}: {
  title: string;
  onClose: () => void;
  variant?: "center" | "bottom";
  radius?: "lg" | "md"; // Figma uses 24px on the FAQ, 12px on the other card pop-ups
  closable?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const panel =
    variant === "bottom"
      ? "w-full max-w-frame rounded-t-24"
      : `w-content max-h-[85vh] overflow-y-auto ${radius === "lg" ? "rounded-24" : "rounded-12"}`;

  return (
    <div className={`fixed inset-0 z-30 flex justify-center ${variant === "bottom" ? "items-end" : "items-center"}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/25" />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative flex flex-col gap-16 bg-background p-20 ${panel}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-h4 text-black">{title}</h2>
            {closable && (
              <button type="button" aria-label="Close" onClick={onClose} className="flex size-icon items-center justify-center rounded-pill">
                <Image src="/icons/x.svg" alt="" width={20} height={20} />
              </button>
            )}
          </div>
          <div className="border-t border-black" />
        </div>
        {children}
      </div>
    </div>
  );
}
