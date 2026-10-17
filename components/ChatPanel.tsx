"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LifeCodeFlow from "@/components/life-code/LifeCodeFlow";
import BottomNav from "@/components/shell/BottomNav";
import { ccaScript, ccaSource, type ModuleKey } from "@/lib/cca-script";
import { addLifeCode, useApp } from "@/lib/store";

// The companion (CCA) chat: Figma "CCA - Start" (greeting, three cards, the text box) and
// "CCA - Chat" (the conversation in a white card, the client's messages right-aligned in grey
// bubbles, the companion's as plain text). It covers the screen with the nav showing
// My Companion, and closes with the back arrow or by going anywhere in the nav.
//
// There is no AI behind it: each client message gets the next scripted line for the module
// (lib/cca-script.ts), after a second of "typing". The conversation lives here and is gone when
// the panel closes. The one thing it changes is My Life Code: when the script offers to save a
// life code, confirming runs the five-step life code flow with the client's previous message
// as the statement, and the saved code shows on /life-code straight away.

type Message =
  | { from: "client"; text: string }
  | { from: "cca"; text: string; offer?: "open" | "saved" | "declined" }
  | { from: "saved"; id: string; statement: string };

const TYPING_MS = 1000;

export default function ChatPanel({
  moduleKey,
  open,
  onClose,
  firstMessage,
}: {
  moduleKey: ModuleKey;
  open: boolean;
  onClose: () => void;
  firstMessage?: string;
}) {
  const router = useRouter();
  const { user, outcomes } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [next, setNext] = useState(0); // the next scripted line
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState<string | null>(null); // statement going through the flow
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const end = useRef<HTMLDivElement>(null);
  const script = ccaScript[moduleKey];

  /** The client's message, then (after a moment of typing) the companion's next line. */
  function send(message: string, from = next) {
    const line = script[from];
    setMessages((m) => [...m.map(closeOffer), { from: "client", text: message }]);
    if (!line) return;
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "cca", text: line.text, offer: line.offerLifeCode ? "open" : undefined }]);
      setNext(from + 1);
    }, TYPING_MS);
  }

  // Each opening starts a fresh conversation; closing throws it away.
  useEffect(() => {
    clearTimeout(timer.current);
    setMessages([]);
    setNext(0);
    setTyping(false);
    setText("");
    setSaving(null);
    if (open && firstMessage) send(firstMessage, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firstMessage, moduleKey]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [messages, typing]);

  if (!open) return null;

  const submit = () => {
    if (!text.trim() || typing) return;
    send(text.trim());
    setText("");
  };
  const lastClientMessage = (before: number) =>
    [...messages.slice(0, before)].reverse().find((m): m is Extract<Message, { from: "client" }> => m.from === "client")?.text ?? "";
  const setOffer = (i: number, offer: "saved" | "declined") =>
    setMessages((m) => m.map((x, k) => (k === i && x.from === "cca" ? { ...x, offer } : x)));
  const leave = (href: string) => {
    onClose();
    router.push(href);
  };
  const first = (user?.name ?? "").trim().split(/\s+/)[0];
  const started = messages.length > 0 || typing;

  if (saving !== null) {
    const offerIndex = messages.findIndex((m) => m.from === "cca" && m.offer === "open");
    return (
      <div className="fixed inset-0 z-30 mx-auto max-w-frame overflow-y-auto bg-background pb-nav-clearance">
        <LifeCodeFlow
          initial={{ statement: saving }}
          onCancel={() => setSaving(null)}
          onSave={(input) => {
            const id = addLifeCode(input, ccaSource(moduleKey), moduleKey === "outcomes" ? outcomes.period?.id ?? null : null);
            setOffer(offerIndex, "saved");
            setMessages((m) => [...m, { from: "saved", id, statement: input.statement }]);
            setSaving(null);
          }}
        />
        <BottomNav active="companion" />
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="My Companion"
      // A tap on the nav goes where it points and closes the companion (even on the same page).
      onClickCapture={(e) => (e.target as HTMLElement).closest("nav a") && onClose()}
      className="fixed inset-0 z-30 mx-auto flex max-w-frame flex-col overflow-hidden bg-background"
    >
      {/* The companion illustration, faded, bottom right */}
      <div className="pointer-events-none absolute bottom-0 right-[-194px] h-[600px] w-[555px] overflow-hidden opacity-25">
        <Image src="/images/companion/background.png" alt="" width={1536} height={1024} className="absolute left-[-62.2%] top-0 h-full w-[162.2%] max-w-none" />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-20 px-32 pb-[115px]">
        {!started ? (
          <>
            <div className="box-content flex h-icon-button items-center pt-header-top">
              <button type="button" aria-label="Close the companion" onClick={onClose} className="flex size-icon-button items-center justify-center rounded-pill bg-white">
                <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} />
              </button>
            </div>
            <h1 className="font-heading text-h1 text-ink-brown">
              Hey{first ? `, ${first}` : ""}!
              <br />
              What’s on your mind?
            </h1>
            <div className="flex flex-col gap-12">
              <StartCard
                tone="blue"
                title="Want to live with intention?"
                body="Add the guidelines that keep your days pointed toward what matters to you."
                action="Add Guidelines"
                onClick={() => leave(`/life-code/new?source=Chat`)}
              />
              <StartCard
                tone="pink"
                title="Weighing a decision?"
                body="Bring your purpose and values into it - we’ll show how much each option holds up."
                action="Open Decision Tool"
                onClick={() => send("I’m weighing a decision.")}
              />
              <StartCard tone="yellow" title="Want to log today's result?" body="Mark today a win in my results game." action="Log My Result" onClick={() => leave("/outcomes/today")} />
            </div>
            <div className="flex-1" />
          </>
        ) : (
          <div className="mt-[102px] flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-12 border border-chat-line bg-white p-16">
              <div className="flex flex-col gap-20">
                {messages.map((m, i) =>
                  m.from === "client" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[220px] whitespace-pre-wrap rounded-12 rounded-br-none bg-chat-bubble p-8 text-right text-body-small text-black">{m.text}</p>
                    </div>
                  ) : m.from === "cca" ? (
                    <div key={i} className="flex flex-col gap-12">
                      <p className="text-body-small text-black">{m.text}</p>
                      {m.offer === "open" && (
                        <div className="flex gap-8">
                          <button type="button" onClick={() => setOffer(i, "declined")} className="flex-1 rounded-8 bg-cancel py-12 text-button-cta text-cancel-text">
                            Not now
                          </button>
                          <button
                            type="button"
                            disabled={!lastClientMessage(i)}
                            onClick={() => setSaving(lastClientMessage(i))}
                            className="flex-1 rounded-8 bg-primary-600 py-12 text-button-cta text-white disabled:opacity-50"
                          >
                            Yes, save it
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key={i} className="flex flex-col gap-4 rounded-12 bg-primary-100 p-12">
                      <p className="text-caption text-ink-75">Saved to My Life Code</p>
                      <p className="text-body-small text-black">{m.statement}</p>
                      <Link href={`/life-code/${m.id}`} onClick={onClose} className="text-caption text-primary-600 underline">
                        See it in My Life Codes
                      </Link>
                    </div>
                  ),
                )}
                {typing && (
                  <span aria-label="Typing" className="flex gap-4 py-4">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="size-8 animate-bounce rounded-pill bg-chat-muted" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                )}
                <div ref={end} />
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-20 flex items-center justify-between gap-8 rounded-12 border border-chat-line bg-white px-12 py-8"
        >
          <span className="flex min-w-0 flex-1 items-center gap-4">
            <Image src="/icons/add.svg" alt="" width={24} height={24} />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={started ? "You are almost there ..." : "Let’s have a talk..."}
              aria-label="Message"
              className="min-w-0 flex-1 bg-transparent text-body-small text-black outline-none placeholder:text-chat-muted"
            />
          </span>
          {typing ? (
            <span aria-label="Companion is typing" className="flex size-24 items-center justify-center rounded-8 bg-chat-muted">
              <span className="size-8 bg-white" />
            </span>
          ) : (
            <button type="submit" aria-label="Send" disabled={!text.trim()} className="flex size-[32px] items-center justify-center disabled:opacity-50">
              <Image src="/icons/send.svg" alt="" width={27} height={27} />
            </button>
          )}
        </form>
      </div>

      <BottomNav active="companion" />
    </div>
  );
}

const closeOffer = (m: Message): Message => (m.from === "cca" && m.offer === "open" ? { ...m, offer: "declined" } : m);

const TONES = {
  blue: { border: "border-blue-500", soft: "bg-blue-100", button: "bg-blue-500 border-blue-600", icon: "/icons/activity-blue.svg" },
  pink: { border: "border-pink-500", soft: "bg-pink-100", button: "bg-pink-500 border-pink-600", icon: "/icons/activity-pink.svg" },
  yellow: { border: "border-yellow-500", soft: "bg-yellow-100", button: "bg-yellow-500 border-yellow-600", icon: "/icons/activity-yellow.svg" },
};

/** Figma "CCA Card": a white card with a coloured border, the icon tile, title, line and button. */
function StartCard({ tone, title, body, action, onClick }: { tone: keyof typeof TONES; title: string; body: string; action: string; onClick: () => void }) {
  const t = TONES[tone];
  return (
    <div className={`flex flex-col gap-8 rounded-12 border bg-white p-12 shadow-card-sm ${t.border}`}>
      <div className="flex items-center gap-12">
        <span className={`flex size-[32px] items-center justify-center rounded-8 ${t.soft}`}>
          <Image src={t.icon} alt="" width={20} height={20} />
        </span>
        <p className="text-body-medium text-black">{title}</p>
      </div>
      <p className="text-caption font-regular text-black">{body}</p>
      <button type="button" onClick={onClick} className={`w-full rounded-8 border px-16 py-8 text-button-cta text-white ${t.button}`}>
        {action}
      </button>
    </div>
  );
}
