"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_EVENT, readSession, type Session } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Every other route needs a valid, unexpired token; otherwise → /login.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  // undefined while checking, so protected content never flashes before the redirect.
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const check = () => setSession(readSession());
    check(); // re-checked on every navigation, so an expired token is caught
    window.addEventListener(AUTH_EVENT, check); // login / logout in this tab
    window.addEventListener("storage", check); // login / logout in another tab
    return () => {
      window.removeEventListener(AUTH_EVENT, check);
      window.removeEventListener("storage", check);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isPublic && session === null) router.replace("/login");
  }, [isPublic, session, router]);

  if (isPublic || session) return children;
  return null;
}
