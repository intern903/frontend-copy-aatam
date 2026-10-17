"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cifDone, useApp } from "@/lib/store";

// Every module but Myself (the CIF) stays locked until the CIF is submitted. Home shows why
// when a locked label is tapped; a locked screen reached by its address goes back to home.
const LOCKED = ["/life-purpose", "/visions", "/values", "/outcomes", "/wellbeing", "/life-code"];

export default function CifGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useApp();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const locked = LOCKED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !cifDone(state);

  useEffect(() => {
    if (hydrated && locked) router.replace("/");
  }, [hydrated, locked, router]);

  if (locked) return null;
  return <>{children}</>;
}
