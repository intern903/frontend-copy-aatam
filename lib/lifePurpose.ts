// Life Purpose helpers. No UI.
//
// HARD RULES for this module:
// - The app suggests, the client decides. Never auto-fill a cluster name or pick one for them.
// - The app never generates the purpose statement. It never writes a suggested sentence into the box.

import type { Story } from "./data";

// The three follow-up questions for each life story, in Dinesh's exact order.
// QUESTIONS TO BE CONFIRMED BY DINESH
export const STORY_QUESTIONS = [
  "Specifically, what were you doing?",
  "What value did you take from this? What was in it for you?",
  "How did that leave you feeling?",
] as const;

export const MIN_STORIES = 5;

// Cluster colours, in order (Figma: cluster 1 Primary, cluster 2 Accent Pink, …).
// Full class strings so Tailwind keeps them.
export const CLUSTER_COLOURS = [
  { solid: "bg-primary-500", soft: "bg-primary-100", line: "#7eb77f", border: "border-primary-500" },
  { solid: "bg-pink-500", soft: "bg-pink-100", line: "#e78c80", border: "border-pink-500" },
  { solid: "bg-blue-500", soft: "bg-blue-100", line: "#6e8dae", border: "border-blue-500" },
  { solid: "bg-yellow-500", soft: "bg-yellow-100", line: "#d9a441", border: "border-yellow-500" },
  { solid: "bg-brown-500", soft: "bg-brown-100", line: "#ba7b55", border: "border-brown-500" },
];
export const clusterColour = (i: number) => CLUSTER_COLOURS[i % CLUSTER_COLOURS.length];

// Soft gradient behind the clustering board, per cluster colour (Figma: 200-shade → transparent).
export const BOARD_GRADIENTS = ["#cbe2cc", "#f5d1cc", "#c5d1df", "#f0dbb3", "#e3cabb"];

/** Every key word/phrase from the client's stories, once each, in story order. */
export function wordsFromStories(stories: Story[]) {
  const seen = new Set<string>();
  const words: string[] = [];
  stories.forEach((s) =>
    s.keywords.forEach((k) => {
      const key = k.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        words.push(k.trim());
      }
    }),
  );
  return words;
}

// "Need a spark?" — per the Life Purpose flow, the options are drawn only from the phrases
// already inside that cluster (the client's own words); nothing is invented. They are prompts:
// nothing goes in the name field unless the client taps one.
const SMALL_WORDS = new Set(["a", "an", "and", "the", "to", "in", "of", "for", "from", "with", "my", "me", "i", "it", "is", "be", "at", "on", "up", "people", "things", "feel"]);
export function sparksFor(words: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (w: string) => {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(w.charAt(0).toUpperCase() + w.slice(1));
    }
  };
  words.filter((w) => !w.trim().includes(" ")).forEach((w) => add(w.trim()));
  words.forEach((phrase) =>
    phrase
      .split(/[\s-]+/)
      .map((w) => w.replace(/[^A-Za-zÀ-ɏ']/g, ""))
      .filter((w) => w.length > 3 && !SMALL_WORDS.has(w.toLowerCase()))
      .forEach(add),
  );
  return out.slice(0, 4);
}

// ---------- the drafting checklist (Figma "LP - First Draft") ----------

export type CheckId = "doingBeing" | "connection" | "driverProcessOutcome" | "broad" | "control" | "present" | "positive";

export const CHECKLIST: { id: CheckId; label: string; auto: boolean }[] = [
  { id: "doingBeing", label: "Doing + Being", auto: false },
  { id: "connection", label: "Connection to self, another and the whole", auto: false },
  { id: "driverProcessOutcome", label: "Driver – Process – Outcome", auto: true },
  { id: "broad", label: "Broad enough", auto: true },
  { id: "control", label: "Fully within your control", auto: false },
  { id: "present", label: "Present tense", auto: true },
  { id: "positive", label: "Positively stated", auto: true },
];

// Simple, explainable checks for the four criteria a sentence can show on its own. These are only
// a help: the client can tick or untick any item, and the checklist never blocks saving.
export function autoChecks(text: string): Record<CheckId, boolean> {
  const t = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  const hasText = text.trim().length > 0;
  return {
    driverProcessOutcome: /purpose in life is to .+ by .+ to .+/.test(t),
    broad: hasText && text.trim().split(/\s+/).length >= 12 && !/\d/.test(t),
    present: !/ (will|would|was|were|used to|going to|had|someday|one day) /.test(t),
    positive: !/ (not|never|don't|can't|won't|no|stop|avoid|without|less) /.test(t),
    doingBeing: false,
    connection: false,
    control: false,
  };
}

// ---------- showing a statement (Figma Draft / Final card) ----------

/** Splits "My purpose in life is to X by Y to Z" so the client's own words can be emphasised. */
export function statementParts(statement: string): { text: string; mine: boolean }[] {
  const m = statement.match(/^(my purpose in life is to)\s+(.+?)\s+(by)\s+(.+?),?\s+(so that|to)\s+(.+)$/i);
  if (!m) return [{ text: statement, mine: true }];
  return [
    { text: m[1], mine: false },
    { text: m[2], mine: true },
    { text: m[3], mine: false },
    { text: m[4], mine: true },
    { text: m[5], mine: false },
    { text: m[6], mine: true },
  ];
}

/** Whether a power word appears in the draft (used words go muted on the writing screen). */
export const usesWord = (text: string, word: string) =>
  word.trim() !== "" && text.toLowerCase().includes(word.trim().toLowerCase().slice(0, Math.max(4, word.length - 2)));

// "Make it real" suggestions (Figma "LP - Draft").
export const MAKE_IT_REAL = [
  "Write it on a card and post it somewhere visible",
  "Say it aloud each morning",
  "Share it with one trusted person this week",
  "Journal whatever comes to mind",
  "Notice moments when your purpose is happening",
];

// Story card photos, reused in turn (Figma uses one photo for every story).
const STORY_IMAGES = [
  "/images/life-areas/health.webp",
  "/images/life-areas/personal-development.webp",
  "/images/life-areas/family.webp",
  "/images/life-areas/career.webp",
];
export const storyImage = (i: number) => STORY_IMAGES[i % STORY_IMAGES.length];
export const TAG_COLOURS = ["bg-primary-500", "bg-pink-500", "bg-blue-500"];

/** Checklist state: the auto-tick, unless the client has ticked or unticked the item themselves. */
export function checkState(text: string, overrides: Partial<Record<CheckId, boolean>>) {
  const auto = autoChecks(text);
  return (id: CheckId) => overrides[id] ?? auto[id];
}

/**
 * Splits text so each power word (cluster name) found in it is its own piece, tagged with the
 * cluster it came from. Matches the same loose way as usesWord ("Curious" also finds "curiosity").
 */
export function powerWordPieces(text: string, names: string[]): { text: string; cluster: number }[] {
  const stems = names
    .map((n, i) => ({ i, stem: n.trim().toLowerCase().slice(0, Math.max(4, n.trim().length - 2)) }))
    .filter((s) => s.stem.length > 0);
  if (!stems.length) return [{ text, cluster: -1 }];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${stems.map((s) => `${escape(s.stem)}[A-Za-z\u00C0-\u024F'-]*`).join("|")})`, "gi");
  return text
    .split(re)
    .filter((t) => t !== "")
    .map((t) => ({ text: t, cluster: stems.find((s) => t.toLowerCase().startsWith(s.stem))?.i ?? -1 }));
}

/** The stories a cluster's phrases came from. */
export function storiesForCluster(stories: Story[], words: string[]) {
  const keys = new Set(words.map((w) => w.trim().toLowerCase()));
  return stories.filter((s) => s.keywords.some((k) => keys.has(k.trim().toLowerCase())));
}
