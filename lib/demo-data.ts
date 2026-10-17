// The two fixed demo accounts on the login screen (lib/store.ts loadDemoAccount).
//
//   demo@aatam.co — Rohan Iyer, a finished client: every module complete, a period running, three
//                   closed periods behind it. Edit his content here; it is read aloud in demos, so
//                   it is written as a real person's words, not placeholder text.
//   new@aatam.co  — a brand-new client with nothing done (built in lib/store.ts from the empty state).
//
// Kept apart from lib/data.ts (Meera's sample data) so either can change without touching the other.

import type { CifAnswers, LifeAreaId, LifeCode, Outcome, PastPeriod, PastScores, Period, Story, Trait, Vision } from "./data";

export const DEMO_FULL_EMAIL = "demo@aatam.co";
export const DEMO_NEW_EMAIL = "new@aatam.co";

/** new@aatam.co: only a name. Everything else starts empty. */
export const demoNewAccount = { user: { name: "Ishaan Verma", email: DEMO_NEW_EMAIL } };

const o = (
  id: string,
  lifeArea: LifeAreaId,
  type: Outcome["type"],
  text: string,
  priority: number,
  done: boolean,
  extra: Partial<Outcome> = {},
): Outcome => ({ id, lifeArea, type, text, priority, goalId: null, track: false, done, score: null, notes: [], ticks: [], closed: true, ...extra });

export const demoFullAccount = {
  user: { name: "Rohan Iyer", email: DEMO_FULL_EMAIL },

  cif: {
    // Wheel scores, 1–10; focus = the three areas Rohan chose to work on.
    wheel: {
      career: 5,
      money: 7,
      health: 4,
      appearance: 6,
      home: 7,
      family: 8,
      friends: 5,
      relationship: 4,
      fun: 5,
      "personal-development": 6,
      spirituality: 5,
      service: 8,
    } as Record<LifeAreaId, number>,
    focus: ["career", "health", "relationship"] as LifeAreaId[],
    answers: {
      name: "Rohan Iyer",
      email: DEMO_FULL_EMAIL,
      pronoun: "He/Him",
      pronounOwn: "",
      contact: "Email",
      age: "40s",
      goals: {
        career: {
          picks: ["Lead with more confidence", "Set better boundaries between work and life"],
          own: "I moved from teaching maths to training teachers two years ago. I love the work, but I still behave like I'm the only one who can fix every school's problem, and my calendar shows it.",
          explore: false,
        },
        health: {
          picks: ["Have more energy", "Sleep better", "Manage stress"],
          own: "I'm asleep on the sofa by nine and awake at three, thinking about workshop slides. I used to play badminton every week and now I get breathless on the stairs at the metro station.",
          explore: false,
        },
        relationship: {
          picks: ["Deepen my connection with my partner", "Communicate and resolve conflict better"],
          own: "Priya and I are good parents and a good team, but we've become very efficient flatmates. Most of our conversations are about Kabir's school and who is picking up groceries.",
          explore: false,
        },
      },
      objectives:
        "To do the work I care about without it eating every evening, to get my body back to where badminton is fun again, and to have real conversations with Priya that aren't a to-do list.",
      objectivesPrefill: "",
      special: ["Balance", "Time management", "Prioritizing"],
      transition: "Yes - I know what it is",
      transDetail: ["Career or work change", "A shift in identity or purpose"],
      transOwn: "",
      obstacles: ["Not enough time", "Other people's expectations", "I start strong, then lose steam"],
      obstaclesOwn: "",
      obstacleStory:
        "Every new term I make a plan: badminton on Saturdays, no laptop after dinner. By the third week a principal calls with a crisis, I say yes, and the plan quietly disappears.",
      motivation: ["A sense of purpose or meaning", "Being accountable to someone"],
      motivationOwn: "",
      coached: "Yes - formal coaching",
      worked: ["Accountability", "Structure"],
      workedOwn: "",
      didnt: ["Too rigid"],
      didntOwn: "",
      challenge: "Push me to grow",
      hobbies: ["Sport or fitness", "Reading", "Music"],
      hobbiesOwn: "Badminton, and old Hindi film songs on the harmonium",
      words: ["Patient", "Dependable", "Overcommitted"],
      bgTags: ["Family expectations"],
      bgNone: false,
      bgMore:
        "My father was a school headmaster in Coimbatore. Being useful to others was the highest compliment in our house, and I think I still measure myself that way.",
      anythingElse: "I take notes on everything. If I start turning our sessions into a lesson plan, please stop me.",
      reflection:
        "This week I told a principal I could visit next Thursday instead of tomorrow. Nothing fell apart. I went to badminton instead.",
    } satisfies CifAnswers,
    keyResults: [
      { id: "kr-r1", lifeArea: "career" as LifeAreaId, type: "Doing" as const, text: "Train four lead teachers who can run the workshops without me by June 2027", priority: 1 },
      { id: "kr-r2", lifeArea: "career" as LifeAreaId, type: "Doing" as const, text: "Keep two evenings a week completely free of work calls", priority: 2 },
      { id: "kr-r3", lifeArea: "health" as LifeAreaId, type: "Doing" as const, text: "Play badminton twice a week and sleep seven hours most nights", priority: 3 },
      { id: "kr-r4", lifeArea: "relationship" as LifeAreaId, type: "Being" as const, text: "Feel close to Priya, not just organised with her", priority: 4 },
    ],
    startedAt: "2026-06-10T19:05:00.000Z",
    submittedAt: "2026-06-10T19:31:00.000Z",
  },

  lifePurpose: {
    stories: [
      {
        id: "r-story-1",
        title: "The boy who hated fractions",
        keywords: ["Patient", "Sees potential", "Explains simply"],
        doing:
          "In my second year of teaching there was a boy in Class 7, Manoj, who would put his head on the desk whenever we did fractions. I stayed back after school for three weeks and we cut chapatis into pieces until it made sense.",
        value: "He wasn't bad at maths, he'd just been made to feel stupid. Once he stopped being afraid, he was quick. Fear was the real problem, not fractions.",
        feeling: "Like I'd done the one thing I became a teacher for.",
      },
      {
        id: "r-story-2",
        title: "Fixing the school's timetable",
        keywords: ["Builds systems", "Calm under pressure", "Takes initiative"],
        doing:
          "Two days before term started, our timetable collapsed because three teachers left. I sat in the staff room with chart paper and sticky notes for a whole night and rebuilt it so no class lost a subject.",
        value: "I'm good at seeing how the pieces fit, and I enjoy it when everyone else is panicking. It showed me I can hold a mess steady.",
        feeling: "Tired and very satisfied. I slept for eleven hours afterwards.",
      },
      {
        id: "r-story-3",
        title: "Teaching Kabir to swim",
        keywords: ["Patient", "Playful", "Present"],
        doing:
          "Kabir was five and wouldn't let go of the side of the pool. Every Sunday I got in with him and we made up games, counting fish that weren't there. One morning he just let go and swam to me.",
        value: "I didn't push him, I made it fun and stayed close. That's how I want to be with the people I love.",
        feeling: "Completely happy. Priya filmed it and I still watch it.",
      },
      {
        id: "r-story-4",
        title: "The first teacher workshop in Madurai",
        keywords: ["Explains simply", "Sees potential", "Brings people together"],
        doing:
          "Forty government school teachers, most of them older than me and sceptical. I threw away my slides and asked them to teach me one lesson each that had worked in their classroom. By lunch they were teaching each other.",
        value: "The knowledge was already in the room. My job was to make space for it. That changed how I think about training.",
        feeling: "Energised. I talked about it for the whole bus ride home.",
      },
      {
        id: "r-story-5",
        title: "Saying sorry to my father",
        keywords: ["Honest", "Brave", "Present"],
        doing:
          "We hadn't spoken properly for a year after I left school teaching for the nonprofit. He thought I'd given up on real work. I went to Coimbatore, sat with him on the verandah and told him why it mattered to me.",
        value: "He didn't fully agree, but he listened, and so did I. Being honest was harder and better than staying polite.",
        feeling: "Lighter. Like something heavy had been put down.",
      },
      {
        id: "r-story-6",
        title: "The badminton league at the colony",
        keywords: ["Brings people together", "Playful", "Builds systems"],
        doing:
          "During the lockdown summer I set up a doubles league for our housing colony, with fixtures on the notice board and a trophy made from a steel tumbler. Thirty-two people played, aged nine to sixty-eight.",
        value: "People who had lived next to each other for years finally met. Small structures can create a lot of joy.",
        feeling: "Proud and silly at the same time. The tumbler is still on our shelf.",
      },
    ] satisfies Story[],
    clusters: [
      { name: "Patient", words: ["Patient", "Present", "Calm under pressure"] },
      { name: "Clear", words: ["Explains simply", "Builds systems", "Honest"] },
      { name: "Believing", words: ["Sees potential", "Takes initiative", "Brave"] },
      { name: "Together", words: ["Brings people together", "Playful"] },
    ],
    powerWords: ["Patient", "Clear", "Believing", "Together"],
    statement:
      "My purpose in life is to help people believe they can learn, by being patient and clear, and bringing them together, so that fear gives way to confidence in every room I'm in.",
    drafts: [
      { date: "2026-07-20", text: "My purpose in life is to teach well by working hard so that children learn maths." },
      {
        date: "2026-08-03",
        text: "My purpose in life is to be patient and clear by helping teachers believe in themselves, so that classrooms are less afraid.",
      },
    ],
    makeItReal: [0, 1, 2],
    bodyFeel: "shoulders",
  },

  visions: [
    {
      lifeArea: "career",
      answers: {
        livedOnPurpose:
          "The teachers I train go back and train others. I'm the person who starts things, not the one who has to be in every room.",
        doOrBe: "Coach four lead teachers properly. Say 'let me come back to you' before I say yes. Leave the office by six.",
        energizingValues: "Guiding others' growth, learning, and honesty.",
        lifetime: "See a teacher I trained become a head of school and run her school the way we talked about.",
      },
      statement: "I build teachers who don't need me, and I do my best work within the hours I've given it.",
      byPowerWord: {
        Patient: "I let a new trainer struggle a little before I step in, because that's how they get stronger.",
        Clear: "I say what I can and can't do this week, kindly and without apologising for it.",
        Believing: "I give the difficult workshop to someone who doesn't think they're ready yet.",
        Together: "I design every session so the teachers learn more from each other than from me.",
      },
    },
    {
      lifeArea: "health",
      answers: {
        livedOnPurpose: "I have energy left at nine at night. My body feels like something I live in, not something I put up with.",
        doOrBe: "Play badminton on Wednesdays and Saturdays. Phone out of the bedroom. Walk to the metro instead of taking an auto.",
        energizingValues: "Physical health and fun.",
        lifetime: "Still be playing doubles at seventy, and beating Kabir at least some of the time.",
      },
      statement: "I play twice a week and sleep like it matters, because a rested teacher is a patient one.",
      byPowerWord: {
        Patient: "I build up slowly and don't punish myself for the weeks I miss.",
        Together: "I play with friends, so exercise is the best social hour of my week.",
      },
    },
    {
      lifeArea: "relationship",
      answers: {
        livedOnPurpose: "Priya and I talk about ideas and dreams, not only school runs. We still surprise each other.",
        doOrBe: "Thursday evenings are ours. Ask her a real question every day and actually listen to the answer.",
        energizingValues: "Honesty, presence, and affection.",
        lifetime: "Grow older together and still be each other's favourite person to talk to.",
      },
      statement: "I give Priya my full attention every day, and I tell her what I'm really thinking, not just what needs doing.",
      byPowerWord: {
        Clear: "I say what I need instead of hoping she'll guess.",
        Together: "We plan one thing a month that is only for the two of us.",
      },
    },
  ] satisfies Vision[],

  values: [
    { id: "rv-growth", name: "Guiding Others' Growth", strength: "Strong", moments: ["The new hire's question", "The group needs someone"], score: 9 },
    { id: "rv-learning", name: "Learning", strength: "Strong", moments: ["The open Saturday", "After the busy stretch"], score: 8 },
    { id: "rv-presence", name: "Presence", strength: "Strong", moments: ["The 80th birthday", "The good moment"], score: 8 },
    { id: "rv-honesty", name: "Honesty", strength: "Clear", moments: ["The coworker's slip"], score: 7 },
    { id: "rv-health", name: "Physical health", strength: "Clear", moments: ["After the busy stretch"], score: 6 },
    { id: "rv-balance", name: "Balance", strength: "Emerging", moments: ["The squeeze"], score: 5 },
  ] satisfies Trait[],
  finalValueIds: ["rv-growth", "rv-learning", "rv-presence", "rv-honesty"],
  qualities: [
    { id: "rq-patient", name: "Patient", strength: "Strong", moments: ["The new hire's question", "The oven dies"], score: 9 },
    { id: "rq-dependable", name: "Dependable", strength: "Strong", moments: ["The group needs someone", "The promise and the better offer"], score: 8 },
    { id: "rq-calm", name: "Calm", strength: "Clear", moments: ["The oven dies"], score: 7 },
    { id: "rq-present", name: "Present", strength: "Clear", moments: ["The 80th birthday"], score: 6 },
    { id: "rq-joyful", name: "Joyful", strength: "Emerging", moments: ["The good moment"], score: 5 },
  ] satisfies Trait[],
  finalQualityIds: ["rq-patient", "rq-dependable", "rq-calm", "rq-present"],

  lifeCodes: [
    {
      id: "rlc-1",
      statement: "I say 'let me come back to you' before I say yes",
      lifeAreas: ["career", "family", "friends"],
      allLifeAreas: false,
      type: "macro",
      howOrWhenToUse: "Whenever a principal or a friend asks me to take something on, especially on the phone.",
      addedThrough: "My Outcomes",
      periodId: "rp-1",
      status: "active",
    },
    {
      id: "rlc-2",
      statement: "I put my racket bag by the door the night before",
      lifeAreas: ["health"],
      allLifeAreas: false,
      type: "micro",
      howOrWhenToUse: "Tuesday and Friday nights, before I brush my teeth.",
      addedThrough: "My Outcomes",
      periodId: "rp-1",
      status: "active",
    },
    {
      id: "rlc-3",
      statement: "I let the teachers answer each other first",
      lifeAreas: ["career"],
      allLifeAreas: false,
      type: "micro",
      howOrWhenToUse: "In every workshop, when someone asks me a question I could answer myself.",
      addedThrough: "Session",
      periodId: "rp-2",
      status: "active",
    },
    {
      id: "rlc-4",
      statement: "I ask Priya one real question at dinner, not about logistics",
      lifeAreas: ["relationship"],
      allLifeAreas: false,
      type: "micro",
      howOrWhenToUse: "Every evening at dinner, phones face down.",
      addedThrough: "My Vision",
      periodId: "rp-2",
      status: "active",
    },
    {
      id: "rlc-5",
      statement: "I rest before I'm empty, not after",
      lifeAreas: [],
      allLifeAreas: true,
      type: "macro",
      howOrWhenToUse: "When I notice I'm snapping at Kabir or rereading the same email three times.",
      addedThrough: "My Well-Being",
      periodId: "rp-3",
      status: "active",
    },
    {
      id: "rlc-6",
      statement: "I write tomorrow's three things before I close the laptop",
      lifeAreas: ["career", "personal-development"],
      allLifeAreas: false,
      type: "micro",
      howOrWhenToUse: "At six, as the last thing I do at work.",
      addedThrough: "Added by hand",
      periodId: null,
      status: "active",
    },
    {
      id: "rlc-7",
      statement: "I keep Thursday evening for Priya",
      lifeAreas: ["relationship"],
      allLifeAreas: false,
      type: "micro",
      howOrWhenToUse: "Every Thursday from seven, and I protect it like a workshop booking.",
      addedThrough: "Chat",
      periodId: "rp-3",
      status: "active",
    },
  ] satisfies LifeCode[],

  // Period 4 is running (it started a week ago); periods 1–3 are closed.
  period: { id: "rp-4", number: 4, start: "2026-10-10", end: "2026-10-24" } satisfies Period,
  currentOutcomes: [
    o("ro-1", "career", "Doing", "Hand the Salem workshop to Divya and only observe", 1, false, { goalId: "kr-r1", closed: false }),
    o("ro-2", "health", "Doing", "Play badminton on Wednesday and Saturday", 2, false, {
      goalId: "kr-r3",
      track: true,
      closed: false,
      ticks: ["2026-10-11", "2026-10-15"],
      notes: [{ id: "rn-1", at: "2026-10-15T20:10:00", text: "Played three games and wasn't breathless on the stairs after. Small win." }],
    }),
    o("ro-3", "relationship", "Being", "Feel close to Priya on our Thursday evening", 3, false, { goalId: "kr-r4", track: true, closed: false, score: 7 }),
    o("ro-4", "career", "Doing", "Leave the office by six on four days a week", 4, false, {
      goalId: "kr-r2",
      track: true,
      closed: false,
      ticks: ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-16"],
    }),
    o("ro-5", "health", "Doing", "Phone charges in the kitchen, not by the bed", 5, false, {
      track: true,
      closed: false,
      ticks: ["2026-10-10", "2026-10-11", "2026-10-12", "2026-10-14", "2026-10-15", "2026-10-16"],
    }),
  ] satisfies Outcome[],
  pastPeriods: [
    {
      id: "rp-3",
      label: "Period 3",
      start: "2026-09-26",
      end: "2026-10-09",
      overall: 75,
      priority: 80,
      wellbeing: 7.3,
      outcomes: [
        o("r3-1", "career", "Doing", "Run the Hosur workshop with Divya co-leading", 1, true),
        o("r3-2", "relationship", "Doing", "Keep Thursday evening free three weeks in a row", 2, true),
        o("r3-3", "health", "Doing", "Play badminton twice a week", 3, false),
        o("r3-4", "health", "Being", "Feel rested when I wake up", 4, true, { score: 7 }),
      ],
      lifeCodesEmerged: ["rlc-5", "rlc-7"],
    },
    {
      id: "rp-2",
      label: "Period 2",
      start: "2026-09-12",
      end: "2026-09-25",
      overall: 50,
      priority: 60,
      wellbeing: 6.0,
      outcomes: [
        o("r2-1", "career", "Doing", "Let teachers answer questions before I do in two workshops", 1, true),
        o("r2-2", "relationship", "Being", "Feel heard by Priya when I talk about work", 2, false, { score: 5 }),
        o("r2-3", "health", "Doing", "Be in bed by eleven five nights a week", 3, true),
        o("r2-4", "career", "Doing", "Finish the facilitator handbook draft", 4, false),
      ],
      lifeCodesEmerged: ["rlc-3", "rlc-4"],
    },
    {
      id: "rp-1",
      label: "Period 1",
      start: "2026-08-29",
      end: "2026-09-11",
      overall: 33,
      priority: 50,
      wellbeing: 5.0,
      outcomes: [
        o("r1-1", "career", "Doing", "Say no to one extra school visit", 1, true),
        o("r1-2", "health", "Doing", "Play badminton once a week", 2, false),
        o("r1-3", "relationship", "Doing", "Plan a dinner out with Priya", 3, false),
      ],
      lifeCodesEmerged: ["rlc-1", "rlc-2"],
    },
  ] satisfies PastPeriod[],
  pastWellbeingScores: [
    { periodId: "rp-3", scores: { Patient: 8, Dependable: 8, Calm: 7, Present: 6 } },
    { periodId: "rp-2", scores: { Patient: 7, Dependable: 7, Calm: 5, Present: 5 } },
    { periodId: "rp-1", scores: { Patient: 6, Dependable: 6, Calm: 4, Present: 4 } },
  ] satisfies PastScores[],
};
