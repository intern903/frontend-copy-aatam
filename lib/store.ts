"use client";

// The single place all app data lives. Persisted to localStorage under "bridge-app".
// Screens read state with useApp() and change it only through the named actions below.

import { createContext, createElement, useContext, useSyncExternalStore } from "react";
import {
  AREAS,
  blankAnswers,
  blankProgress,
  nextStep,
  objectivesPrefill,
  toColumns,
  type CifColumns,
  type CifState,
} from "./cif";
import type { FinalView, Run } from "./discovery";
import * as data from "./data";
import { demoFullAccount, demoNewAccount } from "./demo-data";
import type {
  CifAnswers,
  CifProgress,
  Cluster,
  KeyResult,
  LifeAreaId,
  LifeCode,
  LifeCodeSource,
  Outcome,
  OutcomeType,
  PastPeriod,
  Period,
  PastScores,
  PurposeStatus,
  Story,
  Trait,
  Vision,
} from "./data";

// ---------- State ----------

export type User = {
  name: string;
  email: string;
  token: string;
  phone?: { code: string; number: string };
  // Prototype only: there is no server, so the password lives here in plain text so
  // Change Password has something to check against. Never do this with real auth.
  password?: string;
};

export type AppState = {
  user: User | null;
  cif: {
    answers: CifAnswers;
    lifeAreas: data.LifeArea[]; // the wheel: score + focus per area
    keyResults: KeyResult[];
    agreementSigned: boolean;
    progress: CifProgress;
    // Written on submit: one entry per Notion column (names exactly as in CIF v2 Submissions).
    columns: CifColumns | null;
  };
  lifePurpose: {
    stories: Story[];
    powerWords: string[];
    clusters: Cluster[];
    statement: string;
    status: PurposeStatus;
    drafts: { date: string; text: string }[]; // every saved draft, oldest first
    makeItReal: number[]; // "Make it real" suggestions the client has ticked
    bodyFeel: string; // "I feel this most in my …"
  };
  // added: life areas the client added on the Visions screen, on top of their CIF focus areas.
  // areasFinal: the client has finalised which life areas they will write visions for; only then
  // do the questions open, and the areas can no longer be changed.
  visions: { byLifeArea: Partial<Record<LifeAreaId, Vision>>; added: LifeAreaId[]; removed: LifeAreaId[]; areasFinal: boolean };
  // Values & Qualities: written when the client confirms their discovery results.
  // selected = the confirmed list (ranked), final = their ids, added = the client's own additions.
  values: { selected: Trait[]; final: string[]; added: string[] };
  qualities: { selected: Trait[]; final: string[]; added: string[] };
  // The discovery run in progress (lib/discovery.ts), saved after every answer so the client can
  // leave and come back to the exact question. null = never started.
  discovery: Run | null;
  // My Outcomes: the period running now (null before the first one), its outcomes in priority
  // order, the next period while it is being built, and every closed period.
  outcomes: {
    period: Period | null;
    currentPeriod: Outcome[];
    draft: { end: string | null; outcomes: Outcome[] };
    pastPeriods: PastPeriod[];
  };
  // My Well-Being: this period's scores per quality. submitted = all scored and sent, which is
  // when last period's numbers may show (never before, so they don't anchor the answer).
  wellbeing: { scores: Record<string, number | null>; submitted: boolean; pastScores: PastScores[] };
  lifeCodes: LifeCode[];
  // Demo sets loaded on purpose from /_index (internal). Their data matches the old untouched
  // samples that are cleared on load, so they are listed here to be kept.
  demo?: string[];
  settings: {
    notifications: boolean;
    // Which life areas use an uploaded picture instead of the default. Only this choice is
    // saved; the uploaded image itself lives in memory (lib/media.ts) and is gone after a reload.
    lifeAreaImages: Partial<Record<LifeAreaId, "custom">>;
  };
};

const STORAGE_KEY = "bridge-app";

// Life stories and "where in your body" are captured by the coach in session, never by the
// client. Until the coach interface exists, every client starts with the sample stories and
// body word, and works from there (clusters, power words, statement).
function emptyLifePurpose(): AppState["lifePurpose"] {
  return {
    stories: data.stories,
    powerWords: [],
    clusters: [],
    statement: "",
    status: "empty",
    drafts: [],
    makeItReal: [],
    bodyFeel: data.purposeBodyFeel,
  };
}

function emptyCif(): AppState["cif"] {
  return {
    answers: blankAnswers(),
    lifeAreas: data.lifeAreas.map((a) => ({ ...a, score: null, focus: false })),
    keyResults: data.keyResults,
    agreementSigned: false,
    progress: blankProgress(),
    columns: null,
  };
}
function sampleCif(): AppState["cif"] {
  return {
    answers: data.cifAnswers,
    lifeAreas: data.lifeAreas,
    keyResults: data.keyResults,
    agreementSigned: true,
    // Stamped with the moment it was loaded, so it is never mistaken for the old untouched sample.
    progress: { ...data.cifProgress, submittedAt: new Date().toISOString() },
    columns: toColumns({ answers: data.cifAnswers, lifeAreas: data.lifeAreas, progress: data.cifProgress }),
  };
}

/** The CIF has been submitted: until then every other module stays locked. */
export const cifDone = (s: AppState) => s.cif.progress.submittedAt !== null;

function emptyOutcomes(): AppState["outcomes"] {
  return { period: null, currentPeriod: [], draft: { end: null, outcomes: [] }, pastPeriods: [] };
}

/** Saved outcomes from before notes, tracking and the close get the new fields. */
const withOutcomeDefaults = (o: Outcome): Outcome => ({ ...o, track: o.track ?? false, notes: o.notes ?? [], ticks: o.ticks ?? [], closed: o.closed ?? false });

/** A life code saved in the old shape (one area, three free-text answers) moves to the new one. */
function migrateLifeCode(c: LifeCode & { lifeArea?: LifeAreaId; answers?: { whenUse?: string } }): LifeCode {
  const { lifeArea, answers, ...rest } = c;
  return {
    ...rest,
    lifeAreas: rest.lifeAreas ?? (lifeArea ? [lifeArea] : []),
    allLifeAreas: rest.allLifeAreas ?? false,
    howOrWhenToUse: rest.howOrWhenToUse ?? answers?.whenUse ?? "",
    periodId: rest.periodId ?? null,
  };
}

function sampleState(): AppState {
  return {
    // The sample client's account exists, but there is no session until she logs in
    // (lib/auth.ts issues the token). Any password works for this email.
    user: { ...data.sampleUser, token: "" },
    // The CIF starts blank: every other module stays locked until the client submits it.
    // (Meera's submitted form is a demo load in /_index.) Goals are set with the coach.
    cif: emptyCif(),
    // Life Purpose starts empty: the client adds their own stories, clusters and statement.
    lifePurpose: emptyLifePurpose(),
    // Visions start empty too: the client writes their own (Meera's are a demo load in /_index).
    visions: { byLifeArea: {}, added: [], removed: [], areasFinal: false },
    // Values & Qualities start empty: the client finds their own (Meera's are a demo load in /_index).
    values: { selected: [], final: [], added: [] },
    qualities: { selected: [], final: [], added: [] },
    discovery: null,
    // Outcomes, Well-Being and Life Codes start empty too (Meera's are a demo load in /_index).
    outcomes: emptyOutcomes(),
    wellbeing: { scores: {}, submitted: false, pastScores: [] },
    lifeCodes: [],
    settings: { notifications: true, lifeAreaImages: {} },
  };
}

// ---------- Persistence ----------

function read(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Top-level merge so a saved object missing a newer slice still gets it from the sample.
    const saved = JSON.parse(raw) as Partial<AppState>;
    const sample = sampleState();
    // A CIF saved before the live-form shape (no progress, or not the 12 wheel areas) is replaced.
    if (saved.cif && (!saved.cif.progress || saved.cif.lifeAreas?.length !== AREAS.length)) {
      saved.cif = sample.cif;
    }
    // Meera's sample CIF, still untouched (submitted at the sample's own moment), is cleared.
    if (saved.cif?.progress?.submittedAt === data.cifProgress.submittedAt) saved.cif = emptyCif();
    const demo = new Set(saved.demo ?? []);
    // Life Purpose fields added later get empty defaults.
    if (saved.lifePurpose) {
      const lp = saved.lifePurpose as Partial<AppState["lifePurpose"]>;
      saved.lifePurpose = { ...lp, drafts: lp.drafts ?? [], makeItReal: lp.makeItReal ?? [], bodyFeel: lp.bodyFeel ?? "" } as AppState["lifePurpose"];
      // Meera's old sample Life Purpose, still untouched, is cleared so the client starts fresh.
      if (!demo.has("lifePurpose") && lp.statement === data.lifePurposeStatement && lp.stories?.[0]?.id === "story-1") {
        saved.lifePurpose = emptyLifePurpose();
      }
      // No stories yet: the coach's (for now, sample) stories and body word fill in.
      if (!saved.lifePurpose.stories?.length) {
        saved.lifePurpose = { ...saved.lifePurpose, stories: data.stories, bodyFeel: saved.lifePurpose.bodyFeel || data.purposeBodyFeel };
      }
    }
    // Visions: the "added" list came later; Meera's sample visions, still untouched, are cleared.
    if (saved.visions) {
      const untouched = !demo.has("visions") && JSON.stringify(saved.visions.byLifeArea) === JSON.stringify(sampleVisions());
      const byLifeArea = untouched ? {} : saved.visions.byLifeArea ?? {};
      saved.visions = {
        byLifeArea,
        added: saved.visions.added ?? [],
        removed: saved.visions.removed ?? [],
        // Saved before the areas step existed: finalised if any vision was already started.
        areasFinal: saved.visions.areasFinal ?? Object.keys(byLifeArea).length > 0,
      };
    }
    // Values & Qualities: "added" came later; Meera's sample lists, still untouched, are cleared.
    for (const key of ["values", "qualities"] as const) {
      const slice = saved[key];
      if (!slice) continue;
      const untouched = !demo.has("values") && JSON.stringify(slice.selected) === JSON.stringify(key === "values" ? data.values : data.qualities);
      saved[key] = untouched ? { selected: [], final: [], added: [] } : { ...slice, added: slice.added ?? [] };
    }
    // Outcomes: the period and the draft came later; Meera's sample period, still untouched, is cleared.
    if (saved.outcomes) {
      const o = saved.outcomes as Partial<AppState["outcomes"]>;
      const untouched = !demo.has("engine") && !o.period && o.currentPeriod?.map((x) => x.id).join() === data.currentOutcomes.map((x) => x.id).join();
      saved.outcomes = untouched
        ? emptyOutcomes()
        : {
            period: o.period ?? null,
            currentPeriod: (o.currentPeriod ?? []).map(withOutcomeDefaults),
            draft: o.draft ?? { end: null, outcomes: [] },
            pastPeriods: o.pastPeriods ?? [],
          };
    }
    if (saved.wellbeing) {
      const w = saved.wellbeing as Partial<AppState["wellbeing"]>;
      const untouched = w.submitted === undefined && JSON.stringify(w.scores) === JSON.stringify(data.wellbeingScores);
      saved.wellbeing = untouched
        ? { scores: {}, submitted: false, pastScores: [] }
        : { scores: w.scores ?? {}, submitted: w.submitted ?? false, pastScores: w.pastScores ?? [] };
    }
    if (saved.lifeCodes) {
      // (Only the old-shape sample: a demo load in the new shape is kept.)
      const untouched =
        saved.lifeCodes.some((c) => "answers" in c) &&
        saved.lifeCodes.map((c) => c.statement).join("|") === data.lifeCodes.map((c) => c.statement).join("|");
      saved.lifeCodes = untouched ? [] : saved.lifeCodes.map(migrateLifeCode);
    }
    return { ...sample, ...saved };
  } catch {
    return null;
  }
}

function write(next: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Blocked or full storage: keep working in memory.
  }
}

// ---------- Store ----------

const serverState = sampleState();
let state: AppState = serverState;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = read() ?? state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function update(change: (s: AppState) => AppState) {
  ensureLoaded();
  state = change(state);
  write(state);
  listeners.forEach((l) => l());
}

/** Marks (or unmarks) a demo set as loaded on purpose, so it survives a reload. */
function markDemo(key: string, on: boolean) {
  update((s) => {
    const rest = (s.demo ?? []).filter((k) => k !== key);
    return { ...s, demo: on ? [...rest, key] : rest };
  });
}

function newId(prefix: string) {
  // crypto.randomUUID needs a secure context, which a phone on the LAN over http doesn't have.
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ---------- Actions ----------

// User
export function signIn(user: User) {
  update((s) => ({ ...s, user }));
}
export function signOut() {
  update((s) => ({ ...s, user: null }));
}
export function updateUser(patch: Partial<Omit<User, "token" | "password">>) {
  update((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
}
export function setPassword(password: string) {
  update((s) => (s.user ? { ...s, user: { ...s.user, password } } : s));
}

// Settings
export function setNotifications(notifications: boolean) {
  update((s) => ({ ...s, settings: { ...s.settings, notifications } }));
}
export function setLifeAreaImageChoice(id: LifeAreaId, choice: "custom" | "default") {
  update((s) => {
    const lifeAreaImages = { ...s.settings.lifeAreaImages };
    if (choice === "custom") lifeAreaImages[id] = "custom";
    else delete lifeAreaImages[id];
    return { ...s, settings: { ...s.settings, lifeAreaImages } };
  });
}

// CIF — answers save on every change, so the client can leave and resume at the exact question.
const cifState = (s: AppState): CifState => ({
  answers: s.cif.answers,
  lifeAreas: s.cif.lifeAreas,
  progress: s.cif.progress,
});
const withProgress = (s: AppState, patch: Partial<CifProgress>): AppState => ({
  ...s,
  cif: { ...s.cif, progress: { ...s.cif.progress, ...patch } },
});

/**
 * "My main goals" starts as text built from the focus areas and their goals. While the client
 * hasn't changed that text, it keeps following them (e.g. a focus area added from the summary);
 * once they edit it, it is theirs and is never overwritten.
 */
function refreshObjectives(s: AppState): AppState {
  const a = s.cif.answers;
  const untouched = !a.objectives.trim() || a.objectives === a.objectivesPrefill;
  if (!untouched || !a.objectivesPrefill) return s; // not reached yet, or the client's own words
  const pre = objectivesPrefill(cifState(s));
  return pre === a.objectives ? s : { ...s, cif: { ...s.cif, answers: { ...a, objectives: pre, objectivesPrefill: pre } } };
}

export function setCifAnswers(answers: Partial<CifAnswers>) {
  update((s) => {
    const next = { ...s, cif: { ...s.cif, answers: { ...s.cif.answers, ...answers } } };
    return "goals" in answers ? refreshObjectives(next) : next;
  });
}
export function setLifeAreaScore(id: LifeAreaId, score: number) {
  update((s) => ({
    ...s,
    cif: { ...s.cif, lifeAreas: s.cif.lifeAreas.map((a) => (a.id === id ? { ...a, score } : a)) },
  }));
}
/** Set the 1–3 focus areas (the client has now chosen, so the lowest-three default no longer applies). */
export function setFocusAreas(ids: LifeAreaId[]) {
  update((s) =>
    refreshObjectives(
      withProgress(
        { ...s, cif: { ...s.cif, lifeAreas: s.cif.lifeAreas.map((a) => ({ ...a, focus: ids.includes(a.id) })) } },
        { focusChosen: true },
      ),
    ),
  );
}
/** Go to a step. `push` records where we came from, for Back. */
export function cifGo(step: string, push = true) {
  update((s) => {
    const { current, history } = s.cif.progress;
    const startedAt = s.cif.progress.startedAt ?? (step !== "welcome" ? new Date().toISOString() : null);
    let next = withProgress(s, {
      current: step,
      history: push && current !== step ? [...history, current] : history,
      startedAt,
    });
    // 3.2 opens pre-filled from the goal picks; it follows the picks until the client edits it.
    if (step === "objectives") {
      const pre = objectivesPrefill(cifState(next));
      const a = next.cif.answers;
      if (!a.objectives.trim() || a.objectives === a.objectivesPrefill) {
        next = { ...next, cif: { ...next.cif, answers: { ...a, objectives: pre, objectivesPrefill: pre } } };
      }
    }
    return next;
  });
}
export function cifNext() {
  ensureLoaded();
  const { step, stopEditing } = nextStep(cifState(state));
  if (stopEditing) update((s) => withProgress(s, { editing: false }));
  cifGo(step);
}
/**
 * For screens that move on by themselves after a tap (ratings, single choices): moves on after
 * `delay`, but only if the client is still on the screen the tap was made on. Without this, a
 * second tap (or a tap during the move) moved on twice and skipped the next question unanswered.
 */
export function cifNextAfter(delay: number) {
  ensureLoaded();
  const from = state.cif.progress.current;
  setTimeout(() => {
    if (state.cif.progress.current === from) cifNext();
  }, delay);
}
export function cifBack(flowSteps: string[]) {
  update((s) => {
    const history = [...s.cif.progress.history];
    let previous = history.pop();
    while (previous && !flowSteps.includes(previous)) previous = history.pop();
    if (!previous) {
      const i = flowSteps.indexOf(s.cif.progress.current);
      previous = flowSteps[Math.max(0, i - 1)];
    }
    return withProgress(s, { current: previous, history });
  });
}
/** Edit link on the summary: jump to a screen, then come back to the summary. */
export function cifEdit(step: string) {
  update((s) => withProgress(s, { editing: true }));
  cifGo(step);
}
/** Writes everything (and the Notion columns) into store.cif. */
export function submitCif() {
  update((s) => {
    const submitted = withProgress(s, { submittedAt: new Date().toISOString(), editing: false, current: "summary" });
    return { ...submitted, cif: { ...submitted.cif, columns: toColumns(cifState(submitted)) } };
  });
}
/** Clears the CIF so the client can start again. */
export function resetCif() {
  update((s) => ({
    ...s,
    cif: {
      ...s.cif,
      answers: blankAnswers(),
      lifeAreas: s.cif.lifeAreas.map((a) => ({ ...a, score: null, focus: false })),
      progress: blankProgress(),
      columns: null,
    },
  }));
}
/** Nothing is ever unsaved (every answer writes straight away); this re-writes to be certain. */
export function saveCifProgress() {
  update((s) => s);
}
export function addKeyResult(keyResult: Omit<KeyResult, "id">) {
  update((s) => ({
    ...s,
    cif: { ...s.cif, keyResults: [...s.cif.keyResults, { ...keyResult, id: newId("kr") }] },
  }));
}
export function updateKeyResult(id: string, patch: Partial<Omit<KeyResult, "id">>) {
  update((s) => ({
    ...s,
    cif: { ...s.cif, keyResults: s.cif.keyResults.map((k) => (k.id === id ? { ...k, ...patch } : k)) },
  }));
}
export function removeKeyResult(id: string) {
  update((s) => ({ ...s, cif: { ...s.cif, keyResults: s.cif.keyResults.filter((k) => k.id !== id) } }));
}
export function signAgreement() {
  update((s) => ({ ...s, cif: { ...s.cif, agreementSigned: true } }));
}

// Life Purpose
export function addStory(story: Omit<Story, "id">) {
  update((s) => ({
    ...s,
    lifePurpose: { ...s.lifePurpose, stories: [...s.lifePurpose.stories, { ...story, id: newId("story") }] },
  }));
}
export function updateStory(id: string, patch: Partial<Omit<Story, "id">>) {
  update((s) => ({
    ...s,
    lifePurpose: {
      ...s.lifePurpose,
      stories: s.lifePurpose.stories.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    },
  }));
}
export function removeStory(id: string) {
  update((s) => ({
    ...s,
    lifePurpose: { ...s.lifePurpose, stories: s.lifePurpose.stories.filter((st) => st.id !== id) },
  }));
}
export function setClusters(clusters: Cluster[]) {
  update((s) => ({ ...s, lifePurpose: { ...s.lifePurpose, clusters } }));
}
export function setPowerWords(powerWords: string[]) {
  update((s) => ({ ...s, lifePurpose: { ...s.lifePurpose, powerWords } }));
}
export function setStatement(statement: string) {
  update((s) => ({
    ...s,
    lifePurpose: {
      ...s.lifePurpose,
      statement,
      status: s.lifePurpose.status === "empty" ? "draft" : s.lifePurpose.status,
    },
  }));
}
/** Internal demo only (/_index): load Meera's sample Life Purpose, as a draft or final. */
export function loadSampleLifePurpose(status: "draft" | "final") {
  update((s) => ({
    ...s,
    lifePurpose: {
      stories: data.stories,
      powerWords: data.powerWords,
      clusters: data.clusters,
      statement: data.lifePurposeStatement,
      status,
      drafts: [...data.purposeDrafts, { date: "2026-09-30", text: data.lifePurposeStatement }],
      makeItReal: [0, 1],
      bodyFeel: data.purposeBodyFeel,
    },
  }));
  markDemo("lifePurpose", true);
}
/** Internal demo only (/_index): back to an empty Life Purpose. */
export function clearLifePurpose() {
  update((s) => ({ ...s, lifePurpose: emptyLifePurpose() }));
  markDemo("lifePurpose", false);
}
/** "Draft Feels True": keeps the client's own words as the current draft and in the history. */
export function saveDraft(text: string) {
  update((s) => {
    const lp = s.lifePurpose;
    const last = lp.drafts[lp.drafts.length - 1];
    const drafts =
      last?.text === text ? lp.drafts : [...lp.drafts, { date: new Date().toISOString().slice(0, 10), text }];
    return { ...s, lifePurpose: { ...lp, statement: text, status: "draft", drafts } };
  });
}
/** "I feel this most in my ___" — one word, exactly as the client says it. */
export function setBodyFeel(bodyFeel: string) {
  update((s) => ({ ...s, lifePurpose: { ...s.lifePurpose, bodyFeel } }));
}
export function toggleMakeItReal(index: number) {
  update((s) => {
    const done = s.lifePurpose.makeItReal;
    const makeItReal = done.includes(index) ? done.filter((i) => i !== index) : [...done, index];
    return { ...s, lifePurpose: { ...s.lifePurpose, makeItReal } };
  });
}
export function setPurposeStatus(status: PurposeStatus) {
  update((s) => ({ ...s, lifePurpose: { ...s.lifePurpose, status } }));
}

// Visions
function sampleVisions() {
  return Object.fromEntries(data.visions.map((v) => [v.lifeArea, v])) as Partial<Record<LifeAreaId, Vision>>;
}
export function loadSampleVisions() {
  update((s) => ({ ...s, visions: { ...s.visions, byLifeArea: sampleVisions(), areasFinal: true } }));
  markDemo("visions", true);
}
export function clearVisions() {
  update((s) => ({ ...s, visions: { byLifeArea: {}, added: [], removed: [], areasFinal: false } }));
  markDemo("visions", false);
}
/** Takes an area off the list while the areas are still being chosen. */
export function removeVisionArea(lifeArea: LifeAreaId) {
  update((s) =>
    s.visions.areasFinal
      ? s
      : {
          ...s,
          visions: {
            ...s.visions,
            added: s.visions.added.filter((a) => a !== lifeArea),
            removed: s.visions.removed.includes(lifeArea) ? s.visions.removed : [...s.visions.removed, lifeArea],
          },
        },
  );
}
/** "Finalise My Life Areas": the questions open, and the areas are fixed from here. */
export function finalizeVisionAreas() {
  update((s) => ({ ...s, visions: { ...s.visions, areasFinal: true } }));
}
export function addVisionArea(lifeArea: LifeAreaId) {
  update((s) =>
    s.visions.areasFinal || s.visions.added.includes(lifeArea)
      ? s
      : { ...s, visions: { ...s.visions, added: [...s.visions.added, lifeArea], removed: s.visions.removed.filter((a) => a !== lifeArea) } },
  );
}
export function setVision(lifeArea: LifeAreaId, patch: Partial<Omit<Vision, "lifeArea">>) {
  update((s) => {
    const current: Vision = s.visions.byLifeArea[lifeArea] ?? {
      lifeArea,
      answers: { livedOnPurpose: "", doOrBe: "", energizingValues: "", lifetime: "" },
      statement: "",
      byPowerWord: {},
    };
    return {
      ...s,
      visions: { ...s.visions, byLifeArea: { ...s.visions.byLifeArea, [lifeArea]: { ...current, ...patch } } },
    };
  });
}
export function removeVision(lifeArea: LifeAreaId) {
  update((s) => {
    const byLifeArea = { ...s.visions.byLifeArea };
    delete byLifeArea[lifeArea];
    return { ...s, visions: { ...s.visions, byLifeArea } };
  });
}

// Values & Qualities
export function setDiscovery(run: Run | null) {
  update((s) => ({ ...s, discovery: run }));
}
/** Saves the confirmed discovery results as the client's values and qualities. */
export function saveDiscoveryResults(view: FinalView) {
  const trait = (x: FinalView["values"][number]): Trait => ({
    id: x.key,
    name: x.name,
    strength: x.label,
    moments: x.trail,
    score: x.score,
  });
  const values = view.values.map(trait);
  const qualities = view.qualities.map(trait);
  update((s) => ({
    ...s,
    values: {
      selected: values,
      final: values.map((v) => v.id),
      added: view.added.filter((a) => a.type !== "quality").map((a) => a.name),
    },
    qualities: {
      selected: qualities,
      final: qualities.map((q) => q.id),
      added: view.added.filter((a) => a.type === "quality").map((a) => a.name),
    },
  }));
}
export function loadSampleValues() {
  update((s) => ({
    ...s,
    values: { selected: data.values, final: data.finalValueIds, added: [] },
    qualities: { selected: data.qualities, final: data.finalQualityIds, added: [] },
  }));
  markDemo("values", true);
}
export function clearValues() {
  update((s) => ({
    ...s,
    values: { selected: [], final: [], added: [] },
    qualities: { selected: [], final: [], added: [] },
    discovery: null,
  }));
  markDemo("values", false);
}
export function setSelectedValues(selected: Trait[]) {
  update((s) => ({ ...s, values: { ...s.values, selected } }));
}
export function setFinalValues(ids: string[]) {
  update((s) => ({ ...s, values: { ...s.values, final: ids } }));
}
export function setSelectedQualities(selected: Trait[]) {
  update((s) => ({ ...s, qualities: { ...s.qualities, selected } }));
}
export function setFinalQualities(ids: string[]) {
  update((s) => ({ ...s, qualities: { ...s.qualities, final: ids } }));
}

// Outcomes — the period running now
const withOutcomes = (s: AppState, patch: Partial<AppState["outcomes"]>): AppState => ({
  ...s,
  outcomes: { ...s.outcomes, ...patch },
});
const mapCurrent = (s: AppState, id: string, change: (o: Outcome) => Outcome) =>
  withOutcomes(s, { currentPeriod: s.outcomes.currentPeriod.map((o) => (o.id === id ? change(o) : o)) });

/** A note against one outcome, saved word for word with the moment it was written. */
export function addOutcomeNote(outcomeId: string, text: string) {
  const note = { id: newId("n"), at: new Date().toISOString(), text };
  update((s) => mapCurrent(s, outcomeId, (o) => ({ ...o, notes: [...o.notes, note] })));
}
export function removeOutcomeNote(outcomeId: string, noteId: string) {
  update((s) => mapCurrent(s, outcomeId, (o) => ({ ...o, notes: o.notes.filter((n) => n.id !== noteId) })));
}
/** Today's tick on a tracked outcome (one per day). Ticking is not the close: Done is said there. */
export function toggleTick(id: string, date: string) {
  update((s) => mapCurrent(s, id, (o) => ({ ...o, ticks: o.ticks.includes(date) ? o.ticks.filter((d) => d !== date) : [...o.ticks, date] })));
}
/** The close, one outcome at a time: Done or Not done (and a Being outcome's score). */
export function reviewOutcome(id: string, done: boolean, score?: number | null) {
  update((s) => mapCurrent(s, id, (o) => ({ ...o, done, closed: true, score: score === undefined ? o.score : score })));
}
export function setOutcomeScore(id: string, score: number | null) {
  update((s) => mapCurrent(s, id, (o) => ({ ...o, score })));
}

/** Moves the reviewed period into Prior with its scores; the well-being scores go with it. */
export function closePeriod(scores: { overall: number; priority: number; wellbeing: number }) {
  update((s) => {
    const p = s.outcomes.period;
    if (!p) return s;
    const past: PastPeriod = {
      id: p.id,
      label: `Period ${p.number}`,
      start: p.start,
      end: p.end,
      ...scores,
      outcomes: s.outcomes.currentPeriod,
      lifeCodesEmerged: s.lifeCodes.filter((c) => c.periodId === p.id).map((c) => c.id),
    };
    const numbers = Object.fromEntries(
      Object.entries(s.wellbeing.scores).filter((e): e is [string, number] => typeof e[1] === "number"),
    );
    return {
      ...withOutcomes(s, { period: null, currentPeriod: [], pastPeriods: [past, ...s.outcomes.pastPeriods] }),
      wellbeing: { scores: {}, submitted: false, pastScores: [{ periodId: p.id, scores: numbers }, ...s.wellbeing.pastScores] },
    };
  });
}

// Outcomes — building the next period
const withDraft = (s: AppState, patch: Partial<AppState["outcomes"]["draft"]>) =>
  withOutcomes(s, { draft: { ...s.outcomes.draft, ...patch } });

export function setDraftEnd(end: string | null) {
  update((s) => withDraft(s, { end }));
}
export function addDraftOutcome(input: { lifeArea: LifeAreaId; type: OutcomeType; text: string; goalId: string | null; track: boolean }) {
  const outcome: Outcome = { ...input, id: newId("o"), priority: null, done: false, score: null, notes: [], ticks: [], closed: false };
  update((s) => withDraft(s, { outcomes: [...s.outcomes.draft.outcomes, outcome] }));
}
export function removeDraftOutcome(id: string) {
  update((s) => withDraft(s, { outcomes: s.outcomes.draft.outcomes.filter((o) => o.id !== id) }));
}
/** The order the client dragged them into; #1 first. */
export function orderDraft(ids: string[]) {
  update((s) => {
    const byId = new Map(s.outcomes.draft.outcomes.map((o) => [o.id, o]));
    return withDraft(s, { outcomes: ids.map((id) => byId.get(id)).filter((o): o is Outcome => !!o) });
  });
}
/** "Yes, start my game": the draft becomes the period running now, in the order it was left. */
export function startPeriod() {
  update((s) => {
    const { end, outcomes } = s.outcomes.draft;
    if (!end || outcomes.length === 0) return s;
    const number = s.outcomes.pastPeriods.length + (s.outcomes.period ? 2 : 1);
    const period: Period = { id: newId("p"), number, start: toIsoDate(new Date()), end };
    return withOutcomes(s, {
      period,
      currentPeriod: outcomes.map((o, i) => ({ ...o, priority: i + 1 })),
      draft: { end: null, outcomes: [] },
    });
  });
}
/** "Yes, Cancel Game": the period being built is cleared and can't be brought back. */
export function cancelDraft() {
  update((s) => withDraft(s, { end: null, outcomes: [] }));
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Well-being
export function setQualityScore(quality: string, score: number | null) {
  update((s) => ({ ...s, wellbeing: { ...s.wellbeing, scores: { ...s.wellbeing.scores, [quality]: score } } }));
}
export function submitWellbeing() {
  update((s) => ({ ...s, wellbeing: { ...s.wellbeing, submitted: true } }));
}

// Life Codes — saved only once the client has written the statement and answered the questions.
export type LifeCodeInput = Pick<LifeCode, "statement" | "lifeAreas" | "allLifeAreas" | "type" | "howOrWhenToUse">;

export function addLifeCode(input: LifeCodeInput, source: LifeCodeSource, periodId: string | null = null) {
  const id = newId("lc");
  update((s) => ({ ...s, lifeCodes: [...s.lifeCodes, { ...input, id, addedThrough: source, periodId, status: "active" }] }));
  return id;
}
export function updateLifeCode(id: string, patch: Partial<Omit<LifeCode, "id">>) {
  update((s) => ({ ...s, lifeCodes: s.lifeCodes.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}
/** Archive, never delete: the life code is kept and leaves the active list. */
export function archiveLifeCode(id: string, reason: string) {
  updateLifeCode(id, { status: "archived", archivedReason: reason });
}
export function restoreLifeCode(id: string) {
  updateLifeCode(id, { status: "active", archivedReason: undefined });
}

/** Demo: Meera's submitted CIF, which unlocks the other modules. */
export function loadSampleCif() {
  update((s) => ({ ...s, cif: sampleCif() }));
}
export function clearCif() {
  update((s) => ({ ...s, cif: emptyCif() }));
}

/** Demo: Meera's period 7 running, three closed periods, her well-being history and life codes. */
export function loadSampleEngine() {
  update((s) => ({
    ...s,
    outcomes: { period: data.currentPeriod, currentPeriod: data.currentOutcomes, draft: { end: null, outcomes: [] }, pastPeriods: data.pastPeriods },
    wellbeing: { scores: {}, submitted: false, pastScores: data.pastWellbeingScores },
    lifeCodes: data.lifeCodes,
  }));
  markDemo("engine", true);
}
export function clearEngine() {
  update((s) => ({ ...s, outcomes: emptyOutcomes(), wellbeing: { scores: {}, submitted: false, pastScores: [] }, lifeCodes: [] }));
  markDemo("engine", false);
}

// Demo
export function resetToSample() {
  update(() => sampleState());
}

/**
 * The login screen's two demo accounts. Signing in as one replaces everything saved in this
 * browser with that account's state (any password works; the token comes from lib/auth.ts).
 *   "full" — demo@aatam.co, Rohan Iyer: every module complete (content in lib/demo-data.ts).
 *   "new"  — new@aatam.co: a brand-new client, nothing done and every module locked.
 */
export function loadDemoAccount(kind: "full" | "new", token: string) {
  const base = sampleState();
  if (kind === "new") {
    update(() => ({
      ...base,
      user: { ...demoNewAccount.user, token },
      lifePurpose: emptyLifePurpose(),
      demo: [],
    }));
    return;
  }

  const d = demoFullAccount;
  const cif = {
    answers: d.cif.answers,
    lifeAreas: data.lifeAreas.map((a) => ({ ...a, score: d.cif.wheel[a.id], focus: d.cif.focus.includes(a.id) })),
    progress: { current: "summary", history: [], editing: false, focusChosen: true, startedAt: d.cif.startedAt, submittedAt: d.cif.submittedAt },
  };
  update(() => ({
    ...base,
    user: { ...d.user, token },
    cif: { ...cif, keyResults: d.cif.keyResults, agreementSigned: true, columns: toColumns(cif) },
    lifePurpose: {
      stories: d.lifePurpose.stories,
      powerWords: d.lifePurpose.powerWords,
      clusters: d.lifePurpose.clusters,
      statement: d.lifePurpose.statement,
      status: "final",
      drafts: [...d.lifePurpose.drafts, { date: "2026-08-17", text: d.lifePurpose.statement }],
      makeItReal: d.lifePurpose.makeItReal,
      bodyFeel: d.lifePurpose.bodyFeel,
    },
    visions: {
      byLifeArea: Object.fromEntries(d.visions.map((v) => [v.lifeArea, v])),
      added: [],
      removed: [],
      areasFinal: true,
    },
    values: { selected: d.values, final: d.finalValueIds, added: [] },
    qualities: { selected: d.qualities, final: d.finalQualityIds, added: [] },
    discovery: null,
    outcomes: { period: d.period, currentPeriod: d.currentOutcomes, draft: { end: null, outcomes: [] }, pastPeriods: d.pastPeriods },
    wellbeing: { scores: {}, submitted: false, pastScores: d.pastWellbeingScores },
    lifeCodes: d.lifeCodes,
    // Kept on reload even where it looks like an untouched sample.
    demo: ["lifePurpose", "visions", "values", "engine"],
  }));
}

// ---------- React ----------

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => serverState);
  return createElement(AppContext.Provider, { value }, children);
}

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp() must be used inside <AppProvider>");
  return value;
}
