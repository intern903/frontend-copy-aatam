// Opens the CCA chat (the companion) from anywhere: the bottom nav's companion button, the home
// page's "My Companion", and ticking an outcome on Today. The shell renders one ChatPanel and
// passes it this state. Nothing here is saved: the conversation lives in the panel.

import { useSyncExternalStore } from "react";
import type { ModuleKey } from "./cca-script";

export type CompanionState = { open: boolean; moduleKey: ModuleKey; firstMessage?: string };

let state: CompanionState = { open: false, moduleKey: "home" };
const listeners = new Set<() => void>();
const set = (next: CompanionState) => {
  state = next;
  listeners.forEach((l) => l());
};

export function openCompanion(moduleKey: ModuleKey = "home", firstMessage?: string) {
  set({ open: true, moduleKey, firstMessage });
}
export function closeCompanion() {
  set({ ...state, open: false, firstMessage: undefined });
}

export function useCompanion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
