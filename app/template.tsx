"use client";

import { useEffect, useState } from "react";

// Figma's prototype transition: each new screen slides in from the right (0.3s, ease in and out).
// Skipped on the very first page load so the app doesn't slide in when opened.
let hasMounted = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => hasMounted);
  useEffect(() => {
    hasMounted = true;
  }, []);

  return <div className={animate ? "animate-slide-in motion-reduce:animate-none" : undefined}>{children}</div>;
}
