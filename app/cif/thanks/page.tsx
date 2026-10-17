"use client";

import { FloatingBack } from "@/components/shell/BackButton";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BOOKING_URL, firstName } from "@/lib/cif";
import { saveCifProgress, useApp } from "@/lib/store";

// After the CIF is sent. No Figma frame: laid out like the CIF welcome screen.
export default function CifThanksPage() {
  const router = useRouter();
  const { cif } = useApp();
  const name = firstName(cif.answers.name);

  // Only reachable once the form is submitted.
  useEffect(() => {
    if (!cif.progress.submittedAt) router.replace("/cif");
  }, [cif.progress.submittedAt, router]);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center px-32 pb-nav-clearance pt-cif-logo-top text-center">
        <FloatingBack />
        <Image src="/images/cif/logo-large.svg" alt="Aatam — The Bridge to I" width={215} height={200} className="h-logo-large w-logo-large" priority />
        <h1 className="mt-40 font-heading text-h1 text-black">Thank you{name ? `, ${name}` : ""}.</h1>
        <p className="mt-16 text-body text-black">
          I&apos;ll read this before we meet. If we haven&apos;t booked a time yet, pick one below.
        </p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={saveCifProgress}
          className="mt-24 rounded-8 bg-brown-800 px-24 py-12 text-button-cta text-white"
        >
          Book an intro session
        </a>
        <div className="mt-auto w-full pt-40">
          <Link
            href="/cif/agreement"
            className="flex w-full items-center justify-center rounded-8 bg-primary-600 py-16 text-button-cta text-white"
          >
            Continue
          </Link>
        </div>
      </main>
    </>
  );
}
