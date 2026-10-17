// The CIF engine: content, routing and the Notion column mapping. No UI.
// Everything here mirrors the live form at https://begin.aatam.co/ (v0.1) — question wording,
// option labels, chapter names/times/intros, branching and the "column -> value" mapping.
// Clients never see a step id, a chapter number or a rule name.

import type { CifAnswers, CifProgress, LifeArea, LifeAreaId } from "./data";

// ---------- content ----------

export const BOOKING_URL = "https://zcal.co/dinesh";

export const CHAPTERS = [
  { title: "About you", time: "1 min", intro: "First, the basics, so I know how to show up for you." },
  { title: "Your life wheel", time: "2 min", intro: "A quick snapshot of your life right now. Go with your gut." },
  { title: "Your goals", time: "2-3 min", intro: "Now let's look at where you would like to grow." },
  { title: "This season", time: "1 min", intro: "Every season of life asks something different of us." },
  { title: "Working together", time: "1-2 min", intro: "Everyone has things that slow them down. Let's name yours, and what keeps you going." },
  { title: "Who you are", time: "1-2 min", intro: "A few things to help me know the whole you." },
  { title: "Since we last spoke", time: "1 min", intro: "One last question." },
];

// The 12 life areas in wheel order. `notion` is the area's name in Notion.
export const AREAS: {
  id: LifeAreaId;
  notion: string;
  label: string;
  phrase: string;
  hint: string;
  color: string;
  goals: string[];
}[] = [
  { id: "career", notion: "Career", label: "Career", phrase: "your career", hint: "Work, vocation, how you spend your working days", color: "#4A3122",
    goals: ["Get clear on my direction", "Change roles or fields", "Grow or get promoted", "Start something of my own", "Lead with more confidence", "Set better boundaries between work and life"] },
  { id: "money", notion: "Money", label: "Money", phrase: "your finances", hint: "Income, savings, how you feel about money", color: "#D9A441",
    goals: ["Get clear on my financial goals", "Feel calmer about money", "Build savings or a safety cushion", "Grow my income", "Spend in line with my values"] },
  { id: "health", notion: "Health", label: "Health", phrase: "your health", hint: "Energy, sleep, movement, wellbeing", color: "#659266",
    goals: ["Have more energy", "Sleep better", "Move my body more", "Eat in a way that feels good", "Manage stress", "Care for a health condition"] },
  { id: "appearance", notion: "Appearance", label: "Appearance", phrase: "how you feel about your appearance", hint: "How you look and feel in your own skin", color: "#E78C80",
    goals: ["Feel more confident in how I look", "Refresh my style", "Take better care of myself", "Accept and appreciate my body"] },
  { id: "home", notion: "Home", label: "Home", phrase: "your home", hint: "The place you live and how it feels", color: "#A07C5B",
    goals: ["Create a space I love", "Declutter and simplify", "Plan a move", "Make home more peaceful"] },
  { id: "family", notion: "Family", label: "Family", phrase: "your family life", hint: "Parents, children, the family you're part of", color: "#B97066",
    goals: ["Spend more quality time together", "Communicate better", "Set healthy boundaries", "Heal or restore a relationship", "Support a family member"] },
  { id: "friends", notion: "Friends", label: "Friends", phrase: "your friendships", hint: "Friendships and social life", color: "#E2B866",
    goals: ["Make new friends", "Deepen the friendships I have", "Reconnect with old friends", "Let go of friendships that drain me"] },
  { id: "relationship", notion: "Relationship", label: "Relationship", phrase: "your relationship", hint: "Partner or romantic life", color: "#C2584D",
    goals: ["Deepen my connection with my partner", "Communicate and resolve conflict better", "Get clear on what I want in a relationship", "Meet someone", "Heal from a past relationship"] },
  { id: "fun", notion: "Fun", label: "Fun", phrase: "the fun in your life", hint: "Play, joy, recreation", color: "#F0A48F",
    goals: ["Make time for joy", "Rediscover old hobbies", "Try new experiences", "Be more playful and spontaneous"] },
  { id: "personal-development", notion: "Personal Development", label: "Personal Development", phrase: "your personal development", hint: "Learning, growth, becoming who you want to be", color: "#7EB77F",
    goals: ["Build self-confidence", "Understand myself better", "Learn something new", "Build better habits", "Stop overthinking"] },
  { id: "spirituality", notion: "Spirituality", label: "Spirituality", phrase: "your spiritual life", hint: "Meaning, faith, inner life", color: "#444C35",
    goals: ["Find more meaning", "Build a regular practice", "Feel more connected or at peace", "Explore my beliefs"] },
  { id: "service", notion: "Service", label: "Service", phrase: "the way you give back", hint: "Giving back, community, volunteering", color: "#8A9A6B",
    goals: ["Give back to my community", "Find a cause I care about", "Use my gifts to help others", "Balance giving with caring for myself"] },
];
export const AREA = Object.fromEntries(AREAS.map((a) => [a.id, a])) as Record<LifeAreaId, (typeof AREAS)[number]>;

type Choice = { label: string; save: string };

export const OPT = {
  pronouns: ["She/Her", "He/Him", "They/Them", "Prefer not to say"],
  contact: ["Email", "Text", "Call"],
  age: ["Under 20", "20s", "30s", "40s", "50s", "60s", "70s+", "Prefer not to say"],
  special: ["Direction in life", "Balance", "Self-confidence", "Positive thinking", "Service to myself", "Managing stress", "Fun", "Implementation of choices", "Time management", "Prioritizing", "Completing activities", "Personal organization", "Using visualization", "Using affirmations", "Other"],
  transition: [
    { label: "Yes. I'm in a transition and I know what it is", save: "Yes - I know what it is", route: "A" },
    { label: "Yes, but I can't name it yet", save: "Yes - but I can not name it yet", route: "B" },
    { label: "No, but something feels off", save: "No - but something feels off", route: "B" },
    { label: "I'm not sure", save: "Unsure", route: "B" },
    { label: "Things are good. I want more", save: "No - things are good and I want more", route: "none" },
  ] as (Choice & { route: "A" | "B" | "none" })[],
  changeKind: ["Career or work change", "A relationship beginning or ending", "Moving home, city or country", "Becoming a parent", "Children leaving home", "A health change", "Loss or grief", "Retirement", "A shift in identity or purpose"],
  noticed: ["I feel restless", "I'm going through the motions", "Less energy for things I used to love", "I'm questioning my direction", "I feel stuck", "I compare myself to others more"],
  obstacles: ["Self-doubt", "Not enough time", "Not sure what I really want", "Other people's expectations", "Overthinking", "I start strong, then lose steam", "Fear of failing", "Money", "Energy or health"],
  motivation: ["Seeing real progress", "A sense of purpose or meaning", "Encouragement from people around me", "The satisfaction of overcoming a challenge", "Being accountable to someone"],
  coached: [
    { label: "Yes, formal coaching", save: "Yes - formal coaching", yes: true },
    { label: "Yes, informally", save: "Yes - informally", yes: true },
    { label: "No, this is my first time", save: "No", yes: false },
  ] as (Choice & { yes: boolean })[],
  worked: ["Accountability", "A fresh perspective", "Structure", "Feeling heard", "Practical tools"],
  didnt: ["Too much talk, not enough action", "Too rigid", "I didn't feel understood", "The timing wasn't right", "Cost"],
  challenge: [
    { label: "A lot. Push me to grow", save: "Push me to grow" },
    { label: "Quite a bit, but step by step", save: "Gradual challenges" },
    { label: "Some, but it's not the main thing", save: "Some challenge" },
    { label: "I'd rather set my own pace", save: "My own pace" },
    { label: "I'm not sure yet", save: "Not sure yet" },
  ] as Choice[],
  hobbies: ["Reading", "Music", "Sport or fitness", "Outdoors and nature", "Cooking", "Travel", "Arts and crafts", "Gardening", "Games", "Volunteering"],
  background: ["Faith or spirituality", "Cultural heritage", "Family expectations", "Language", "Identity", "Neurodiversity", "A life experience I'd like you to know about"],
};
export const EXPLORE = "I'm not sure yet. I'd like to explore this together";
export const OWN_GOAL = "I'd rather write it in my own words";

// ---------- blank state ----------

export function blankAnswers(): CifAnswers {
  return {
    name: "", email: "", pronoun: null, pronounOwn: "", contact: null, age: null,
    goals: {}, objectives: "", objectivesPrefill: "", special: [],
    transition: null, transDetail: [], transOwn: "",
    obstacles: [], obstaclesOwn: "", obstacleStory: "", motivation: [], motivationOwn: "",
    coached: null, worked: [], workedOwn: "", didnt: [], didntOwn: "", challenge: null,
    hobbies: [], hobbiesOwn: "", words: ["", "", ""], bgTags: [], bgNone: false, bgMore: "",
    anythingElse: "", reflection: "",
  };
}

export function blankProgress(): CifProgress {
  return { current: "welcome", history: [], editing: false, focusChosen: false, startedAt: null, submittedAt: null };
}

// ---------- helpers ----------

export type CifState = { answers: CifAnswers; lifeAreas: LifeArea[]; progress: CifProgress };

const scoreOf = (areas: LifeArea[], id: LifeAreaId) => areas.find((a) => a.id === id)?.score ?? null;
const wheelIndex = (id: LifeAreaId) => AREAS.findIndex((a) => a.id === id);
const filled = (s: string | null | undefined) => !!s && s.trim().length > 0;
export const withOwn = (arr: string[], own: string) => [...arr, filled(own) ? own.trim() : null].filter(Boolean) as string[];
export const listJoin = (arr: string[]) => arr.filter(Boolean).join(", ");

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "";
}

/** Areas sorted lowest score first; ties keep wheel order (the order the focus screen shows). */
export function byScoreAscending(areas: LifeArea[]) {
  return areas
    .filter((a) => a.score !== null)
    .slice()
    .sort((a, b) => a.score! - b.score! || wheelIndex(a.id) - wheelIndex(b.id));
}

/** The three lowest scores, pre-ticked as focus areas. */
export function bottomThree(areas: LifeArea[]): LifeAreaId[] {
  return byScoreAscending(areas).slice(0, 3).map((a) => a.id);
}

/** The 3 highest scores as "most alive"; a tie for third keeps all tied areas, up to 4. Saved without asking. */
export function topAlive(areas: LifeArea[]): LifeAreaId[] {
  const scored = areas
    .filter((a) => a.score !== null)
    .slice()
    .sort((a, b) => b.score! - a.score! || wheelIndex(a.id) - wheelIndex(b.id));
  if (scored.length <= 3) return scored.map((a) => a.id);
  const third = scored[2].score;
  return scored.filter((a, i) => i < 3 || a.score === third).slice(0, 4).map((a) => a.id);
}

/** Focus areas in the order the focus screen lists them. Before the client has chosen, the three lowest. */
export function focusList(s: CifState): LifeAreaId[] {
  if (!s.progress.focusChosen) return bottomThree(s.lifeAreas);
  return byScoreAscending(s.lifeAreas.filter((a) => a.focus)).map((a) => a.id);
}

export function transitionRoute(a: CifAnswers) {
  return OPT.transition.find((o) => o.save === a.transition)?.route ?? null;
}

export function coachedYes(a: CifAnswers) {
  return !!OPT.coached.find((o) => o.save === a.coached)?.yes;
}

export function firstObstacle(a: CifAnswers) {
  return a.obstacles[0] || a.obstaclesOwn.trim();
}

/** Pre-fill for "my main goals": one line per focus area, built from the picks and own words. */
export function objectivesPrefill(s: CifState) {
  return focusList(s)
    .map((id) => {
      const g = s.answers.goals[id];
      const label = AREA[id].label;
      if (g?.explore) return `${label}: I'd like to explore this together.`;
      const parts = [...(g?.picks ?? []).map((x) => x.charAt(0).toLowerCase() + x.slice(1)), (g?.own ?? "").trim()].filter(Boolean);
      return parts.length ? `${label}: ${parts.join("; ")}.` : null;
    })
    .filter(Boolean)
    .join("\n");
}

// ---------- routing ----------

/** The full path through the form for the current answers. Breaks follow chapters 3 and 5. */
export function flow(s: CifState): string[] {
  const f = ["welcome", "ch1", "name", "pronoun", "contact", "age", "ch2"];
  AREAS.forEach((a) => f.push("rate:" + a.id));
  f.push("focus", "ch3");
  focusList(s).forEach((id) => f.push("goal:" + id));
  f.push("objectives", "special", "break:3", "ch4", "transition");
  const route = transitionRoute(s.answers);
  if (route === "A") f.push("changeKind");
  if (route === "B") f.push("noticed");
  f.push("ch5", "obstacles", "obstacleStory", "motivation", "coached");
  if (coachedYes(s.answers)) f.push("worked");
  f.push("challenge", "break:5", "ch6", "hobbies", "words", "background");
  if (s.answers.bgTags.length) f.push("bgMore");
  f.push("anythingElse", "ch7", "reflection", "summary");
  return f;
}

/** Which chapter a step belongs to (1–7). 0 for the welcome, 8 for the summary. */
export function chapterOf(step: string): number {
  if (step === "welcome") return 0;
  if (/^ch\d$/.test(step)) return +step.slice(2);
  if (step.startsWith("break:")) return +step.slice(6);
  if (step.startsWith("rate:")) return 2;
  if (step.startsWith("goal:")) return 3;
  const map: Record<string, number> = {
    name: 1, pronoun: 1, contact: 1, age: 1, focus: 2, objectives: 3, special: 3,
    transition: 4, changeKind: 4, noticed: 4,
    obstacles: 5, obstacleStory: 5, motivation: 5, coached: 5, worked: 5, challenge: 5,
    hobbies: 6, words: 6, background: 6, bgMore: 6, anythingElse: 6, reflection: 7, summary: 8,
  };
  return map[step] ?? 0;
}

/** Whether a question has the answer it needs to move on. Optional and info screens always pass. */
export function isAnswered(step: string, s: CifState): boolean {
  const a = s.answers;
  if (step.startsWith("rate:")) return scoreOf(s.lifeAreas, step.slice(5) as LifeAreaId) !== null;
  if (step.startsWith("goal:")) {
    const g = a.goals[step.slice(5) as LifeAreaId];
    return !!g && (g.explore || g.picks.length > 0 || filled(g.own));
  }
  switch (step) {
    case "name": return filled(a.name) && /^\S+@\S+\.\S+$/.test(a.email.trim());
    case "contact": return a.contact !== null;
    case "focus": return focusList(s).length > 0;
    case "objectives": return filled(a.objectives);
    case "special": return a.special.length > 0;
    case "transition": return a.transition !== null;
    case "changeKind":
    case "noticed": return a.transDetail.length > 0 || filled(a.transOwn);
    case "obstacles": return a.obstacles.length > 0 || filled(a.obstaclesOwn);
    case "motivation": return a.motivation.length > 0 || filled(a.motivationOwn);
    case "coached": return a.coached !== null;
    case "challenge": return a.challenge !== null;
    case "hobbies": return a.hobbies.length > 0 || filled(a.hobbiesOwn);
    case "words": return a.words.every(filled);
    case "background": return a.bgNone || a.bgTags.length > 0;
    case "reflection": return filled(a.reflection);
    default: return true; // welcome, chapters, breaks, optional questions
  }
}

/** Where "Continue" goes. While editing from the summary: on to the next unanswered question, else back to the summary. */
export function nextStep(s: CifState): { step: string; stopEditing: boolean } {
  const f = flow(s);
  const i = f.indexOf(s.progress.current);
  const following = f[Math.min(i + 1, f.length - 1)];
  if (!s.progress.editing) return { step: following, stopEditing: false };
  // Walking the wheel: keep going through the remaining areas.
  if (s.progress.current.startsWith("rate:") && following.startsWith("rate:")) return { step: following, stopEditing: false };
  const missing = f.slice(i + 1).find((step) => step !== "summary" && !isAnswered(step, s));
  return missing ? { step: missing, stopEditing: false } : { step: "summary", stopEditing: true };
}

/** Minutes left from the start of a chapter (1–7), as "About 5–8 min left". */
export function minutesLeft(fromChapter: number) {
  let lo = 0;
  let hi = 0;
  CHAPTERS.slice(fromChapter - 1).forEach((c) => {
    const [a, b] = c.time.replace(" min", "").split("-").map(Number);
    lo += a;
    hi += b ?? a;
  });
  return lo === hi ? `About ${lo} min left` : `About ${lo}–${hi} min left`;
}

// ---------- saving (R15) ----------
// Free text word for word; picks with their exact option labels; one value per Notion column.

export type CifColumns = Record<string, string | number | string[] | null>;

export function toColumns(s: CifState): CifColumns {
  const a = s.answers;
  const out: CifColumns = {};
  const focus = focusList(s);
  const score = (id: LifeAreaId) => scoreOf(s.lifeAreas, id);

  out["Name"] = a.name.trim();
  out["Email"] = a.email.trim();
  out["Form version"] = "v0.1";
  out["Intake Processing Status"] = "New submission";
  out["My Preferred Pronoun"] = filled(a.pronounOwn) ? [a.pronounOwn.trim()] : a.pronoun ? [a.pronoun] : [];
  out["My preferred mode of communication"] = a.contact;
  out["Age range"] = a.age;
  AREAS.forEach((area) => (out["Wheel - " + area.notion] = score(area.id)));
  out["Life areas that feel most alive right now"] = topAlive(s.lifeAreas).map((id) => AREA[id].notion);
  out["Focus areas"] = focus.map((id) => AREA[id].notion);
  // "Area (score): goal; goal; own words"
  out["Goals by area"] = focus
    .map((id) => {
      const g = a.goals[id];
      const head = `${AREA[id].notion} (${score(id)})`;
      if (g?.explore) return `${head}: Explore together`;
      return `${head}: ${withOwn(g?.picks ?? [], g?.own ?? "").join("; ")}`;
    })
    .join("\n");
  out["Explore together areas"] = focus.filter((id) => a.goals[id]?.explore).map((id) => AREA[id].notion);
  out["My primary objectives in doing this program are..."] = a.objectives.trim();
  out["I would like special attention to be given to the following areas"] = a.special;
  out["Currently in a life transition?"] = a.transition;
  out["Transition detail"] = listJoin(withOwn(a.transDetail, a.transOwn));
  out["Obstacles"] = listJoin(withOwn(a.obstacles, a.obstaclesOwn));
  out["What gets in my way when I try to make changes or move forward"] = [
    listJoin(withOwn(a.obstacles, a.obstaclesOwn)),
    filled(a.obstacleStory) ? `When “${firstObstacle(a)}” shows up: ${a.obstacleStory.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  out["What keeps me going"] = listJoin(withOwn(a.motivation, a.motivationOwn));
  out["My experience with a coach before this?"] = a.coached;
  if (coachedYes(a)) {
    out["What worked"] = listJoin(withOwn(a.worked, a.workedOwn));
    out["What didn't work"] = listJoin(withOwn(a.didnt, a.didntOwn));
    out["If yes to above what worked and what did not?"] =
      `Worked: ${out["What worked"] || "-"}\nDidn't work: ${out["What didn't work"] || "-"}`;
  }
  out["Challenge level"] = a.challenge;
  out["Some of my hobbies have been or are..."] = listJoin(withOwn(a.hobbies, a.hobbiesOwn));
  out["People who know me well, describe me as (3 words)?"] = listJoin(a.words.map((w) => w.trim()));
  out["Background tags"] = a.bgNone ? "None of these" : listJoin(a.bgTags);
  out["Something about my background, culture or norms that will help Dinesh serve me better is…"] = a.bgMore.trim();
  out["What else I'd like Dinesh to know about me?"] = a.anythingElse.trim();
  out["One thing from my last conversation with Dinesh that continues to sit with me is.."] = a.reflection.trim();
  return out;
}
