"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import {
  CheckRow,
  FaqPopup,
  HelpButton,
  LpHeader,
  PrimaryButton,
  StatementGlass,
  WordPill,
} from "@/components/life-purpose/ui";
import BottomNav from "@/components/shell/BottomNav";
import {
  CHECKLIST,
  MAKE_IT_REAL,
  checkState,
  clusterColour,
  wordsFromStories,
  type CheckId,
} from "@/lib/lifePurpose";
import { saveDraft, setPurposeStatus, toggleMakeItReal, useApp, type AppState } from "@/lib/store";

/** Where "Begin" picks up. Per the Life Purpose flow, Begin opens the clustering web; once every
 *  word is clustered it continues to naming, then writing. */
function nextStep(lp: AppState["lifePurpose"]) {
  const words = wordsFromStories(lp.stories);
  const clustered = new Set(lp.clusters.flatMap((c) => c.words.map((w) => w.toLowerCase())));
  if (!words.length || words.some((w) => !clustered.has(w.toLowerCase()))) return "/life-purpose/clustering";
  if (lp.clusters.some((c) => !c.name.trim())) return "/life-purpose/naming";
  return "/life-purpose/write";
}

type Popup = "faq" | "edit" | "history" | "sure" | "congrats";

export default function LifePurposePage() {
  return (
    <Suspense>
      <LifePurpose />
    </Suspense>
  );
}

// ?popup=faq|edit|history|sure opens that pop-up straight away (links in /_index).
function LifePurpose() {
  const router = useRouter();
  const popupParam = useSearchParams().get("popup");
  const popup = (["faq", "edit", "history", "sure", "congrats"] as const).find((p) => p === popupParam) ?? null;
  const { lifePurpose: lp } = useApp();

  useEffect(() => {
    if (lp.status === "final") router.replace("/life-purpose/final");
  }, [lp.status, router]);

  if (lp.status === "final") return null;
  return lp.status === "draft" && lp.statement.trim() ? (
    <DraftView initialPopup={popup} />
  ) : (
    <EmptyState next={nextStep(lp)} openFaq={popup === "faq"} />
  );
}

// ---------- Figma "LP - Empty State" ----------

// Figma's example words, shown before the client has stories of their own.
const EXAMPLE_WORDS = ["Curious", "Keep Promises", "Calm", "Generous", "Brave", "Big-thinker"];
const TILTS = [-4, 4, -4, -4, 4, -4];

function EmptyState({ next, openFaq }: { next: string; openFaq: boolean }) {
  const { lifePurpose: lp } = useApp();
  const [faq, setFaq] = useState(openFaq);
  const own = wordsFromStories(lp.stories);
  const words = (own.length ? own : EXAMPLE_WORDS).slice(0, 6);

  return (
    <main className="flex min-h-screen flex-col px-32 pb-40">
      {/* Help isn't on this frame in Figma; added so the FAQ is reachable before starting. */}
      <LpHeader onHelp={() => setFaq(true)} />
      <h1 className="mt-[207px] font-heading text-h1 text-black">Find My Power Words</h1>
      <div className="mt-16 flex flex-wrap gap-x-8 gap-y-12">
        {words.map((w, i) => (
          <WordPill key={w} word={w} fill={clusterColour(i).solid} tilt={TILTS[i % TILTS.length]} />
        ))}
      </div>
      <p className="mt-20 text-body-small text-black">
        Sort my words and phrases into clusters that feel like you. Name each cluster, and I will find my own power
        words.
      </p>
      <div className="mt-auto pt-40">
        <PrimaryButton href={next}>Begin</PrimaryButton>
      </div>
      {faq && <FaqPopup onClose={() => setFaq(false)} />}
    </main>
  );
}

// ---------- Figma "LP - Draft" (+ Edit Draft, Previous Drafts, "Does this feel true?", FAQs) ----------

function DraftView({ initialPopup }: { initialPopup: Popup | null }) {
  const router = useRouter();
  const { lifePurpose: lp } = useApp();
  const [popup, setPopup] = useState<Popup | null>(initialPopup);

  return (
    <main className="px-32 pb-nav-clearance">
      <LpHeader search />
      <div className="mt-24 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-h1 text-black">My Life Purpose</h1>
          <p className="mt-4 text-caption text-ink-brown">The thread through every moment when I’m most alive</p>
        </div>
        <HelpButton onClick={() => setPopup("faq")} />
      </div>

      <div className="relative mt-20 h-draft-card overflow-hidden rounded-24 shadow-image">
        <Image src="/images/life-purpose/purpose-sky.png" alt="" fill sizes="329px" className="object-cover object-[50%_30%]" />
        <div className="absolute inset-16 flex flex-col justify-between">
          <p className="text-body-small text-white">Draft</p>
          <StatementGlass statement={lp.statement} />
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setPopup("sure")} className="rounded-8 bg-primary-500 px-12 py-8 text-button-cta text-white">
              Feels True
            </button>
            <span className="flex items-center gap-8">
              <button type="button" aria-label="Edit draft" onClick={() => setPopup("edit")} className="p-2">
                <Image src="/icons/edit-white.svg" alt="" width={20} height={20} />
              </button>
              <button type="button" aria-label="Previous drafts" onClick={() => setPopup("history")} className="p-2">
                <Image src="/icons/clock-white.svg" alt="" width={20} height={20} />
              </button>
            </span>
          </div>
        </div>
      </div>

      <h2 className="mt-20 font-heading text-h2 text-black">Make it real</h2>
      <p className="mt-4 text-caption text-ink-80">Suggestions to finalize my life purpose</p>
      <div className="mt-12 flex flex-col gap-12">
        {MAKE_IT_REAL.map((label, i) => (
          <CheckRow key={label} dark label={label} on={lp.makeItReal.includes(i)} onClick={() => toggleMakeItReal(i)} />
        ))}
      </div>

      <BottomNav active="foundation" />

      {popup === "congrats" && (
        // Life Purpose flow, step 22: finalising is a congratulation, never a warning, and says it
        // can still be edited later. Not in Figma; built from the same pop-up.
        <PopUpSheet title="Congratulations" radius="md" closable={false} onClose={() => setPopup(null)}>
          <p className="text-body text-black">
            You have put words to what you were already living. You can come back and edit it any time.
          </p>
          <PrimaryButton
            onClick={() => {
              setPurposeStatus("final");
              router.push("/life-purpose/final");
            }}
          >
            See my life purpose
          </PrimaryButton>
        </PopUpSheet>
      )}
      {popup === "faq" && <FaqPopup onClose={() => setPopup(null)} />}
      {popup === "edit" && <EditDraft onClose={() => setPopup(null)} />}
      {popup === "history" && <PreviousDrafts onClose={() => setPopup(null)} />}
      {popup === "sure" && (
        // Figma "LP - Surity": no close X; the two buttons are the way out.
        <PopUpSheet title="Does this feel true?" radius="md" closable={false} onClose={() => setPopup(null)}>
          <p className="text-body text-black">It is a visceral experience. You will know it when you get it.</p>
          <div className="flex flex-col gap-6">
            <PrimaryButton onClick={() => setPopup("congrats")}>Yes, it feels true</PrimaryButton>
            <button type="button" onClick={() => setPopup(null)} className="w-full rounded-8 bg-cancel py-16 text-button-cta text-black">
              Not yet, I’ll come back
            </button>
          </div>
        </PopUpSheet>
      )}
    </main>
  );
}

/** Figma "LP - Edit Draft": the client's own statement in a box, the checklist, Draft Feels True. */
function EditDraft({ onClose }: { onClose: () => void }) {
  const { lifePurpose: lp } = useApp();
  const [text, setText] = useState(lp.statement);
  const [overrides, setOverrides] = useState<Partial<Record<CheckId, boolean>>>({});
  const on = checkState(text, overrides);

  return (
    <PopUpSheet title="My Life Purpose" radius="md" onClose={onClose}>
      <textarea
        aria-label="My life purpose"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-12 border border-ink-25 bg-white p-12 text-body-medium text-black outline-none"
      />
      <div className="flex flex-col gap-8">
        {CHECKLIST.map((c) => (
          <CheckRow key={c.id} label={c.label} on={on(c.id)} onClick={() => setOverrides((o) => ({ ...o, [c.id]: !on(c.id) }))} />
        ))}
      </div>
      <PrimaryButton
        disabled={!text.trim()}
        onClick={() => {
          saveDraft(text.trim());
          onClose();
        }}
      >
        Draft Feels True
      </PrimaryButton>
    </PopUpSheet>
  );
}

const DRAFT_TINTS = [
  { card: "bg-primary-100 border-primary-500", date: "bg-primary-500" },
  { card: "bg-pink-100 border-pink-500", date: "bg-pink-500" },
  { card: "bg-blue-100 border-blue-500", date: "bg-blue-500" },
];

/** Figma "LP - Previous Drafts": dated cards that scroll sideways, newest first, with page dots. */
function PreviousDrafts({ onClose }: { onClose: () => void }) {
  const { lifePurpose: lp } = useApp();
  const drafts = [...lp.drafts].reverse();
  const [page, setPage] = useState(0);
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <PopUpSheet title="My Previous Drafts" radius="md" onClose={onClose}>
      {drafts.length === 0 ? (
        <p className="text-body-small text-ink-50">No earlier drafts yet.</p>
      ) : (
        <>
          <div
            className="-mr-20 flex snap-x snap-mandatory gap-8 overflow-x-auto pr-20"
            onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / 297))}
          >
            {drafts.map((d, i) => {
              const tint = DRAFT_TINTS[i % DRAFT_TINTS.length];
              return (
                <article key={i} className={`flex w-[289px] shrink-0 snap-start flex-col gap-8 rounded-12 border p-16 ${tint.card}`}>
                  <span className={`self-start rounded-pill px-8 py-2 text-caption text-white ${tint.date}`}>{fmt(d.date)}</span>
                  <p className="text-body-small text-black">{d.text}</p>
                </article>
              );
            })}
          </div>
          <div className="flex justify-center gap-8" aria-hidden>
            {drafts.map((_, i) => (
              <span key={i} className={`size-4 rounded-2 ${i === page ? "bg-olive" : "bg-cancel"}`} />
            ))}
          </div>
        </>
      )}
    </PopUpSheet>
  );
}
