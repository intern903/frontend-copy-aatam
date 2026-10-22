// Every screen in the app, in flow order. Drives the internal /_index page.
// Placeholders for now: one entry per module, to be split into steps as screens are built.

export type Screen = {
  module: string;
  step: number;
  title: string;
  path: string;
  built: boolean;
};

export const INDEX_PATH = "/_index";

export const screens: Screen[] = [
  { module: "Auth", step: 1, title: "Login", path: "/login", built: true },
  { module: "Auth", step: 2, title: "Sign up", path: "/signup", built: true },
  { module: "Auth", step: 3, title: "Forgot Password + Check Mail", path: "/forgot-password", built: true },
  { module: "Auth", step: 4, title: "Reset Password", path: "/reset-password?email=meera.krishnan%40example.com", built: true },
  { module: "Home", step: 1, title: "Home", path: "/", built: true },
  { module: "CIF", step: 1, title: "Welcome", path: "/cif?step=welcome", built: true },
  { module: "CIF", step: 2, title: "About you", path: "/cif?step=name", built: true },
  { module: "CIF", step: 3, title: "Your life wheel", path: "/cif?step=rate:career", built: true },
  { module: "CIF", step: 4, title: "Focus areas", path: "/cif?step=focus", built: true },
  { module: "CIF", step: 5, title: "Your goals", path: "/cif?step=goal:fun", built: true },
  { module: "CIF", step: 6, title: "This season", path: "/cif?step=transition", built: true },
  { module: "CIF", step: 7, title: "Working together", path: "/cif?step=obstacles", built: true },
  { module: "CIF", step: 8, title: "Who you are", path: "/cif?step=hobbies", built: true },
  { module: "CIF", step: 9, title: "Since we last spoke", path: "/cif?step=reflection", built: true },
  { module: "CIF", step: 10, title: "Summary", path: "/cif?step=summary", built: true },
  { module: "CIF", step: 11, title: "Thank you", path: "/cif/thanks", built: true },
  { module: "CIF", step: 12, title: "Agreement", path: "/cif/agreement", built: true },
  // One entry per Figma frame. Draft / Final need data: use the demo buttons at the top of /_index.
  { module: "Life Purpose", step: 1, title: "Empty State — Find Power Words (needs: Clear)", path: "/life-purpose", built: true },
  { module: "Life Purpose", step: 2, title: "Life stories (no Figma frame)", path: "/life-purpose/stories", built: true },
  { module: "Life Purpose", step: 3, title: "Select Cluster 1", path: "/life-purpose/clustering?cluster=1", built: true },
  { module: "Life Purpose", step: 4, title: "Select Cluster 2", path: "/life-purpose/clustering?cluster=2", built: true },
  { module: "Life Purpose", step: 5, title: "Select Cluster Landscape (phone sideways)", path: "/life-purpose/clustering?landscape=1&cluster=2", built: true },
  { module: "Life Purpose", step: 6, title: "Name Cluster 1", path: "/life-purpose/naming?cluster=1", built: true },
  { module: "Life Purpose", step: 7, title: "Name Cluster 2 (last cluster)", path: "/life-purpose/naming?cluster=4", built: true },
  { module: "Life Purpose", step: 8, title: "Power Words", path: "/life-purpose/power-words", built: true },
  { module: "Life Purpose", step: 9, title: "First Draft (writing)", path: "/life-purpose/write", built: true },
  { module: "Life Purpose", step: 10, title: "Draft (needs: draft)", path: "/life-purpose", built: true },
  { module: "Life Purpose", step: 11, title: "FAQs pop-up", path: "/life-purpose?popup=faq", built: true },
  { module: "Life Purpose", step: 12, title: "Edit Draft pop-up (needs: draft)", path: "/life-purpose?popup=edit", built: true },
  { module: "Life Purpose", step: 13, title: "Previous Drafts pop-up (needs: draft)", path: "/life-purpose?popup=history", built: true },
  { module: "Life Purpose", step: 14, title: "Does this feel true? pop-up (needs: draft)", path: "/life-purpose?popup=sure", built: true },
  { module: "Life Purpose", step: 15, title: "Final State (needs: final)", path: "/life-purpose/final", built: true },
  { module: "Life Purpose", step: 16, title: "Life Stories gallery (needs: stories)", path: "/life-purpose/stories-view", built: true },
  { module: "Life Purpose", step: 17, title: "Book a call with Dinesh", path: "/book-call", built: true },
  { module: "Visions", step: 1, title: "Vision — life areas (Flow Screen 1/11/12)", path: "/visions", built: true },
  { module: "Visions", step: 2, title: "Question 1 (Flow Screen 2)", path: "/visions/health/questions?q=1", built: true },
  { module: "Visions", step: 3, title: "Question 2 (Flow Screen 3)", path: "/visions/health/questions?q=2", built: true },
  { module: "Visions", step: 4, title: "Question 3 (Flow Screen 4)", path: "/visions/health/questions?q=3", built: true },
  { module: "Visions", step: 5, title: "Question 4 (Flow Screen 5)", path: "/visions/health/questions?q=4", built: true },
  { module: "Visions", step: 6, title: "Write my vision (Flow Screen 6)", path: "/visions/health/write", built: true },
  { module: "Visions", step: 7, title: "Go Deeper, per power word (Flow Screen 7–10)", path: "/visions/health/deeper", built: true },
  { module: "Visions", step: 8, title: "Vision board", path: "/visions/health/board", built: true },
  { module: "Visions", step: 9, title: "All my visions (Final Screen)", path: "/visions/all", built: true },
  { module: "Values & Qualities", step: 1, title: "Intro (VQ - Begin)", path: "/values", built: true },
  { module: "Values & Qualities", step: 2, title: "Question, one at a time", path: "/values/q", built: true },
  { module: "Values & Qualities", step: 3, title: "Trade-off (keep, then give up)", path: "/values/tradeoff", built: true },
  { module: "Values & Qualities", step: 4, title: "The four checks", path: "/values/checks", built: true },
  { module: "Values & Qualities", step: 5, title: "Results", path: "/values/results", built: true },
  { module: "Values & Qualities", step: 6, title: "Values (Foundation)", path: "/values/mine", built: true },
  { module: "Values & Qualities", step: 7, title: "Qualities (Foundation)", path: "/values/qualities", built: true },
  { module: "Outcomes", step: 0, title: "Today (tracking; a tick opens the companion)", path: "/outcomes/today", built: true },
  { module: "Outcomes", step: 1, title: "Current period (notes, days left)", path: "/outcomes/period", built: true },
  { module: "Outcomes", step: 2, title: "Prior periods + trend", path: "/outcomes/prior", built: true },
  { module: "Outcomes", step: 3, title: "Close the period, one outcome at a time", path: "/outcomes/closing", built: true },
  { module: "Well-Being", step: 1, title: "Score my well-being", path: "/wellbeing/score", built: true },
  { module: "Well-Being", step: 2, title: "Both scores together", path: "/wellbeing/results", built: true },
  { module: "Outcomes", step: 4, title: "Set up new dates", path: "/outcomes/dates", built: true },
  { module: "Outcomes", step: 5, title: "Set up new outcomes", path: "/outcomes/new", built: true },
  { module: "Outcomes", step: 6, title: "Prioritize, then start", path: "/outcomes/build-next", built: true },
  { module: "Life Code", step: 1, title: "Life Codes (list + filters)", path: "/life-code", built: true },
  { module: "Life Code", step: 2, title: "New life code (five steps)", path: "/life-code/new", built: true },
  { module: "Life Code", step: 3, title: "One life code open", path: "/life-code/lc-1", built: true },
  { module: "Profile", step: 1, title: "Profile", path: "/profile", built: false },
  { module: "Settings", step: 1, title: "Settings", path: "/settings", built: true },
  { module: "Settings", step: 2, title: "Personal Details", path: "/settings/personal", built: true },
  { module: "Settings", step: 3, title: "Change Password (pop-up)", path: "/settings?sheet=password", built: true },
  { module: "Settings", step: 4, title: "Life Area Images", path: "/settings/life-area-images", built: true },
  { module: "Settings", step: 5, title: "Life area image (pop-up)", path: "/settings/life-area-images?area=health", built: true },
];
