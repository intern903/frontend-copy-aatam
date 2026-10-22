// Scripted companion (CCA) replies for the chat screen. There is no AI behind the chat yet:
// the panel walks through the open module's lines in order, one per client message.
//
// Voice (from the CCA guardrails): short, two or three sentences, a question rather than advice.
// It never congratulates or consoles, never names a pattern, never writes the client's words.
// One line per module offers to save a life code; the chat shows confirm and decline under it,
// and a saved life code is always the client's own words (their previous message).

export type ModuleKey = "cif" | "lifePurpose" | "visions" | "values" | "qualities" | "outcomes" | "wellbeing" | "lifeCode" | "home";

export type CcaLine = { text: string; offerLifeCode?: boolean };

export const ccaScript: Record<ModuleKey, CcaLine[]> = {
  home: [
    { text: "I’m here. What’s on your mind today?" },
    { text: "Thank you for putting that into words. What feels most alive in it for you right now?" },
    { text: "When you picture this going the way you’d want, what do you notice first?" },
    {
      text: "Is there something in what you just said that you’d want to remember as a life code? If you want to keep it, I’ll save it in your words.",
      offerLifeCode: true,
    },
    { text: "What would you like to take with you from this conversation?" },
  ],
  cif: [
    { text: "You’re telling Dinesh about where you are right now. Which part of this form is asking the most of you?" },
    { text: "That makes sense to sit with. What would you want Dinesh to understand about it before you meet?" },
    { text: "If one area of your life could feel different by the end of the programme, which would it be?" },
    { text: "What would be the first sign, in an ordinary week, that it had started to change?" },
  ],
  lifePurpose: [
    { text: "You’re looking at the moments when you felt most alive. Which story came to you first?" },
    { text: "What were you doing in that moment, and who were you being?" },
    { text: "Which words from your stories keep showing up, even when the stories are very different?" },
    {
      text: "Is there a line in what you’ve said that you’d want to live by? If you want to keep it as a life code, I’ll save it exactly as you wrote it.",
      offerLifeCode: true,
    },
    { text: "Reading your statement back, where in your body do you feel it?" },
  ],
  visions: [
    { text: "You’re writing what this area of your life looks like when it’s lived on purpose. What do you see first?" },
    { text: "Who is there with you, and what are you doing together?" },
    { text: "How does your life purpose show up in that picture?" },
    {
      text: "Is there something here you’d want to hold on to day to day? If it’s a life code for you, I’ll save it in your words.",
      offerLifeCode: true,
    },
  ],
  values: [
    { text: "You’re finding the values you steer by. Which question so far was hardest to answer?" },
    { text: "What made it hard: two things you care about pulling in different directions?" },
    { text: "Think of a recent choice you’re glad you made. What were you protecting when you made it?" },
    {
      text: "Is there a principle in what you just said that you’d want to keep? If you want it as a life code, I’ll save it in your words.",
      offerLifeCode: true,
    },
  ],
  qualities: [
    { text: "These are the qualities you bring when life pushes on you. Which one feels most like you today?" },
    { text: "When did you last notice yourself living that quality?" },
    { text: "Which quality would you like to feel more of in the next few weeks?" },
    {
      text: "Is there something you’d want to remind yourself of when that moment comes? If it’s a life code, I’ll save it in your words.",
      offerLifeCode: true,
    },
  ],
  outcomes: [
    { text: "What helped you get this one done? Think about what you had going for you: time, people, something you did differently." },
    { text: "Which of those would you want to remember the next time you take on something like this?" },
    {
      text: "Is there a life code you want to add from this? If you’d like to keep what you just said, I’ll save it exactly as you wrote it.",
      offerLifeCode: true,
    },
    { text: "Is there anything more hiding in this one?" },
    { text: "What’s next on your list for today?" },
  ],
  wellbeing: [
    { text: "You’ve just scored your qualities. Which number surprised you, if any?" },
    { text: "What was happening in the last two or three weeks when you felt that quality most?" },
    { text: "What is asking for your attention here?" },
    {
      text: "Is there a life code you want to add from this? If you want to keep what you said, I’ll save it in your words.",
      offerLifeCode: true,
    },
  ],
  lifeCode: [
    { text: "These are your life codes, in your own words. Which one have you used most lately?" },
    { text: "Where did you use it, and what happened?" },
    { text: "Is there a situation coming up where one of these could help? Which one would you reach for?" },
    {
      text: "Has a new principle come out of this for you? If you want to add it as a life code, I’ll save it exactly as you wrote it.",
      offerLifeCode: true,
    },
  ],
};

/** Which module's script the companion opens with, from the screen the client is on. */
export function moduleForPath(pathname: string): ModuleKey {
  if (pathname.startsWith("/cif")) return "cif";
  if (pathname.startsWith("/life-purpose")) return "lifePurpose";
  if (pathname.startsWith("/visions")) return "visions";
  if (pathname.startsWith("/values/qualities")) return "qualities";
  if (pathname.startsWith("/values")) return "values";
  if (pathname.startsWith("/outcomes")) return "outcomes";
  if (pathname.startsWith("/wellbeing")) return "wellbeing";
  if (pathname.startsWith("/life-code")) return "lifeCode";
  return "home";
}

/** Where a life code saved from the chat is tagged as coming from. */
export const ccaSource = (key: ModuleKey) =>
  key === "outcomes" ? "Outcomes" : key === "wellbeing" ? "Well-Being" : key === "visions" ? "Vision" : "Chat";
