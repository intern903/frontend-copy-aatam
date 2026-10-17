// Values & Qualities discovery — the adaptive engine. No UI.
//
// Every question, option, value, quality and theme comes from values-qualities-flow.json (exported
// from the values-qualities-discovery prototype). Nothing here names a value or a quality.
//
// HARD RULE for this module: the client never sees a score, a theme code or a stage name anywhere.
// Screens get question text, option text, item names, labels (Strong / Clear / Emerging), the
// trail of moments, and the plain-English theme names in the results sentence — nothing else.
//
// The engine is pure: every action takes a Run and returns a new one. A Run is the current state
// plus a history stack of whole earlier states, so Back can undo any number of answers.

import flow from "./values-qualities-flow.json";

// ---------- data ----------

type Option1 = { text: string; theme: string; values: string[] };
type Option2 = { text: string; route?: string; values: string[] };
type OptionQ = { text: string; qualities: string[] };
type Question<O> = { id: string; label: string; text: string; options: O[] };
type TradeOff = { id: string; label: string; text: string; options: Record<string, string> };

const THEMES = flow.themes;
const STAGE1 = flow.stage1 as Question<Option1>[];
const STAGE2 = flow.stage2 as Record<string, { opener: Question<Option2>; followUpA: Question<Option2>; followUpB: Question<Option2> }>;
const STAGE3 = flow.stage3 as TradeOff[];
const STAGE4 = flow.stage4 as Question<OptionQ>[];
const GAP_FILLERS = flow.gapFillers as Record<string, Question<OptionQ>>;
const GAP_ORDER = flow.gapCategoryOrder;
export const EXPECTED_LENGTH = flow.expectedLength; // 22

const CATEGORY_OF: Record<string, string> = Object.fromEntries(
  flow.qualityCategories.flatMap((c) => c.qualities.map((q) => [q, c.name])),
);

/** Every value and quality name in the file (for the "anything missing?" autocomplete). */
export const ALL_VALUE_NAMES = THEMES.flatMap((t) => t.values);
export const ALL_QUALITY_NAMES = flow.qualityCategories.flatMap((c) => c.qualities);

// ---------- state ----------

type Stage = "s1" | "s2" | "s3" | "s4" | "gap" | "checks" | "done";
type Planned = { kind: "opener" | "followUp"; theme: string; route?: string };
export type Added = { type: "value" | "quality" | "own"; name: string };

export type DiscoveryState = {
  stage: Stage;
  answered: number; // answers given, for the progress bar
  themeScore: Record<string, number>;
  lastPicked: Record<string, number>; // answer number when a theme last scored (ties break toward recent)
  valueScore: Record<string, number>;
  valueTrail: Record<string, string[]>; // value → labels of the questions that credited it
  qualityScore: Record<string, number>;
  qualityTrail: Record<string, string[]>;
  categoryCount: Record<string, number>; // qualities collected per category (for the gap fillers)
  s1: number;
  queue: Planned[];
  tied: [string, string] | null;
  tiedDone: string[];
  routes: Record<string, string>;
  s3: number;
  s4: number;
  gaps: string[];
  g: number;
  tensions: { keep: string; drop: string }[];
  log: { label: string; choice: string }[]; // the path, for the coach
  checks: { step: number; star: string[]; wish: string[]; other: string[]; added: Added[] };
};

export type Run = { state: DiscoveryState; history: DiscoveryState[] };

function fresh(): DiscoveryState {
  return {
    stage: "s1",
    answered: 0,
    themeScore: {},
    lastPicked: {},
    valueScore: {},
    valueTrail: {},
    qualityScore: {},
    qualityTrail: {},
    categoryCount: {},
    s1: 0,
    queue: [],
    tied: null,
    tiedDone: [],
    routes: {},
    s3: 0,
    s4: 0,
    gaps: [],
    g: 0,
    tensions: [],
    log: [],
    checks: { step: 0, star: [], wish: [], other: [], added: [] },
  };
}

export const newRun = (): Run => ({ state: fresh(), history: [] });

const clone = (s: DiscoveryState): DiscoveryState => JSON.parse(JSON.stringify(s));
const add = (map: Record<string, number>, key: string, pts: number) => (map[key] = (map[key] ?? 0) + pts);

function creditValue(s: DiscoveryState, name: string, pts: number, label: string) {
  add(s.valueScore, name, pts);
  const trail = (s.valueTrail[name] ??= []);
  if (!trail.includes(label)) trail.push(label);
}
function creditQuality(s: DiscoveryState, name: string, pts: number, label: string) {
  add(s.qualityScore, name, pts);
  const trail = (s.qualityTrail[name] ??= []);
  if (!trail.includes(label)) trail.push(label);
  const category = CATEGORY_OF[name];
  if (category) add(s.categoryCount, category, 1);
}

/** Themes by score; ties break toward the theme picked more recently. */
function rankThemes(s: DiscoveryState) {
  const recency = (t: string) => s.lastPicked[t] ?? -1;
  return THEMES.map((t) => t.code).sort(
    (a, b) => (s.themeScore[b] ?? 0) - (s.themeScore[a] ?? 0) || recency(b) - recency(a),
  );
}

/** A theme's top value: its highest-scoring value so far, or its defaultValue if none has scored. */
function topValue(s: DiscoveryState, code: string) {
  const theme = THEMES.find((t) => t.code === code)!;
  let best: string | null = null;
  let bestScore = 0;
  theme.values.forEach((v) => {
    if ((s.valueScore[v] ?? 0) > bestScore) {
      bestScore = s.valueScore[v];
      best = v;
    }
  });
  return best ?? theme.defaultValue;
}

// Stage 2 plan: the top 3 themes get their opener. If the 3rd and 4th tie on a score above zero,
// both get an opener, and only the higher-scoring of the pair gets a follow-up.
function buildPlan(s: DiscoveryState) {
  const r = rankThemes(s);
  const score = (t: string) => s.themeScore[t] ?? 0;
  const tie = score(r[2]) === score(r[3]) && score(r[2]) > 0;
  s.queue = [r[0], r[1], r[2]].map((theme) => ({ kind: "opener" as const, theme }));
  if (tie) {
    s.queue.push({ kind: "opener", theme: r[3] });
    s.tied = [r[2], r[3]];
  }
  s.stage = "s2";
}

// Stage 2: the opener's chosen option carries route A or B; its follow-up is asked straight after.
function afterOpener(s: DiscoveryState, theme: string, route: string) {
  s.routes[theme] = route;
  if (s.tied?.includes(theme)) {
    s.tiedDone.push(theme);
    if (s.tiedDone.length === 2) {
      // Stage 2 tie: only the higher-scoring theme of the pair gets its follow-up (recency breaks a tie).
      const [a, b] = s.tied;
      const sa = s.themeScore[a] ?? 0;
      const sb = s.themeScore[b] ?? 0;
      const winner = sa > sb ? a : sb > sa ? b : (s.lastPicked[a] ?? -1) >= (s.lastPicked[b] ?? -1) ? a : b;
      s.queue.unshift({ kind: "followUp", theme: winner, route: s.routes[winner] });
    }
  } else {
    s.queue.unshift({ kind: "followUp", theme, route });
  }
}

// ---------- what to ask now ----------

export type Current =
  | { kind: "pick"; question: { id: string; text: string; options: string[] } }
  | { kind: "trade"; question: { id: string; text: string }; options: { key: string; text: string }[] }
  | { kind: "checks" }
  | { kind: "done" };

function pickQuestion(s: DiscoveryState): Question<Option1 | Option2 | OptionQ> | null {
  if (s.stage === "s1") return STAGE1[s.s1];
  if (s.stage === "s2") {
    const next = s.queue[0];
    const t = STAGE2[next.theme];
    return next.kind === "opener" ? t.opener : next.route === "A" ? t.followUpA : t.followUpB;
  }
  if (s.stage === "s4") return STAGE4[s.s4];
  if (s.stage === "gap") return GAP_FILLERS[s.gaps[s.g]];
  return null;
}

export function current(s: DiscoveryState): Current {
  if (s.stage === "s3") {
    // Stage 3: each trade-off is asked over the current top 4 themes. The option key is opaque to the UI.
    const q = STAGE3[s.s3];
    return {
      kind: "trade",
      question: { id: `${q.id}:${s.answered}`, text: q.text },
      options: rankThemes(s).slice(0, 4).map((key) => ({ key, text: q.options[key] })),
    };
  }
  if (s.stage === "checks") return { kind: "checks" };
  if (s.stage === "done") return { kind: "done" };
  const q = pickQuestion(s)!;
  return { kind: "pick", question: { id: `${q.id}:${s.answered}`, text: q.text, options: q.options.map((o) => o.text) } };
}

/** Answers given against the expected length, capped at 100%. */
export const progress = (s: DiscoveryState) =>
  s.stage === "done" ? 1 : Math.min(1, s.answered / EXPECTED_LENGTH);

// ---------- answering ----------

export function answerPick(run: Run, index: number): Run {
  const prev = run.state;
  const q = pickQuestion(prev);
  if (!q) return run;
  const s = clone(prev);
  const option = q.options[index];
  s.log.push({ label: q.label, choice: option.text });
  s.answered++;

  if (s.stage === "s1") {
    // Stage 1: theme +2, first value +2, second value +1; record when the theme was picked.
    const o = option as Option1;
    add(s.themeScore, o.theme, 2);
    s.lastPicked[o.theme] = s.answered;
    creditValue(s, o.values[0], 2, q.label);
    creditValue(s, o.values[1], 1, q.label);
    s.s1++;
    if (s.s1 === STAGE1.length) buildPlan(s);
  } else if (s.stage === "s2") {
    // Stage 2: theme +1, first value +3, second value +1.
    const o = option as Option2;
    const planned = s.queue.shift()!;
    add(s.themeScore, planned.theme, 1);
    s.lastPicked[planned.theme] = s.answered;
    creditValue(s, o.values[0], 3, q.label);
    creditValue(s, o.values[1], 1, q.label);
    if (planned.kind === "opener") afterOpener(s, planned.theme, o.route ?? "A");
    if (s.queue.length === 0) s.stage = "s3";
  } else {
    // Stage 4 and gap fillers: first quality +2, the other two +1 each.
    const o = option as OptionQ;
    creditQuality(s, o.qualities[0], 2, q.label);
    creditQuality(s, o.qualities[1], 1, q.label);
    creditQuality(s, o.qualities[2], 1, q.label);
    if (s.stage === "s4") {
      s.s4++;
      if (s.s4 === STAGE4.length) {
        // Gap fillers: the 2 quietest categories by qualities collected; ties by gapCategoryOrder.
        s.gaps = [...GAP_ORDER]
          .sort((a, b) => (s.categoryCount[a] ?? 0) - (s.categoryCount[b] ?? 0) || GAP_ORDER.indexOf(a) - GAP_ORDER.indexOf(b))
          .slice(0, 2);
        s.stage = "gap";
      }
    } else {
      s.g++;
      if (s.g === s.gaps.length) s.stage = "checks";
    }
  }
  return { state: s, history: [...run.history, prev] };
}

export function answerTrade(run: Run, keepKey: string, dropKey: string): Run {
  const prev = run.state;
  if (prev.stage !== "s3") return run;
  const s = clone(prev);
  const q = STAGE3[s.s3];
  // Stage 3: keep gives that theme +3 and its top value +3.
  const kept = topValue(s, keepKey);
  add(s.themeScore, keepKey, 3);
  creditValue(s, kept, 3, q.label);
  // Stage 3: give-up takes 2 off that theme's top value, never below zero; the pair is a tension.
  const dropped = topValue(s, dropKey);
  s.valueScore[dropped] = Math.max(0, (s.valueScore[dropped] ?? 0) - 2);
  s.tensions.push({ keep: kept, drop: dropped });
  s.log.push({ label: q.label, choice: `Keep: ${q.options[keepKey]} | Give up first: ${q.options[dropKey]}` });
  s.answered++;
  s.s3++;
  if (s.s3 === STAGE3.length) s.stage = "s4";
  return { state: s, history: [...run.history, prev] };
}

/** Back: pops the last whole state. Any number of times. */
export function back(run: Run): Run {
  if (!run.history.length) return run;
  return { state: run.history[run.history.length - 1], history: run.history.slice(0, -1) };
}

// ---------- validation (the four checks) ----------

/** Updates the checks without adding to history (moving between the four steps is not an answer). */
export function updateChecks(run: Run, patch: Partial<DiscoveryState["checks"]>): Run {
  return { ...run, state: { ...run.state, checks: { ...run.state.checks, ...patch } } };
}

/** "Is anything important missing?": a typed name that matches the file files under it; else own words. */
export function addMissing(run: Run, text: string): Run {
  const typed = text.trim();
  if (!typed) return run;
  const low = typed.toLowerCase();
  const value = ALL_VALUE_NAMES.find((n) => n.toLowerCase() === low);
  const quality = value ? undefined : ALL_QUALITY_NAMES.find((n) => n.toLowerCase() === low);
  const item: Added = value ? { type: "value", name: value } : quality ? { type: "quality", name: quality } : { type: "own", name: typed };
  const added = run.state.checks.added;
  if (added.some((a) => a.name.toLowerCase() === item.name.toLowerCase())) return run;
  return updateChecks(run, { added: [...added, item] });
}

/** After the last check: the results are confirmed. */
export function finish(run: Run): Run {
  return { state: { ...run.state, stage: "done" }, history: [...run.history, run.state] };
}

// ---------- results ----------

export type Label = "Strong" | "Clear" | "Emerging";
export type Item = { key: string; name: string; score: number; credits: number; trail: string[]; label: Label };

// Results: a value needs 3+ points, a quality 2+. Rank by score, then by how many questions credited
// it. Items credited in 2+ questions fill the list first; then top up from once-credited. Cap 10.
function rank(prefix: "v" | "q", scores: Record<string, number>, trails: Record<string, string[]>, min: number): Item[] {
  const all = Object.keys(scores)
    .filter((name) => scores[name] >= min)
    .map((name) => {
      const trail = trails[name] ?? [];
      return { key: `${prefix}:${name}`, name, score: scores[name], credits: trail.length, trail } as Omit<Item, "label">;
    })
    .sort((a, b) => b.score - a.score || b.credits - a.credits);
  const many = all.filter((x) => x.credits >= 2).slice(0, 10);
  const list = many.length < 10 ? [...many, ...all.filter((x) => x.credits < 2).slice(0, 10 - many.length)] : many;
  // Label: 3+ questions Strong, 2 Clear, 1 Emerging.
  return list.map((x) => ({ ...x, label: x.credits >= 3 ? "Strong" : x.credits === 2 ? "Clear" : "Emerging" }));
}

/** What came through before the checks: the items shown on the validation screens. */
export function results(s: DiscoveryState) {
  return { values: rank("v", s.valueScore, s.valueTrail, 3), qualities: rank("q", s.qualityScore, s.qualityTrail, 2) };
}

/** The confirmed view: the client's checks override the scores. */
export function finalView(s: DiscoveryState) {
  const { values, qualities } = results(s);
  const { star, wish, other, added } = s.checks;
  const all = [...values, ...qualities];
  const kept = (x: Item) => !wish.includes(x.key) && !other.includes(x.key);
  const mainValues = values.filter(kept).map((x) => ({ ...x, mostLikeYou: star.includes(x.key) }));
  const mainQualities = qualities.filter(kept).map((x) => ({ ...x, mostLikeYou: star.includes(x.key) }));

  // A tension: a kept/given-up pair from Stage 3 where both still rank in the values. At most two.
  const names = new Set(mainValues.map((x) => x.name));
  const seen = new Set<string>();
  const tensions = s.tensions.filter((t) => {
    const id = `${t.keep}|${t.drop}`;
    if (t.keep === t.drop || !names.has(t.keep) || !names.has(t.drop) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const top3 = rankThemes(s)
    .slice(0, 3)
    .map((code) => THEMES.find((t) => t.code === code)!.name);

  return {
    sentence: `Your answers pointed most toward ${top3[0]}, ${top3[1]}, and ${top3[2]}.`,
    values: mainValues,
    qualities: mainQualities,
    tensions: tensions.slice(0, 2),
    growingToward: all.filter((x) => wish.includes(x.key)),
    setAside: all.filter((x) => other.includes(x.key) && !wish.includes(x.key)),
    added,
  };
}

export type FinalView = ReturnType<typeof finalView>;

/** Plain-text results for "Copy my results". */
export function plainText(f: FinalView) {
  const lines = ["What matters most to you", "", f.sentence, "", "VALUES"];
  f.values.forEach((x, i) => lines.push(`${i + 1}. ${x.name} (${x.label})${x.mostLikeYou ? " - most like me" : ""}`));
  lines.push("", "QUALITIES");
  f.qualities.forEach((x, i) => lines.push(`${i + 1}. ${x.name} (${x.label})${x.mostLikeYou ? " - most like me" : ""}`));
  if (f.tensions.length) {
    lines.push("", "TENSIONS");
    f.tensions.forEach((t) => lines.push(`- ${t.keep} and ${t.drop}`));
  }
  if (f.added.length) {
    lines.push("", "ADDED BY ME");
    f.added.forEach((x) => lines.push(`- ${x.name}`));
  }
  if (f.growingToward.length) {
    lines.push("", "GROWING TOWARD");
    f.growingToward.forEach((x) => lines.push(`- ${x.name}`));
  }
  if (f.setAside.length) {
    lines.push("", "SET ASIDE");
    f.setAside.forEach((x) => lines.push(`- ${x.name}`));
  }
  return lines.join("\n");
}

/** Where a run belongs: the question, trade-off, checks or results screen. */
export function screenFor(s: DiscoveryState) {
  return s.stage === "s3" ? "/values/tradeoff" : s.stage === "checks" ? "/values/checks" : s.stage === "done" ? "/values/results" : "/values/q";
}
