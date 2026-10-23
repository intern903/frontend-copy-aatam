// Decisions (Figma "DT" frames, 1653:9605 → 1667:12933): the client weighs a decision against
// their own life purpose, values and any other parameters, scores each choice, and takes it.
//
// The nine steps, one per segment of the bar at the top:
//   1 Life Area  2 Statement  3 Choices  4 Life Purpose (power words)  5 Values (up to 5, in order)
//   6 Other Parameters (optional)  7 Weightage  8 Importance  9 Final Score
//
// Scoring: every parameter ("group") gets a weightage and the weightages add up to 100%. A group
// with sub-items (power words, values, sub parameters) splits its weightage among them. On
// Importance each choice gets a 1–10 score per item (or per group when it has no items); a
// choice's final score is the weighted average of those, out of 10. The app never picks: the
// client takes the decision, and may take a different choice from the highest score.

import type { LifeAreaId } from "./data";

export type DecisionStatus = "draft" | "completed" | "decided";

export type Parameter = { name: string; subs: string[] };

export type Decision = {
  id: string;
  lifeArea: LifeAreaId | null;
  statement: string;
  choices: string[];
  powerWords: string[]; // chosen from the client's life purpose, in the order picked
  values: string[]; // up to 5, in priority order
  params: Parameter[];
  weights: Record<string, number>; // group or item key → %
  scores: Record<string, number>[]; // per choice: group or item key → 1–10
  step: number; // 1–9, where "Continue where I left" picks up
  status: DecisionStatus;
  winner: number | null; // index into choices, once decided
  date: string; // YYYY-MM-DD, last saved
};

export const STEPS = 9;
export const MAX_VALUES = 5;

export function blankDecision(id: string, date: string): Decision {
  return {
    id,
    lifeArea: null,
    statement: "",
    choices: ["", ""],
    powerWords: [],
    values: [],
    params: [],
    weights: {},
    scores: [],
    step: 1,
    status: "draft",
    winner: null,
    date,
  };
}

/** A weighted parameter and its sub-items: Life Purpose, Values, then the client's own. */
export type Group = { key: string; name: string; items: { key: string; name: string }[] };

export function groups(d: Decision): Group[] {
  const out: Group[] = [];
  if (d.powerWords.length) out.push({ key: "lp", name: "Life Purpose", items: d.powerWords.map((w) => ({ key: `lp:${w}`, name: w })) });
  if (d.values.length) out.push({ key: "values", name: "Values", items: d.values.map((v) => ({ key: `values:${v}`, name: v })) });
  d.params.forEach((p, i) => {
    if (!p.name.trim()) return;
    // Keyed by position as written, so clearing one sub parameter doesn't move the others' numbers.
    const items = p.subs.map((s, j) => ({ key: `p${i}:${j}`, name: s.trim() })).filter((it) => it.name);
    out.push({ key: `p${i}`, name: p.name.trim(), items });
  });
  return out;
}

const w = (d: Decision, key: string) => d.weights[key] ?? 0;

/** What still stops the weightage step: the groups' total, then any group whose items don't add up. */
export function weightIssue(d: Decision): string | null {
  const gs = groups(d);
  if (gs.length === 0) return "Pick at least one power word, value or parameter to weigh the choices on.";
  const total = gs.reduce((sum, g) => sum + w(d, g.key), 0);
  if (total !== 100) return `The weightages add up to ${total}%. They need to make 100%.`;
  for (const g of gs) {
    if (!g.items.length) continue;
    const sub = g.items.reduce((sum, it) => sum + w(d, it.key), 0);
    if (sub !== w(d, g.key)) return `${g.name}: its parts add up to ${sub}%, not ${w(d, g.key)}%.`;
  }
  return null;
}

/** The keys a choice is scored on: each item, or the group itself when it has none. */
export const scoredKeys = (d: Decision) => groups(d).flatMap((g) => (g.items.length ? g.items.map((i) => i.key) : [g.key]));

/** A group's score for one choice: entered when it has no items, else the weighted mean of its items. */
export function groupScore(d: Decision, choice: number, g: Group): number | null {
  const s = d.scores[choice] ?? {};
  if (!g.items.length) return s[g.key] ?? null;
  const total = g.items.reduce((sum, it) => sum + w(d, it.key), 0);
  if (g.items.some((it) => s[it.key] === undefined)) return null;
  if (total === 0) return Math.round((g.items.reduce((sum, it) => sum + s[it.key], 0) / g.items.length) * 10) / 10;
  return Math.round((g.items.reduce((sum, it) => sum + s[it.key] * w(d, it.key), 0) / total) * 10) / 10;
}

/** A choice's final score out of 10, one decimal; null until every key is scored. */
export function finalScore(d: Decision, choice: number): number | null {
  const s = d.scores[choice] ?? {};
  const keys = scoredKeys(d);
  if (keys.length === 0 || keys.some((k) => s[k] === undefined)) return null;
  return Math.round(keys.reduce((sum, k) => sum + (s[k] * w(d, k)) / 100, 0) * 10) / 10;
}

export const filledChoices = (d: Decision) => d.choices.map((c) => c.trim()).filter(Boolean);

/** Why Next can't go on from a step yet, or null. */
export function stepIssue(d: Decision, step: number): string | null {
  switch (step) {
    case 1:
      return d.lifeArea ? null : "Choose the life area this decision sits in.";
    case 2:
      return d.statement.trim() ? null : "Write the decision you want to take.";
    case 3:
      return filledChoices(d).length >= 2 ? null : "Add at least two choices.";
    case 6:
      return d.params.some((p) => !p.name.trim() && p.subs.some((s) => s.trim())) ? "Give each parameter a name." : null;
    case 7:
      return weightIssue(d);
    case 8: {
      const keys = scoredKeys(d);
      const missing = filledChoices(d).some((_, c) => keys.some((k) => !(d.scores[c]?.[k] >= 1)));
      return missing ? "Give every line a score from 1 to 10, for each choice." : null;
    }
    default:
      return null;
  }
}

/** Accent palettes (Figma cycles Pink, Blue, Yellow, Brown across choices, groups and lists). */
export const TONES = [
  { soft: "bg-pink-100", tint: "bg-pink-200", solid: "bg-pink-500", border: "border-pink-500", strong: "border-pink-600", text: "text-pink-800" },
  { soft: "bg-blue-100", tint: "bg-blue-200", solid: "bg-blue-500", border: "border-blue-500", strong: "border-blue-600", text: "text-blue-800" },
  { soft: "bg-yellow-100", tint: "bg-yellow-200", solid: "bg-yellow-500", border: "border-yellow-500", strong: "border-yellow-600", text: "text-yellow-800" },
  { soft: "bg-brown-100", tint: "bg-brown-200", solid: "bg-brown-500", border: "border-brown-500", strong: "border-brown-600", text: "text-brown-800" },
];
export const tone = (i: number) => TONES[i % TONES.length];

/** Card colours on the list (Figma "DT- Screen"): Draft blue, Completed yellow, Decided green. */
export const STATUS_STYLE: Record<DecisionStatus, { label: string; card: string; chip: string }> = {
  draft: { label: "Draft", card: "bg-blue-100", chip: "bg-blue-500" },
  completed: { label: "Completed", card: "bg-yellow-100", chip: "bg-yellow-500" },
  decided: { label: "Decided", card: "border border-primary-500 bg-primary-100", chip: "bg-primary-500" },
};

export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
