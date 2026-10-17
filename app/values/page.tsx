"use client";

import Image from "next/image";
import { FloatingBack } from "@/components/shell/BackButton";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { useHydrated } from "@/components/values/ui";
import { newRun, screenFor } from "@/lib/discovery";
import { setDiscovery, useApp } from "@/lib/store";

// Figma "VQ - Begin" (intro). Begin starts a fresh run; if a saved run is part-way through,
// "Continue where I left off" picks it up at the exact question.
//
// HARD RULE: the client never sees a score, a theme code or a stage name anywhere in this module.
export default function ValuesIntroPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const run = useApp().discovery;
  const resumable = hydrated && run && run.state.stage !== "done" && run.state.answered > 0;

  // The page fills the screen above the nav (nav-clearance = 120px), so Let’s Begin sits just above it.
  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col items-center px-32 pb-40 pt-header-top text-center">
      <FloatingBack />
      <Image src="/images/aatam-logo.png" alt="Aatam — The Bridge to I" width={215} height={215} priority className="mt-24" />
      <h1 className="mt-32 font-heading text-h2 text-black">What matters most to you</h1>
      <p className="mt-12 text-body text-black">
        About twenty short questions about everyday moments. There are no right answers, and nobody is grading you. Go
        with your first instinct, even when two choices both feel true.
      </p>
      <p className="mt-12 text-body text-black">
        At the end you will see the values that drive you and the qualities you bring, and you will get to correct
        anything that does not sound like you. It takes about ten minutes.
      </p>
      <div className="mt-auto flex w-full flex-col gap-12 pt-40">
        <PrimaryButton
          onClick={() => {
            setDiscovery(newRun());
            router.push("/values/q");
          }}
        >
          Let’s Begin
        </PrimaryButton>
        {resumable && (
          <button
            type="button"
            onClick={() => router.push(screenFor(run.state))}
            className="w-full rounded-8 border border-primary-600 py-16 text-button-cta text-primary-600"
          >
            Continue where I left off
          </button>
        )}
      </div>
    </main>
  );
}
