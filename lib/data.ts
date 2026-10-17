// Sample content for one fictional client: Meera Krishnan, 38, who runs her own design studio.
// Used as the starting state when localStorage is empty. Content only — no styling.
//
// Field shapes follow the Figma screens:
// - Life areas: CIF life-wheel card (name, one-line description, 1–10 rating) + focus tick
// - Life stories: title + three keyword tags (story card) and Dinesh's three questions, in order
// - Life codes: statement, then the three questions: which life areas, micro or macro, how or when to use it
// - Outcomes: Doing (done/undone) or Being (scored /10), life area, #1–3 priority, optional goal
// - Values & qualities: strength + the quiz moments they came through (VQ results), plus a 1–10 score

// ---------- Types ----------

export type LifeAreaId =
  | "career"
  | "money"
  | "health"
  | "appearance"
  | "home"
  | "family"
  | "friends"
  | "relationship"
  | "fun"
  | "personal-development"
  | "spirituality"
  | "service";

export type LifeArea = {
  id: LifeAreaId;
  name: string;
  description: string;
  score: number | null; // CIF life wheel, 1 = not at all where I want it, 10 = exactly right; null = not rated yet
  focus: boolean; // one of the 1–3 areas picked to focus on
};

export type OutcomeType = "Doing" | "Being";

export type KeyResult = {
  id: string;
  lifeArea: LifeAreaId;
  type: OutcomeType;
  text: string;
  priority: number;
};

// The CIF answers, one field per question on the live form (begin.aatam.co).
// Picks hold the exact option labels (or the option's saved value where the form saves a
// different one); free text is kept word for word. Wheel scores and focus live on lifeAreas.
export type CifAnswers = {
  name: string;
  email: string;
  pronoun: string | null;
  pronounOwn: string;
  contact: string | null;
  age: string | null;
  goals: Partial<Record<LifeAreaId, { picks: string[]; own: string; explore: boolean }>>;
  objectives: string;
  objectivesPrefill: string;
  special: string[];
  transition: string | null;
  transDetail: string[];
  transOwn: string;
  obstacles: string[];
  obstaclesOwn: string;
  obstacleStory: string;
  motivation: string[];
  motivationOwn: string;
  coached: string | null;
  worked: string[];
  workedOwn: string;
  didnt: string[];
  didntOwn: string;
  challenge: string | null;
  hobbies: string[];
  hobbiesOwn: string;
  words: [string, string, string];
  bgTags: string[];
  bgNone: boolean;
  bgMore: string;
  anythingElse: string;
  reflection: string;
};

// Where the client is in the form, so they can leave and resume at the exact question.
export type CifProgress = {
  current: string; // step id, never shown to the client
  history: string[];
  editing: boolean; // came from the summary's Edit link
  focusChosen: boolean; // false = the three lowest scores are pre-ticked
  startedAt: string | null;
  submittedAt: string | null;
};

export type Story = {
  id: string;
  title: string;
  text?: string; // the story itself, in the client's words
  keywords: string[];
  doing: string; // "Specifically, what were you doing?"
  value: string; // "What value did you take from this? What was in it for you?"
  feeling: string; // "How did that leave you feeling?"
};

export type Cluster = {
  name: string; // becomes a power word
  words: string[];
};

export type PurposeStatus = "empty" | "draft" | "final";

export type Vision = {
  lifeArea: LifeAreaId;
  answers: {
    livedOnPurpose: string; // What would this life area be like if I consistently lived on purpose?
    doOrBe: string; // What might I do or be in this life area to move me toward my dreams?
    energizingValues: string; // What values energize me to realize my dreams?
    lifetime: string; // What could I do, be, or have within my lifetime that would enable me to live on purpose?
  };
  statement: string; // "I ..." — personal, positive, doing + being
  byPowerWord: Record<string, string>; // "Go Deeper": one line per power word; empty if not done
};

export type Strength = "Strong" | "Clear" | "Emerging";

export type Trait = {
  id: string;
  name: string;
  strength: Strength;
  moments: string[]; // quiz moments it came through in
  score: number; // 1–10
};

// A note against one outcome during its period: the moment plus the client's words, verbatim.
// Notes stay inside their period and are never scored.
export type OutcomeNote = { id: string; at: string; text: string }; // at = ISO date-time

export type Outcome = {
  id: string;
  lifeArea: LifeAreaId;
  type: OutcomeType;
  text: string;
  priority: number | null; // #1 matters most; null while the period is still being built
  goalId: string | null; // mapped key result, or standalone
  track: boolean; // "Do I want to track this outcome?"
  done: boolean; // said at the close: Done or Not done, nothing in between
  score: number | null; // Being outcomes, out of 10; null until scored
  notes: OutcomeNote[];
  ticks: string[]; // ISO dates ticked on Today (tracked Doing outcomes)
  closed: boolean; // reviewed in this period's close
};

// The period now running. "Ready to close" once its end date has passed.
export type Period = { id: string; number: number; start: string; end: string }; // ISO dates

export type PastPeriod = {
  id: string;
  label: string;
  start: string; // ISO date
  end: string;
  overall: number; // % of outcomes done
  priority: number; // % of prioritized outcomes done
  wellbeing: number; // average well-being score
  outcomes: Outcome[];
  lifeCodesEmerged: string[]; // life code ids
};

export type PastScores = {
  periodId: string;
  scores: Record<string, number>; // quality name → 1–10
};

export type LifeCodeType = "micro" | "macro";

// Where a life code was written: a fact about the write, recorded automatically.
export type LifeCodeSource = "My Outcomes" | "My Well-Being" | "Session" | "My Vision" | "Added by hand" | "Chat";

// The same shape everywhere (typed by hand, captured in the companion chat, or opened later):
// the statement, then the three questions.
export type LifeCode = {
  id: string;
  statement: string; // "What would you tell your future self? Start with 'I'." In the client's words.
  lifeAreas: LifeAreaId[]; // Question 1; all twelve when allLifeAreas is set
  allLifeAreas: boolean; // Question 1's first option, "All life areas"
  type: LifeCodeType; // Question 2: one situation (micro) or many situations (macro)
  howOrWhenToUse: string; // Question 3
  addedThrough: LifeCodeSource;
  periodId: string | null; // the period it came out of, so it shows under that period in Prior
  status: "active" | "archived"; // archive, never delete
  archivedReason?: string;
};

// ---------- Client ----------

export const sampleUser = {
  name: "Meera Krishnan",
  email: "meera.krishnan@example.com",
};

// ---------- Life areas ----------
// The 12 areas of the CIF life wheel, in wheel order, with the live form's hints.

export const lifeAreas: LifeArea[] = [
  { id: "career", name: "Career", description: "Work, vocation, how you spend your working days", score: 7, focus: false },
  { id: "money", name: "Money", description: "Income, savings, how you feel about money", score: 4, focus: true },
  { id: "health", name: "Health", description: "Energy, sleep, movement, wellbeing", score: 4, focus: true },
  { id: "appearance", name: "Appearance", description: "How you look and feel in your own skin", score: 6, focus: false },
  { id: "home", name: "Home", description: "The place you live and how it feels", score: 7, focus: false },
  { id: "family", name: "Family", description: "Parents, children, the family you're part of", score: 7, focus: false },
  { id: "friends", name: "Friends", description: "Friendships and social life", score: 5, focus: false },
  { id: "relationship", name: "Relationship", description: "Partner or romantic life", score: 6, focus: false },
  { id: "fun", name: "Fun", description: "Play, joy, recreation", score: 3, focus: true },
  { id: "personal-development", name: "Personal Development", description: "Learning, growth, becoming who you want to be", score: 6, focus: false },
  { id: "spirituality", name: "Spirituality", description: "Meaning, faith, inner life", score: 5, focus: false },
  { id: "service", name: "Service", description: "Giving back, community, volunteering", score: 5, focus: false },
];

// ---------- Life area images (Settings → Life Area Images) ----------
// Figma provides images for Career, Health, Family and Personal Development only;
// the other areas reuse those four in turn (never the same picture as the card beside them)
// until they get their own.

const figmaAreaImages: Partial<Record<LifeAreaId, string>> = {
  career: "/images/life-areas/career.png",
  health: "/images/life-areas/health.png",
  family: "/images/life-areas/family.png",
  "personal-development": "/images/life-areas/personal-development.png",
};
const reusedImages = Object.values(figmaAreaImages) as string[];

export const lifeAreaImageDefaults = (() => {
  const result = {} as Record<LifeAreaId, string>;
  let turn = 0;
  lifeAreas.forEach((area, i) => {
    const own = figmaAreaImages[area.id];
    if (own) {
      result[area.id] = own;
      return;
    }
    const previous = i > 0 ? result[lifeAreas[i - 1].id] : undefined;
    const next = lifeAreas[i + 1] && figmaAreaImages[lifeAreas[i + 1].id];
    let pick = reusedImages[turn % reusedImages.length];
    for (let tries = 0; (pick === previous || pick === next) && tries < reusedImages.length; tries++) {
      turn++;
      pick = reusedImages[turn % reusedImages.length];
    }
    result[area.id] = pick;
    turn++;
  });
  return result;
})();

// ---------- Goals (Key Results) ----------

export const keyResults: KeyResult[] = [
  { id: "kr-1", lifeArea: "health", type: "Doing", text: "Run a 10K in under 65 minutes by March 2027", priority: 1 },
  { id: "kr-2", lifeArea: "money", type: "Doing", text: "Pay myself a fixed salary for six months in a row", priority: 2 },
  { id: "kr-3", lifeArea: "money", type: "Being", text: "Stay calm, not panicked, when a client pays late", priority: 3 },
  { id: "kr-4", lifeArea: "fun", type: "Doing", text: "Take one full weekend a month with no studio work", priority: 4 },
  { id: "kr-5", lifeArea: "career", type: "Doing", text: "Have two leads who can run a client project end to end by June 2027", priority: 5 },
];

// ---------- CIF ----------
// Meera's submitted CIF. Options are the live form's exact labels.

export const cifAnswers: CifAnswers = {
  name: "Meera Krishnan",
  email: "meera.krishnan@example.com",
  pronoun: "She/Her",
  pronounOwn: "",
  contact: "Text",
  age: "30s",
  goals: {
    fun: {
      picks: ["Make time for joy", "Rediscover old hobbies"],
      own: "I honestly can't remember the last time I painted something that wasn't for a client. I want one thing in my week that has no deadline attached to it.",
      explore: false,
    },
    money: {
      picks: ["Get clear on my financial goals", "Feel calmer about money"],
      own: "The studio makes decent money, but I pay everyone else first and myself whatever is left. Some months that is nothing. I want a real salary and to stop checking the bank app at midnight.",
      explore: false,
    },
    health: {
      picks: ["Have more energy", "Move my body more", "Sleep better"],
      own: "I used to run before the studio. Now my back hurts by Thursday and I live on filter coffee until lunch. I want my energy back, not a six-pack.",
      explore: false,
    },
  },
  objectives:
    "To stop being the bottleneck in my own studio, pay myself properly, and get back the version of me who had energy left over at the end of the day for Tara and Arjun.",
  objectivesPrefill: "",
  special: ["Balance", "Self-confidence", "Fun"],
  transition: "Yes - I know what it is",
  transDetail: ["Career or work change", "A shift in identity or purpose"],
  transOwn: "",
  obstacles: ["Not enough time", "Overthinking", "Self-doubt"],
  obstaclesOwn: "",
  obstacleStory:
    "I say yes to one more client, then I'm working until midnight and skipping my run. By Thursday I'm too tired to think clearly, and I start doubting every decision.",
  motivation: ["Seeing real progress", "Being accountable to someone"],
  motivationOwn: "",
  coached: "Yes - informally",
  worked: ["A fresh perspective", "Feeling heard"],
  workedOwn: "",
  didnt: ["Too much talk, not enough action"],
  didntOwn: "",
  challenge: "Gradual challenges",
  hobbies: ["Arts and crafts", "Cooking", "Outdoors and nature"],
  hobbiesOwn: "Watercolours",
  words: ["Warm", "Stubborn", "Curious"],
  bgTags: ["Family expectations"],
  bgNone: false,
  bgMore:
    "My mother lives with us now. In our family the eldest daughter is expected to hold everything together, and I still feel that pull.",
  anythingElse:
    "I'm better at looking after other people than myself. Please notice if I start doing that again.",
  reflection:
    "After our call I said no to a project I would normally have taken just for the money. It felt strange and good. I want more of that.",
};

export const cifProgress: CifProgress = {
  current: "summary",
  history: [],
  editing: false,
  focusChosen: true,
  startedAt: "2026-06-28T18:20:00.000Z",
  submittedAt: "2026-06-28T18:34:00.000Z",
};

// ---------- Life Purpose ----------

export const powerWords = ["Curious", "Craft", "Belonging", "Brave"];

export const clusters: Cluster[] = [
  { name: "Curious", words: ["Asks great questions", "Learns from mistakes", "Playful", "Adaptable"] },
  { name: "Craft", words: ["Creative", "Disciplined", "Gets things done", "Thoughtful"] },
  { name: "Belonging", words: ["Makes people feel welcome", "Sees the good in people", "Empathy", "Loyal"] },
  { name: "Brave", words: ["Takes initiative", "Determined", "Stays calm under pressure", "Honest"] },
];

export const purposeDrafts = [
  {
    date: "2026-09-02",
    text: "My purpose in life is to make beautiful things by working hard so that people notice good design.",
  },
  {
    date: "2026-09-16",
    text: "My purpose in life is to stay curious by building a studio where people feel they belong, to make work that matters.",
  },
];

// Where Meera feels her purpose in her body (the "barometer" from the stories session).
export const purposeBodyFeel = "chest";

export const lifePurposeStatement =
  "My purpose in life is to stay curious and make things with care, by building rooms where people feel they belong and are brave enough to try, so that the work and everyone in it comes out more alive.";

export const stories: Story[] = [
  {
    id: "story-1",
    title: "Painting the sign for my uncle's shop",
    keywords: ["Creative", "Takes initiative", "Playful"],
    doing:
      "I was fourteen. My uncle's provision store in Mysuru had a faded board, so I asked if I could repaint it. I spent two weekends on a ladder with enamel paint and a brush that was far too big.",
    value:
      "People stopped and looked at something I had made. My uncle told everyone his niece did it. I realised that making something beautiful could change how a whole street felt.",
    feeling: "Proud in a quiet way. Like I had found the thing my hands were for.",
  },
  {
    id: "story-2",
    title: "The first pitch the studio won",
    keywords: ["Brave", "Determined", "Asks great questions"],
    doing:
      "It was just me and Kavya, three months after I quit my job. We pitched a rebrand for a chain of bakeries against two big agencies. Instead of a deck, we spent the whole meeting asking the owner about her mother, who started the first shop.",
    value:
      "That listening was the work. We won because we cared about her story more than our portfolio. It proved to me that the way I like to work actually works.",
    feeling: "Like I could breathe properly for the first time in months. Lighter, and a little bit unstoppable.",
  },
  {
    id: "story-3",
    title: "Teaching Tara to ride a bicycle",
    keywords: ["Sees the good in people", "Stays calm", "Empathy"],
    doing:
      "Tara was six and terrified. We went to the park every evening for a week. On the fifth day I let go of the seat without telling her and she rode all the way to the gate.",
    value:
      "She did it herself. My job was only to stay close and believe she could. I think that is what I want to be for everyone I care about.",
    feeling: "Full. I cried a bit, and she was too busy shouting to notice.",
  },
  {
    id: "story-4",
    title: "The rebrand for the weavers' cooperative",
    keywords: ["Makes people feel welcome", "Thoughtful", "Honest"],
    doing:
      "We worked with forty women weavers from a cooperative near Chanderi. I sat with them for three days while they worked, and we designed the new labels together, using their own words and their own handwriting.",
    value:
      "The work belonged to them, not to me. When they held the finished labels, they recognised themselves. That is the best thing design can do.",
    feeling: "Humbled, and deeply happy. It felt like the reason I started the studio.",
  },
  {
    id: "story-5",
    title: "Walking out of the agency job",
    keywords: ["Brave", "Honest", "Takes initiative"],
    doing:
      "I had been at the same agency for nine years. One Monday I handed in my notice with no clients and four months of savings. I told my creative director exactly why I was leaving, kindly but without softening it.",
    value:
      "I chose myself. I learned that I can survive not knowing what comes next, and that telling the truth does not have to burn bridges.",
    feeling: "Terrified and completely free at the same time. My hands were shaking on the auto ride home, and I was grinning.",
  },
  {
    id: "story-6",
    title: "Ammamma's recipe book",
    keywords: ["Loyal", "Creative", "Disciplined"],
    doing:
      "After my grandmother passed, I collected her handwritten recipes from my mother and three aunts. I spent a year of Sunday mornings cooking each one, photographing it, and designing a book we printed for the whole family.",
    value:
      "It kept her with us. It also brought my aunts back into the same room, arguing about how much tamarind she really used.",
    feeling: "Connected. Like the family had a centre again, and I helped put it there.",
  },
  {
    id: "story-7",
    title: "The intern who found her voice",
    keywords: ["Sees the good in people", "Asks great questions", "Learns from mistakes"],
    doing:
      "Farah barely spoke in her first month. Instead of giving her more instructions, I asked her to present her own idea to a client, and I sat beside her and said nothing unless she looked at me.",
    value:
      "Watching someone discover they are capable is better than any award. I learned that stepping back can be the most generous thing I do.",
    feeling: "Warm, and a little emotional. She runs her own projects now and still sends me her work first.",
  },
  {
    id: "story-8",
    title: "Running my first 10K",
    keywords: ["Determined", "Disciplined", "Adaptable"],
    doing:
      "I trained for four months before the studio existed, running at six in the morning around Cubbon Park. On race day it rained the whole way and I finished in seventy-one minutes.",
    value:
      "I kept a promise to myself when no one was watching. My body was stronger than my excuses.",
    feeling: "Alive. Soaked, sore, and completely clear in my head for the rest of the day.",
  },
];

// ---------- Visions (one per life area) ----------

export const visions: Vision[] = [
  {
    lifeArea: "career",
    answers: {
      livedOnPurpose:
        "The studio runs on trust, not on me checking every file. People do their bravest work here and stay for years because they keep growing.",
      doOrBe:
        "Spend my mornings on the work only I can do, and my afternoons coaching the team. Be the person who asks the question, not the one who always has the answer.",
      energizingValues: "Craft, guiding others' growth, and honesty.",
      lifetime:
        "Build a studio that would carry on beautifully without me, and teach design to young women from small towns who never thought it was a career.",
    },
    statement:
      "I lead a studio where people feel safe enough to try something new, and I make work I am proud to put my name on.",
    byPowerWord: {
      Curious: "I begin every project by asking questions, and I let the answers surprise me.",
      Craft: "I care about the last ten percent, and I give my team the time to care about it too.",
      Belonging: "Every person in the studio knows their ideas are wanted, including the newest intern.",
      Brave: "I say no to work that doesn't fit us, and I say yes to the projects that scare me a little.",
    },
  },
  {
    lifeArea: "health",
    answers: {
      livedOnPurpose:
        "I have energy at the end of the day, not just at the start. My body feels like a friend again, not something I apologise to on Thursdays.",
      doOrBe: "Run three mornings a week, sleep before midnight, and eat lunch away from my desk.",
      energizingValues: "Discipline, and the freedom that comes from feeling strong.",
      lifetime: "Still be running at sixty, and walk the Kumara Parvatha trail with Tara when she is grown.",
    },
    statement:
      "I run in the mornings three times a week, not because I have to but because I know who I am when I do.",
    byPowerWord: {
      Curious: "I try new routes and notice how my body feels instead of only checking my pace.",
      Craft: "I treat rest and sleep as part of the work, as carefully as I would a client brief.",
      Belonging: "I run with friends on Sundays, and it is the best conversation of my week.",
      Brave: "I sign up for the race before I feel ready, and then I show up for it.",
    },
  },
  {
    lifeArea: "family",
    answers: {
      livedOnPurpose:
        "When I'm home I'm actually home. Tara tells me about her day because she knows I'm listening, and Amma feels like part of the house, not a guest in it.",
      doOrBe: "Close the laptop at seven. Cook together on Sundays. Be patient, especially when I'm tired.",
      energizingValues: "Family, loyalty, and warmth.",
      lifetime: "Raise a daughter who knows she is loved exactly as she is, and who is brave enough to choose her own path.",
    },
    statement: "I am fully present with my family, and our home is a place where everyone feels they belong.",
    byPowerWord: {},
  },
  {
    lifeArea: "relationship",
    answers: {
      livedOnPurpose:
        "Arjun and I are still curious about each other. We talk about more than logistics and school fees.",
      doOrBe: "One evening a week that is just ours. Tell him what I need instead of expecting him to guess.",
      energizingValues: "Honesty, and the playfulness we had when we met.",
      lifetime: "Grow old with my best friend and still make each other laugh.",
    },
    statement: "I make time for Arjun every week, and I tell him the truth even when it is uncomfortable.",
    byPowerWord: {},
  },
  {
    lifeArea: "personal-development",
    answers: {
      livedOnPurpose:
        "I trust myself as a leader. I can sit with not knowing, and I don't need to be the best designer in the room to feel worthy.",
      doOrBe: "Pause before I say yes. Ask for help early. Write in my journal three times a week.",
      energizingValues: "Courage, curiosity, and learning from my mistakes.",
      lifetime: "Become someone who makes other people braver just by being around them.",
    },
    statement: "I lead with curiosity instead of control, and I learn something about myself every week.",
    byPowerWord: {},
  },
];

// ---------- Values & Qualities ----------

export const values: Trait[] = [
  { id: "v-craft", name: "Craft", strength: "Strong", moments: ["The squeeze", "After the busy stretch"], score: 9 },
  { id: "v-growth", name: "Guiding Others' Growth", strength: "Strong", moments: ["The group needs someone", "The new hire's question"], score: 9 },
  { id: "v-family", name: "Family", strength: "Strong", moments: ["The 80th birthday", "The open Saturday"], score: 8 },
  { id: "v-honesty", name: "Honesty", strength: "Strong", moments: ["The coworker's slip", "The promise and the better offer"], score: 8 },
  { id: "v-curiosity", name: "Curiosity", strength: "Clear", moments: ["The open Saturday", "The client who wants it cheaper"], score: 7 },
  { id: "v-independence", name: "Independence", strength: "Clear", moments: ["The promise and the better offer"], score: 7 },
  { id: "v-beauty", name: "Beauty", strength: "Clear", moments: ["The friend's first exhibition"], score: 6 },
  { id: "v-generosity", name: "Generosity", strength: "Emerging", moments: ["The good moment"], score: 5 },
  { id: "v-fairness", name: "Fairness", strength: "Emerging", moments: ["The coworker's slip"], score: 5 },
  { id: "v-learning", name: "Learning", strength: "Emerging", moments: ["After the busy stretch"], score: 4 },
];

export const qualities: Trait[] = [
  { id: "q-calm", name: "Calm", strength: "Clear", moments: ["The oven dies", "After the busy stretch"], score: 7 },
  { id: "q-courageous", name: "Courageous", strength: "Strong", moments: ["The promise and the better offer", "The group needs someone"], score: 8 },
  { id: "q-grounded", name: "Grounded", strength: "Clear", moments: ["The 80th birthday"], score: 6 },
  { id: "q-confident", name: "Confident", strength: "Emerging", moments: ["The client who wants it cheaper"], score: 5 },
  { id: "q-self-aware", name: "Self-aware", strength: "Strong", moments: ["The coworker's slip", "The squeeze"], score: 8 },
  { id: "q-resilient", name: "Emotionally Resilient", strength: "Clear", moments: ["The oven dies"], score: 7 },
  { id: "q-purposeful", name: "Purposeful", strength: "Clear", moments: ["The open Saturday"], score: 7 },
  { id: "q-positive", name: "Positive", strength: "Emerging", moments: ["The good moment"], score: 6 },
  { id: "q-flexible", name: "Flexible", strength: "Emerging", moments: ["The late night fix"], score: 5 },
  { id: "q-centered", name: "Centered", strength: "Emerging", moments: ["After the busy stretch"], score: 4 },
];

export const finalValueIds = ["v-craft", "v-growth", "v-family"];
export const finalQualityIds = ["q-calm", "q-courageous", "q-grounded", "q-confident"];

// ---------- Life Codes ----------

export const lifeCodes: LifeCode[] = [
  {
    id: "lc-1",
    statement: "Run before I open my inbox",
    lifeAreas: ["health"],
    allLifeAreas: false,
    type: "micro",
    howOrWhenToUse: "Monday, Wednesday and Friday mornings.",
    addedThrough: "My Outcomes",
    periodId: "p-5",
    status: "active",
  },
  {
    id: "lc-2",
    statement: "Close the laptop at seven and be home when I'm home",
    lifeAreas: ["family"],
    allLifeAreas: false,
    type: "macro",
    howOrWhenToUse: "Every weekday evening.",
    addedThrough: "My Vision",
    periodId: "p-4",
    status: "active",
  },
  {
    id: "lc-3",
    statement: "Ask one question before I give an answer",
    lifeAreas: ["career"],
    allLifeAreas: false,
    type: "micro",
    howOrWhenToUse: "In every design review and whenever someone brings me a problem.",
    addedThrough: "My Outcomes",
    periodId: "p-5",
    status: "active",
  },
  {
    id: "lc-4",
    statement: "Pay myself first, on the first of every month",
    lifeAreas: ["money"],
    allLifeAreas: false,
    type: "macro",
    howOrWhenToUse: "On the first of every month, no matter how the month looks.",
    addedThrough: "My Vision",
    periodId: "p-6",
    status: "active",
  },
  {
    id: "lc-5",
    statement: "Say the hard thing kindly, and say it early",
    lifeAreas: ["career"],
    allLifeAreas: false,
    type: "macro",
    howOrWhenToUse: "As soon as I notice I'm avoiding a conversation with a client or someone on the team.",
    addedThrough: "My Outcomes",
    periodId: "p-6",
    status: "active",
  },
  {
    id: "lc-6",
    statement: "Put the phone in the drawer when Tara is talking",
    lifeAreas: ["family"],
    allLifeAreas: false,
    type: "micro",
    howOrWhenToUse: "At bedtime, and whenever she starts with 'Amma, guess what'.",
    addedThrough: "My Outcomes",
    periodId: "p-5",
    status: "active",
  },
  {
    id: "lc-7",
    statement: "One afternoon a month that has no purpose at all",
    lifeAreas: ["fun"],
    allLifeAreas: false,
    type: "macro",
    howOrWhenToUse: "The last Saturday afternoon of every month.",
    addedThrough: "My Vision",
    periodId: "p-4",
    status: "active",
  },
  {
    id: "lc-8",
    statement: "Pause for one breath before I say yes",
    lifeAreas: ["personal-development"],
    allLifeAreas: false,
    type: "micro",
    howOrWhenToUse: "Every time someone asks me to take something on.",
    addedThrough: "My Outcomes",
    periodId: null,
    status: "archived",
  },
];

// ---------- Outcomes ----------

export const currentPeriod: Period = { id: "p-7", number: 7, start: "2026-10-07", end: "2026-10-21" };

export const currentOutcomes: Outcome[] = [
  { id: "o-1", lifeArea: "health", type: "Doing", text: "Run three mornings a week before opening my inbox", priority: 1, goalId: "kr-1", track: true, done: true, score: null, notes: [{ id: "n-1", at: "2026-10-12T07:40:00", text: "Running felt easier after laying the clothes out the night before." }], ticks: ["2026-10-08", "2026-10-10", "2026-10-13", "2026-10-15"], closed: false },
  { id: "o-2", lifeArea: "money", type: "Doing", text: "Move my salary into my own account on the first", priority: 2, goalId: "kr-2", track: false, done: true, score: null, notes: [], ticks: [], closed: false },
  { id: "o-3", lifeArea: "career", type: "Doing", text: "Hand the bakery review to Kavya and stay out of it", priority: 3, goalId: "kr-5", track: false, done: false, score: null, notes: [], ticks: [], closed: false },
  { id: "o-4", lifeArea: "family", type: "Being", text: "Be fully present at dinner, phone in the drawer", priority: null, goalId: null, track: true, done: false, score: 7, notes: [], ticks: [], closed: false },
  { id: "o-5", lifeArea: "fun", type: "Being", text: "Feel unhurried on my Sunday sketch walk", priority: null, goalId: "kr-4", track: false, done: false, score: null, notes: [], ticks: [], closed: false },
  { id: "o-6", lifeArea: "fun", type: "Doing", text: "Fill four pages of my sketchbook", priority: null, goalId: null, track: true, done: false, score: null, notes: [], ticks: [], closed: false },
];

export const pastPeriods: PastPeriod[] = [
  {
    id: "p-6",
    label: "Period 6",
    start: "2026-09-21",
    end: "2026-10-06",
    overall: 67,
    priority: 100,
    wellbeing: 6.8,
    outcomes: [
      { id: "p6-o1", lifeArea: "money", type: "Doing", text: "Set up the standing instruction for my salary", priority: 1, goalId: "kr-2", track: false, done: true, score: null, notes: [], ticks: [], closed: false },
      { id: "p6-o2", lifeArea: "career", type: "Doing", text: "Write job descriptions for two team leads", priority: 2, goalId: "kr-5", track: false, done: true, score: null, notes: [], ticks: [], closed: false },
      { id: "p6-o3", lifeArea: "health", type: "Doing", text: "Be in bed before midnight five nights a week", priority: null, goalId: null, track: false, done: false, score: null, notes: [], ticks: [], closed: false },
    ],
    lifeCodesEmerged: ["lc-4", "lc-5"],
  },
  {
    id: "p-5",
    label: "Period 5",
    start: "2026-08-24",
    end: "2026-09-20",
    overall: 67,
    priority: 67,
    wellbeing: 8.0,
    outcomes: [
      { id: "p5-o1", lifeArea: "health", type: "Doing", text: "Run twice a week, even if it is only twenty minutes", priority: 1, goalId: "kr-1", track: false, done: true, score: null, notes: [], ticks: [], closed: false },
      { id: "p5-o2", lifeArea: "family", type: "Being", text: "Be patient with Amma when she rearranges my kitchen", priority: 2, goalId: null, track: false, done: false, score: 6, notes: [], ticks: [], closed: false },
      { id: "p5-o3", lifeArea: "career", type: "Doing", text: "Ask the team for their ideas before sharing mine", priority: 3, goalId: null, track: false, done: true, score: null, notes: [], ticks: [], closed: false },
    ],
    lifeCodesEmerged: ["lc-1", "lc-3", "lc-6"],
  },
  {
    id: "p-4",
    label: "Period 4",
    start: "2026-08-01",
    end: "2026-08-23",
    overall: 50,
    priority: 50,
    wellbeing: 5.5,
    outcomes: [
      { id: "p4-o1", lifeArea: "family", type: "Doing", text: "Close the laptop at seven on weekdays", priority: 1, goalId: null, track: false, done: false, score: null, notes: [], ticks: [], closed: false },
      { id: "p4-o2", lifeArea: "fun", type: "Doing", text: "Spend one Saturday afternoon painting", priority: 2, goalId: "kr-4", track: false, done: true, score: null, notes: [], ticks: [], closed: false },
    ],
    lifeCodesEmerged: ["lc-2", "lc-7"],
  },
];

// ---------- Well-being ----------
// Scored each period on the final qualities, 1–10. null = not scored yet.

export const wellbeingScores: Record<string, number | null> = {
  Calm: 6,
  Courageous: 7,
  Grounded: 5,
  Confident: null,
};

export const pastWellbeingScores: PastScores[] = [
  { periodId: "p-6", scores: { Calm: 6, Courageous: 8, Grounded: 6, Confident: 7 } },
  { periodId: "p-5", scores: { Calm: 8, Courageous: 9, Grounded: 8, Confident: 7 } },
  { periodId: "p-4", scores: { Calm: 5, Courageous: 6, Grounded: 5, Confident: 6 } },
];
