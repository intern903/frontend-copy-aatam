// Where "back" goes from every screen: the parent screen in the flow, never the browser's
// previous page (which is empty when a screen is opened from a link, and wrong after a redirect).
//
// - A step inside a module goes back one step in that module.
// - The first screen of a module goes back to its section: My Foundation (/life-purpose/final)
//   for Life Purpose, Visions and Values & Qualities; My Journey (/outcomes/today) for Outcomes,
//   Well-Being and Life Codes.
// - The two section screens, settings, the CIF and anything else top-level go back to home.
// - A screen not listed here goes to the path above it (/a/b → /a, /a → home), so a new
//   screen gets a sensible back without anyone remembering to add it.
//
// Used by components/shell/BackButton.tsx, which every header in the app renders.

export const HOME = "/";
export const FOUNDATION = "/life-purpose/final";
export const JOURNEY = "/outcomes/today";

const PARENTS: Record<string, string | null> = {
  "/": null,
  "/login": null,
  "/signup": "/login",
  "/forgot-password": "/login",
  "/reset-password": "/login",
  "/_index": HOME,
  "/book-call": HOME,
  "/settings": HOME,
  "/settings/personal": "/settings",
  "/settings/life-area-images": "/settings",

  // Myself (the intake form): its own steps go back inside the form; the screen itself → home.
  "/cif": HOME,
  "/cif/thanks": HOME,
  "/cif/agreement": "/cif/thanks",

  // My Foundation
  [FOUNDATION]: HOME,
  "/life-purpose": FOUNDATION,
  "/life-purpose/stories": "/life-purpose",
  "/life-purpose/clustering": "/life-purpose/stories",
  "/life-purpose/naming": "/life-purpose/clustering",
  "/life-purpose/power-words": "/life-purpose/naming",
  "/life-purpose/write": "/life-purpose/power-words",
  "/life-purpose/stories-view": FOUNDATION,
  "/visions": FOUNDATION,
  "/visions/all": "/visions",
  "/values": FOUNDATION,
  "/values/q": "/values",
  "/values/tradeoff": "/values",
  "/values/checks": "/values",
  "/values/results": "/values",
  "/values/mine": FOUNDATION,
  "/values/qualities": "/values/mine",

  // My Journey
  [JOURNEY]: HOME,
  "/outcomes/period": JOURNEY,
  "/outcomes/prior": "/outcomes/period",
  "/outcomes/closing": "/outcomes/period",
  "/wellbeing/score": "/outcomes/closing",
  "/wellbeing/results": "/wellbeing/score",
  "/outcomes/dates": "/outcomes/period",
  "/outcomes/new": "/outcomes/dates",
  "/outcomes/build-next": "/outcomes/new",
  "/life-code": JOURNEY,
  "/life-code/new": "/life-code",
};

/** The parent of a screen, or null for home (and the login screen, which has nothing behind it). */
export function parentOf(pathname: string, search: URLSearchParams = new URLSearchParams()): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  // Screens whose parent depends on where in the flow the client is.
  const vision = path.match(/^\/visions\/([^/]+)\/(questions|write|deeper|board)$/);
  if (vision) {
    const [, area, step] = vision;
    if (step === "questions") {
      const q = Number(search.get("q")) || 1;
      return q > 1 ? `/visions/${area}/questions?q=${q - 1}` : "/visions";
    }
    if (step === "write") return `/visions/${area}/questions?q=4`;
    if (step === "deeper") {
      const n = Number(search.get("word")) || 1;
      return n > 1 ? `/visions/${area}/deeper?word=${n - 1}` : `/visions/${area}/write`;
    }
    return `/visions/${area}/write`; // board
  }
  if (path === "/life-code/new") {
    const editing = search.get("edit");
    const back = search.get("return");
    if (back?.startsWith("/")) return back;
    return editing ? `/life-code/${editing}` : "/life-code";
  }
  if (/^\/life-code\/[^/]+$/.test(path)) return "/life-code";

  if (path in PARENTS) return PARENTS[path];
  // Not listed: the path above it.
  const up = path.slice(0, path.lastIndexOf("/"));
  return up || HOME;
}
