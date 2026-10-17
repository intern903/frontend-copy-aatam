// Fake, browser-only auth for the prototype. There is no server and no real security here:
// the "JWT" is just base64url(header).base64url(payload).fake-signature so it has the right shape.

const TOKEN_KEY = "bridge-token";
const SEVEN_DAYS = 7 * 24 * 60 * 60; // seconds
export const AUTH_EVENT = "bridge-auth";

export type Session = { email: string; name: string; exp: number };

function base64url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(part: string) {
  const binary = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function createToken({ email, name }: { email: string; name: string }) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ email, name, exp: Math.floor(Date.now() / 1000) + SEVEN_DAYS }),
  );
  return `${header}.${payload}.${base64url("prototype-signature")}`;
}

/** The current session if a well-formed, unexpired token is saved; otherwise null. */
export function readSession(): Session | null {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const [, payload] = token.split(".");
    const session = JSON.parse(fromBase64url(payload)) as Session;
    if (!session.email || typeof session.exp !== "number") return null;
    return session.exp * 1000 > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage blocked: the guard will send the user back to /login.
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Log out: clear the token. The route guard sees the change and returns to /login. */
export function logOut() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}
