// My Outcomes + My Well-Being: the plain arithmetic behind the period screens.
// Rules the screens never break (Engine flow): only Done or Not done, no partial credit; Being is
// equal to Doing; a Not done is never red, overdue or nagged; the two scores are never merged.

import type { Outcome, PastPeriod, Period } from "./data";
import type { AppState } from "./store";

const DAY = 24 * 60 * 60 * 1000;

/** Local midnight for an ISO date (yyyy-mm-dd), so day counts don't drift with time zones. */
export function dateOf(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const today = () => dateOf(isoDate(new Date()));
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Oct 19" */
export const shortDate = (iso: string) => {
  const d = dateOf(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
/** "Aug, 24" — the Prior period chips. */
export const chipDate = (iso: string) => {
  const d = dateOf(iso);
  return `${MONTHS[d.getMonth()]}, ${d.getDate()}`;
};

/** Days between two ISO dates ("starts Oct 7, ends Oct 21" = 14 days, as Figma counts it). */
export const daysBetween = (from: string, to: string) => Math.round((dateOf(to).getTime() - dateOf(from).getTime()) / DAY);

/** Days in the period, days gone so far, and days left; on the end date nothing is left. */
export function periodDays(p: Period, now = today()) {
  const total = Math.max(1, daysBetween(p.start, p.end));
  const gone = Math.min(total, Math.max(0, Math.round((now.getTime() - dateOf(p.start).getTime()) / DAY)));
  return { total, gone, left: total - gone };
}

/** Outcomes in the order the client set: #1 first. */
export const byPriority = (outcomes: Outcome[]) =>
  [...outcomes].sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));

/** Overall % = outcomes done ÷ total outcomes. */
export function overallPercent(outcomes: Outcome[]) {
  return outcomes.length ? Math.round((outcomes.filter((o) => o.done).length / outcomes.length) * 100) : 0;
}

/**
 * Priority % = points earned ÷ points possible, where #1 is worth the most: with n outcomes,
 * #1 is worth n points, #2 n − 1, … the last 1.
 */
export function priorityPercent(outcomes: Outcome[]) {
  const ranked = byPriority(outcomes);
  const n = ranked.length;
  if (!n) return 0;
  const worth = (i: number) => n - i;
  const possible = ranked.reduce((sum, _, i) => sum + worth(i), 0);
  const earned = ranked.reduce((sum, o, i) => sum + (o.done ? worth(i) : 0), 0);
  return Math.round((earned / possible) * 100);
}

/** Average of the qualities scored, to one decimal; null when nothing is scored. */
export function averageScore(scores: Record<string, number | null | undefined>) {
  const numbers = Object.values(scores).filter((v): v is number => typeof v === "number");
  return numbers.length ? Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10 : null;
}

/** The qualities the client scores each period: their confirmed list from Values & Qualities. */
export function scoredQualities(state: AppState) {
  const q = state.qualities;
  return [...q.selected.filter((t) => q.final.includes(t.id)).map((t) => t.name), ...q.added];
}

/** Last period's well-being scores (shown only after this period's are submitted). */
export function lastScores(state: AppState): Record<string, number> | null {
  return state.wellbeing.pastScores[0]?.scores ?? null;
}

/** "Doing" / "Being" counts, as the quiet count on a period. */
export const typeCount = (outcomes: Outcome[], type: Outcome["type"]) => outcomes.filter((o) => o.type === type).length;

export type TrendPoint = { label: string; overall: number; priority: number; wellbeing: number | null; scores: Record<string, number> };

/** Past periods for the trend, newest first (as Figma draws them, left to right). */
export function trend(past: PastPeriod[], pastScores: AppState["wellbeing"]["pastScores"]): TrendPoint[] {
  return past.map((p) => {
    const scores = pastScores.find((s) => s.periodId === p.id)?.scores ?? {};
    return { label: p.label, overall: p.overall, priority: p.priority, wellbeing: averageScore(scores) ?? p.wellbeing, scores };
  });
}
