// Home-page modules: progress is worked out from the store as
// "how many of the module's required pieces are filled in".
// Each module also says where its final screen is and where to resume.
// Routes are placeholders until each module's screens are built.

import { flow, isAnswered } from "./cif";
import type { CifProgress } from "./data";
import type { AppState } from "./store";

// Optional questions count as answered, so a form nobody has opened must not look started.
const started = (p: CifProgress) => p.startedAt !== null || p.history.length > 0;

export type ModuleId =
  | "lifePurpose"
  | "vision"
  | "values"
  | "qualities"
  | "guidelines"
  | "journey"
  | "myself";

export type ModuleStatus = "not-started" | "in-progress" | "finished";

export type ModuleProgress = {
  status: ModuleStatus;
  percent: number; // 0–100
  href: string | null; // null = not started and waiting for the coach to open it
};

type Piece = { done: boolean; resume: string };
// startHref: where a not-started module opens. Without one, home shows the coach pop-up.
type Definition = { finalHref: string; startHref?: string; pieces: (s: AppState) => Piece[] };

const filled = (text: string | undefined | null) => !!text && text.trim().length > 0;

const definitions: Record<ModuleId, Definition> = {
  // CIF: every question on the client's path through the form, then the submission.
  // The form itself resumes at the exact question, so in-progress always opens /cif.
  myself: {
    finalHref: "/cif?step=summary",
    pieces: ({ cif }) => {
      const s = { answers: cif.answers, lifeAreas: cif.lifeAreas, progress: cif.progress };
      const questions = flow(s).filter((step) => !/^(welcome|ch\d|break:\d|summary)$/.test(step));
      return [
        ...questions.map((step) => ({ done: started(cif.progress) && isAnswered(step, s), resume: "/cif" })),
        { done: cif.progress.submittedAt !== null, resume: "/cif" },
      ];
    },
  },

  // Life Purpose: stories (2–3 to start) → clusters → power words → statement → feels true.
  lifePurpose: {
    finalHref: "/life-purpose/final",
    startHref: "/life-purpose", // the client starts Life Purpose on their own
    pieces: ({ lifePurpose: lp }) => [
      { done: lp.stories.length >= 1, resume: "/life-purpose/stories" },
      { done: lp.stories.length >= 2, resume: "/life-purpose/stories" },
      { done: lp.stories.length >= 3, resume: "/life-purpose/stories" },
      { done: lp.clusters.length > 0, resume: "/life-purpose/clustering" },
      { done: lp.powerWords.length > 0, resume: "/life-purpose/naming" },
      { done: filled(lp.statement), resume: "/life-purpose/write" },
      { done: lp.status === "final", resume: "/life-purpose" },
    ],
  },

  // Vision: for each life area started, the four questions plus the "I ..." statement.
  // The four questions are optional, so a vision counts as done once its statement is written.
  vision: {
    finalHref: "/visions/all",
    startHref: "/visions", // the client starts Visions on their own
    pieces: ({ visions }) =>
      Object.values(visions.byLifeArea).flatMap((v) =>
        v ? [{ done: filled(v.statement), resume: `/visions/${v.lifeArea}/write` }] : [],
      ),
  },

  // Values & Qualities: one discovery run finds both. Started once the first question is answered,
  // finished once the client confirms the results. The intro offers "Continue where I left off".
  values: {
    finalHref: "/values/mine",
    startHref: "/values", // the client starts the discovery on their own
    pieces: ({ values, discovery }) => {
      const confirmed = values.final.length > 0 || values.added.length > 0;
      return [
        { done: confirmed || (discovery?.state.answered ?? 0) > 0, resume: "/values" },
        { done: confirmed, resume: "/values" },
      ];
    },
  },
  qualities: {
    finalHref: "/values/qualities",
    startHref: "/values",
    pieces: ({ qualities, discovery }) => {
      const confirmed = qualities.final.length > 0 || qualities.added.length > 0;
      return [
        { done: confirmed || (discovery?.state.answered ?? 0) > 0, resume: "/values" },
        { done: confirmed, resume: "/values" },
      ];
    },
  },

  // My Life Code: every active life code has its statement and its "how or when" answer.
  // The list always opens on its own screen, empty or not.
  guidelines: {
    finalHref: "/life-code",
    startHref: "/life-code",
    pieces: ({ lifeCodes }) =>
      lifeCodes
        .filter((c) => c.status === "active")
        .flatMap((c) =>
          [c.statement, c.howOrWhenToUse].map((text) => ({ done: filled(text), resume: `/life-code/${c.id}` })),
        ),
  },

  // My Journey (the Engine): a period running with its outcomes set.
  // Every step opens Today, the tab the client lands on.
  journey: {
    finalHref: "/outcomes/today",
    startHref: "/outcomes/today",
    // Complete once a period is running with its outcomes set; the close is a flow of its own.
    pieces: ({ outcomes }) =>
      outcomes.period || outcomes.draft.end
        ? [
            { done: !!outcomes.period, resume: "/outcomes/today" },
            { done: outcomes.currentPeriod.length > 0, resume: "/outcomes/today" },
          ]
        : [],
  },
};

export function getModuleProgress(state: AppState, id: ModuleId): ModuleProgress {
  const { finalHref, startHref, pieces } = definitions[id];
  const list = pieces(state);
  const done = list.filter((p) => p.done).length;

  if (done === 0) return { status: "not-started", percent: 0, href: startHref ?? null };
  if (done === list.length) return { status: "finished", percent: 100, href: finalHref };

  const nextStep = list.find((p) => !p.done)!;
  return {
    status: "in-progress",
    percent: Math.round((done / list.length) * 100),
    href: nextStep.resume,
  };
}
