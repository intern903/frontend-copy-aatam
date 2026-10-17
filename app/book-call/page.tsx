"use client";

import BackButton from "@/components/shell/BackButton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BOOKING_URL } from "@/lib/cif";

// Figma "LP - Final State" (1480:9722): "Book a call with Dinesh".
// Figma's panel is a placeholder for zcal's booking interface "through API". zcal does not allow
// its page inside another site (x-frame-options: DENY), so until the API is wired up the panel
// opens Dinesh's calendar in a new tab. "Confirm Call" returns home.
export default function BookCallPage() {
  const router = useRouter();

  return (
    <main className="px-32 pb-40">
      <div className="flex items-center justify-between pt-header-top">
        <BackButton />
        <button type="button" aria-label="Search" className="flex size-icon-button items-center justify-center rounded-pill bg-white">
          <Image src="/icons/search.svg" alt="" width={24} height={24} />
        </button>
      </div>
      <h1 className="mt-24 font-heading text-h3 text-black">Book a call with Dinesh</h1>
      <div className="mt-24 flex h-booking-panel w-content flex-col items-center justify-center gap-16 rounded-12 bg-white p-24 text-center">
        <p className="text-body-small text-black">Pick a time that works for you on Dinesh’s calendar.</p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-8 border border-background-600 px-16 py-12 text-button-cta text-black"
        >
          Open the calendar
        </a>
      </div>
      <div className="mt-24 flex justify-end">
        <button type="button" onClick={() => router.push("/")} className="rounded-8 bg-primary-600 px-24 py-12 text-button-cta text-white">
          Confirm Call
        </button>
      </div>
    </main>
  );
}
