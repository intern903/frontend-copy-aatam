// Visions helpers. No UI.
//
// HARD RULE for this module: the app never writes a vision. It only asks and holds.
// Nothing here suggests, completes or rewrites the client's words.

import { lifeAreaImageDefaults, lifeAreas, type LifeAreaId, type Vision } from "./data";
import { autoChecks } from "./lifePurpose";
import type { AppState } from "./store";

// The four questions, final wording. All are optional long free text: "use any or all".
export const VISION_QUESTIONS: { key: keyof Vision["answers"]; text: string }[] = [
  // Coach's note: Anchor to the Life Purpose statement. Let the vision emerge from that felt sense.
  { key: "livedOnPurpose", text: "What would this life area be like if I consistently lived on purpose?" },
  // Coach's note: Invite both doing and being. Ask what they want to feel.
  { key: "doOrBe", text: "What might I do or be in this life area to move me toward my dreams?" },
  // Coach's note: Connect to Top Values. Which ones are most alive in this area? Which feel compromised right now?
  { key: "energizingValues", text: "What values energize me to realize my dreams?" },
  // Coach's note: The lifetime, not just this year. Removes constraints. Let the imagination lead.
  { key: "lifetime", text: "What could I do, be, or have within my lifetime that would enable me to live on purpose?" },
];

// ---------- the writing checklist ----------

export type VisionCheckId = "alreadyTrue" | "see" | "yours" | "purpose";

export const VISION_CHECKLIST: { id: VisionCheckId; label: string }[] = [
  { id: "alreadyTrue", label: "Is it written as if it is already true?" },
  { id: "see", label: "Can you see it?" },
  { id: "yours", label: "Is it yours, not someone else's?" },
  { id: "purpose", label: "Does it connect to your purpose?" },
];

/**
 * Live ticks for the two items a sentence can show on its own: present tense, and one of the
 * client's power words (or a word from their purpose statement) in it. Only a help: the client
 * can tick or untick any item, and nothing is gated on it.
 */
export function visionAutoChecks(text: string, purpose: string, powerWords: string[]): Record<VisionCheckId, boolean> {
  const has = text.trim().length > 0;
  const words = (s: string) => s.toLowerCase().match(/[a-zÀ-ɏ']{5,}/g) ?? [];
  const mine = new Set(words(text));
  const stems = [...powerWords, ...words(purpose).filter((w) => !COMMON.has(w))].map((w) =>
    w.toLowerCase().slice(0, Math.max(4, w.length - 2)),
  );
  return {
    alreadyTrue: has && autoChecks(text).present,
    see: false,
    yours: false,
    purpose: has && stems.some((stem) => Array.from(mine).some((w) => w.startsWith(stem))),
  };
}
const COMMON = new Set(["purpose", "life", "about", "their", "there", "which", "would", "every", "being", "doing"]);

export function visionCheckState(
  text: string,
  purpose: string,
  powerWords: string[],
  overrides: Partial<Record<VisionCheckId, boolean>>,
) {
  const auto = visionAutoChecks(text, purpose, powerWords);
  return (id: VisionCheckId) => overrides[id] ?? auto[id];
}

// ---------- which areas, in what colour ----------

/** The client's picked life areas: their CIF focus areas, any they added here, and any with a vision. */
export function pickedAreas(state: AppState) {
  const ids = new Set<LifeAreaId>([
    ...state.cif.lifeAreas.filter((a) => a.focus && !state.visions.removed.includes(a.id)).map((a) => a.id),
    ...state.visions.added,
    ...(Object.keys(state.visions.byLifeArea) as LifeAreaId[]),
  ]);
  return lifeAreas.filter((a) => ids.has(a.id));
}

export const hasVision = (v: Vision | undefined) => !!v && v.statement.trim().length > 0;

export const areaName = (id: LifeAreaId) => lifeAreas.find((a) => a.id === id)?.name ?? id;

export const isLifeArea = (id: string): id is LifeAreaId => lifeAreas.some((a) => a.id === id);

// Figma colours: Career Primary/500, Health Pink/500, Family Blue/500, Personal Development
// Yellow/500. Other areas reuse one of those images and take its colour (as in Settings).
const COLOURS: Record<string, { solid: string; soft: string }> = {
  "/images/life-areas/career.png": { solid: "bg-primary-500", soft: "bg-primary-100" },
  "/images/life-areas/health.png": { solid: "bg-pink-500", soft: "bg-pink-100" },
  "/images/life-areas/family.png": { solid: "bg-blue-500", soft: "bg-blue-100" },
  "/images/life-areas/personal-development.png": { solid: "bg-yellow-500", soft: "bg-yellow-100" },
};
export const areaColour = (id: LifeAreaId) => COLOURS[lifeAreaImageDefaults[id]];
