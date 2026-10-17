"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import { closeCompanion, useCompanion } from "@/lib/companion";
import { cifDone, useApp } from "@/lib/store";
import CifGate from "./CifGate";
import { INDEX_PATH } from "@/lib/screens";
import AppHeader from "./AppHeader";
import AuthGuard from "./AuthGuard";
import BottomNav from "./BottomNav";
import { getShellConfig } from "./shell-config";

// Holds every screen at the 393px design width, centred on wider viewports.
// The header scrolls with the content; the bottom nav is fixed (as in Figma).
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { header, nav, fullBleed } = getShellConfig(pathname);
  const companion = useCompanion();
  const companionUnlocked = cifDone(useApp()); // locked, like the modules, until the form is sent
  // Going anywhere from the companion's nav closes it.
  useEffect(() => closeCompanion(), [pathname]);

  // The internal screen index sits outside the product shell.
  if (pathname === INDEX_PATH) return <AuthGuard>{children}</AuthGuard>;

  return (
    <AuthGuard>
      <div
        className={`relative mx-auto min-h-screen w-full max-w-frame overflow-x-clip bg-background ${
          nav && !fullBleed ? "pb-nav-clearance" : ""
        }`}
      >
        {header && (
          <div className="pt-header-top">
            <AppHeader {...header} />
          </div>
        )}
        <CifGate>{children}</CifGate>
        {nav && <BottomNav active={nav.active} />}
        <ChatPanel moduleKey={companion.moduleKey} open={companion.open && companionUnlocked} firstMessage={companion.firstMessage} onClose={closeCompanion} />
      </div>
    </AuthGuard>
  );
}
