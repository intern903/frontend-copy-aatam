"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import BackButton from "@/components/shell/BackButton";
import { StatementGlass } from "@/components/life-purpose/ui";
import { LifeAreaCard } from "@/components/settings/LifeAreaImage";
import { lifeAreas, type LifeAreaId } from "@/lib/data";
import { useApp } from "@/lib/store";
import { areaColour, areaName } from "@/lib/visions";

// Building blocks for the Engine screens: My Outcomes, My Well-Being and My Life Code
// (Figma "RG - …" frames). Shared by /outcomes, /wellbeing and /life-code.

/**
 * "My Life Purpose" (Yellow/100, star) and "My Goals" (Primary/100, target): the two fixed
 * buttons on every Engine screen. Both open as pop-ups over the screen (Figma "RG - Life Purpose"
 * and "RG - My Goals"), so the client never leaves the Engine to look at them.
 */
export function PurposeGoals() {
  const [open, setOpen] = useState<"purpose" | "goals" | null>(null);
  return (
    <div className="flex w-full items-stretch gap-12">
      <button
        type="button"
        onClick={() => setOpen("purpose")}
        className="relative flex flex-1 flex-col overflow-hidden rounded-24 bg-yellow-100 px-16 py-12 text-left"
      >
        <Image
          src="/icons/star-yellow.svg"
          alt=""
          width={80}
          height={80}
          className="absolute left-[103px] top-1/2 -translate-y-1/2"
        />
        <span className="relative font-heading text-h4 text-ink-80">
          Life Purpose
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen("goals")}
        className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-24 bg-primary-100 px-16 py-12 text-left"
      >
        <Image
          src="/icons/target.svg"
          alt=""
          width={80}
          height={80}
          className="absolute left-[103px] top-1/2 -translate-y-1/2"
        />
        <span className="relative font-heading text-h4 text-ink-80">
          My
          <br />
          Goals
        </span>
      </button>
      {open === "purpose" && <PurposePopup onClose={() => setOpen(null)} />}
      {open === "goals" && <MyGoalsPopup onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Scrim + centred card, closed by the scrim, the X or Escape. */
function Overlay({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/25"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}

/** Figma "RG - Life Purpose": the statement on the sky photo, 329 × 330, with a white X. */
function PurposePopup({ onClose }: { onClose: () => void }) {
  const { lifePurpose: lp } = useApp();
  const final = lp.status === "final";
  return (
    <Overlay label="Life Purpose" onClose={onClose}>
      <div className="relative h-purpose-card w-content overflow-hidden rounded-24 shadow-image">
        <Image
          src="/images/life-purpose/purpose-sky.webp"
          alt=""
          fill
          sizes="329px"
          className="object-cover object-[50%_20%]"
        />
        <div className="absolute inset-x-16 top-16 flex items-start justify-between gap-8">
          <div>
            <h2 className="font-heading text-h1 text-white">Life Purpose</h2>
            <p className="mt-4 text-caption text-white">
              The thread through every moment when I’m most alive
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="mt-4 flex size-icon shrink-0 items-center justify-center rounded-pill"
          >
            <Image src="/icons/x-white.svg" alt="" width={20} height={20} />
          </button>
        </div>
        <div className="absolute inset-x-16 bottom-16">
          {final ? (
            <StatementGlass
              statement={lp.statement}
              powerWords={lp.clusters.map((c) => c.name)}
            />
          ) : (
            <div className="rounded-12 bg-white/10 p-16 backdrop-blur-[2px]">
              <p className="text-body text-white">
                Your life purpose will appear here once it feels like yours.
              </p>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

/**
 * Figma "RG - My Goals": a 329px Background/500 card, "My Goals" with the target and an X, then
 * one life-area card per area that has goals. Tap a card to turn it over to that area's goals.
 */
function MyGoalsPopup({ onClose }: { onClose: () => void }) {
  const { cif } = useApp();
  const areas = lifeAreas.filter((a) =>
    cif.keyResults.some((g) => g.lifeArea === a.id),
  );
  return (
    <Overlay label="Goals" onClose={onClose}>
      <div className="flex max-h-[80vh] w-content flex-col overflow-hidden rounded-12 bg-background">
        <div className="flex flex-col gap-8 px-16 pt-16">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-8">
              <Image src="/icons/target-24.svg" alt="" width={24} height={24} />
              <h2 className="font-heading text-h3 text-black">Goals</h2>
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-icon items-center justify-center rounded-pill"
            >
              <Image src="/icons/x.svg" alt="" width={20} height={20} />
            </button>
          </div>
          <span className="border-t border-black" />
        </div>
        <div className="flex flex-col gap-12 overflow-y-auto px-16 pb-16 pt-12">
          {areas.length === 0 ? (
            <p className="text-body-small text-ink-60">
              Your goals will show here once you and Dinesh have set them.
            </p>
          ) : (
            areas.map((a) => (
              <GoalCard
                key={a.id}
                id={a.id}
                name={a.name}
                goals={cif.keyResults
                  .filter((g) => g.lifeArea === a.id)
                  .map((g) => g.text)}
              />
            ))
          )}
        </div>
      </div>
    </Overlay>
  );
}

function GoalCard({
  id,
  name,
  goals,
}: {
  id: LifeAreaId;
  name: string;
  goals: string[];
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="h-area-card w-full shrink-0 [perspective:1000px]">
      {/* Only the facing side is drawn, so the hidden one can't catch taps. */}
      <div
        key={flipped ? "back" : "front"}
        className="relative size-full animate-card-turn"
      >
        {!flipped ? (
          <LifeAreaCard
            id={id}
            name={name}
            variant="vision"
            onOpen={() => setFlipped(true)}
            onArrow={() => setFlipped(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col gap-8 overflow-y-auto rounded-24 bg-white p-16">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-body text-black">{name}</span>
                <button
                  type="button"
                  aria-label="Turn over"
                  onClick={() => setFlipped(false)}
                  className="flex size-icon items-center justify-center"
                >
                  <Image src="/icons/x.svg" alt="" width={20} height={20} />
                </button>
              </div>
              <span className="border-t border-black" />
            </div>
            <ul className="flex list-disc flex-col gap-4 pl-20 text-body-small text-ink-brown">
              {goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** Figma "Map to a goal": the client's goals, each a white pill with its area, to pick one. */
export function GoalsSheet({
  onClose,
  onPick,
  title = "Map to a goal",
}: {
  onClose: () => void;
  onPick: (id: string) => void;
  title?: string;
}) {
  const { cif } = useApp();
  return (
    <PopUpSheet title={title} onClose={onClose} variant="bottom">
      {cif.keyResults.length === 0 ? (
        <p className="text-body-small text-ink-60">
          Your goals will show here once you and Dinesh have set them.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {cif.keyResults.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onPick(g.id)}
              className="flex w-full items-center gap-8 rounded-pill border-hairline border-background-600 bg-white px-12 py-8 text-left"
            >
              <span
                className={`size-8 shrink-0 rounded-4 ${areaColour(g.lifeArea).solid}`}
              />
              <span className="flex-1 text-body-small text-black">
                {g.text}
              </span>
              <span className="text-caption text-black">
                {areaName(g.lifeArea)}
              </span>
            </button>
          ))}
        </div>
      )}
    </PopUpSheet>
  );
}

/** Back arrow on the left at y 70 (and the search circle on the right where Figma has it). */
export function EngineTop({
  backHref,
  onBack,
  search,
}: {
  backHref?: string;
  onBack?: () => void;
  search?: boolean;
}) {
  const circle =
    "flex size-icon-button items-center justify-center rounded-pill bg-white";
  return (
    <div className="box-content flex h-icon-button items-center justify-between pt-header-top">
      <BackButton href={backHref} onClick={onBack} />
      {search && (
        <button type="button" aria-label="Search" className={circle}>
          <Image src="/icons/search.svg" alt="" width={24} height={24} />
        </button>
      )}
    </div>
  );
}

/** The frame every Engine screen shares: top row, the two fixed buttons, then the content at y 229. */
export function EngineFrame({
  top,
  children,
  swipe,
}: {
  top: React.ReactNode;
  children: React.ReactNode;
  swipe?: ReturnType<typeof useTabSwipe>;
}) {
  return (
    <main {...swipe} className="flex touch-pan-y flex-col px-32 pb-40">
      {top}
      <div className="mt-24">
        <PurposeGoals />
      </div>
      <div className="mt-20 flex flex-col gap-20">{children}</div>
    </main>
  );
}

/**
 * Today and Current period are the Engine's two tabs: a horizontal swipe moves between them
 * (touch only, so it never fights typing). The pills on each screen do the same by tap.
 */
export function useTabSwipe({
  left,
  right,
}: {
  left?: string;
  right?: string;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0 && left) router.push(left);
      if (dx > 0 && right) router.push(right);
    },
  };
}

/** H3 heading with an optional control on the right (count pill, plus/clock, filter…). */
export function SectionHead({
  title,
  right,
  sub,
}: {
  title: string;
  right?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-h3 text-black">{title}</h1>
        {sub && <p className="text-caption text-ink-50">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** "4 qualities", "2 outcomes": white pill, Background/600 hairline, Caption ink/75. */
export function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill border-hairline border-background-600 bg-white px-12 py-4 text-caption text-ink-75">
      {children}
    </span>
  );
}

export const BUILD_STEPS = [
  "Well-being",
  "Dates",
  "Outcomes",
  "Priority",
] as const;

/** The four-part progress under the heading: 4px rounded lines, black up to the current step. */
export function Stepper({
  steps = BUILD_STEPS,
  current,
}: {
  steps?: readonly string[];
  current: number;
}) {
  return (
    <div className="flex w-full gap-8">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-4">
          <span
            className={`h-4 w-full rounded-pill ${i <= current ? "bg-black" : "bg-ink-25"}`}
          />
          <span
            className={`text-caption ${i <= current ? "text-black" : "text-ink-25"}`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Figma's ring charts ("9/21", "80%"): a Primary/100 track with the Primary/500 share drawn
 * clockwise from the top, the ring 10% of the diameter. Plain SVG.
 */
export function Ring({
  value,
  size,
  children,
}: {
  value: number;
  size?: number;
  children: React.ReactNode;
}) {
  const share = Math.max(0, Math.min(1, value));
  const r = 45;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative aspect-square w-full"
      style={size ? { width: size } : undefined}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          className="stroke-primary-100"
        />
        {share > 0 && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeDasharray={`${c * share} ${c}`}
            className="stroke-primary-500"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** Score colours, in Figma's order down the well-being list: green, pink, blue, yellow. */
const TONES = [
  { on: "bg-primary-500", off: "bg-primary-100" },
  { on: "bg-pink-500", off: "bg-pink-100" },
  { on: "bg-blue-500", off: "bg-blue-100" },
  { on: "bg-yellow-500", off: "bg-yellow-100" },
];
export const tone = (i: number) => TONES[i % TONES.length];

/** Ten 20px boxes, 4px apart: the first `score` filled. Tapping box n scores n. */
export function ScoreBoxes({
  score,
  toneIndex = 0,
  colours,
  onPick,
  label,
}: {
  score: number | null;
  toneIndex?: number;
  colours?: { on: string; off: string }; // a life area's colours instead of the rotation
  onPick?: (n: number) => void;
  label: string;
}) {
  const t = colours ?? tone(toneIndex);
  return (
    <div
      className="flex w-full gap-4"
      role={onPick ? "radiogroup" : undefined}
      aria-label={label}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const cls = `h-20 flex-1 rounded-4 ${score !== null && n <= score ? t.on : t.off}`;
        return onPick ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={`${n} out of 10`}
            onClick={() => onPick(n)}
            className={cls}
          />
        ) : (
          <span key={n} className={cls} />
        );
      })}
    </div>
  );
}

/** "7/10" or "--" in Stat Large (JetBrains Mono). */
export function OutOfTen({ score }: { score: number | null }) {
  return (
    <span className="font-mono text-stat-large text-black">
      {score === null ? "--" : `${score}/10`}
    </span>
  );
}

/**
 * A choice pill (Figma "Select life area", the filters): white with a Background/600 hairline,
 * or Primary/500 with white text when chosen. An optional dot in the area's colour, and a count.
 */
export function Chip({
  label,
  on,
  onClick,
  dot,
  count,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  dot?: string; // bg class
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex items-center gap-6 rounded-pill border-hairline border-background-600 px-12 py-6 text-body-small ${
        on ? "bg-primary-500 text-white" : "bg-white text-black"
      }`}
    >
      {dot && <span className={`size-8 rounded-4 ${on ? "bg-white" : dot}`} />}
      {label}
      {count !== undefined && <span>{count}</span>}
    </button>
  );
}

/** The life-area chips, in wheel order, each with its colour dot. */
export function AreaChips({
  selected,
  onToggle,
}: {
  selected: LifeAreaId[];
  onToggle: (id: LifeAreaId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-8">
      {lifeAreas.map((a) => (
        <Chip
          key={a.id}
          label={a.name}
          dot={areaColour(a.id).solid}
          on={selected.includes(a.id)}
          onClick={() => onToggle(a.id)}
        />
      ))}
    </div>
  );
}

/** Two-line choice card (Figma "Doing / Something I do"): 12px radius, Primary/500 when chosen. */
export function ChoiceCard({
  title,
  sub,
  on,
  onClick,
}: {
  title: string;
  sub?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex flex-1 flex-col items-start gap-2 rounded-12 px-12 py-8 text-left ${
        on
          ? "border-hairline border-black bg-primary-500"
          : "border-hairline border-background-600 bg-white"
      }`}
    >
      <span className={`text-body ${on ? "text-white" : "text-black"}`}>
        {title}
      </span>
      {sub && (
        <span
          className={`text-caption ${on ? "text-white/60" : "text-ink-60"}`}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

/** Body Small label with the grey asterisk Figma puts on required fields. */
export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="text-body-small text-black">
      {children}
      {required && <span className="text-ink-50"> *</span>}
    </p>
  );
}

/** "Macro · Family · My Results Game": caption ink/60 words with 2px dots between. */
export function DotTags({ tags }: { tags: string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-4">
      {tags.map((t, i) => (
        <span key={`${t}-${i}`} className="flex items-center gap-4">
          {i > 0 && <span className="size-2 rounded-2 bg-ink-60" />}
          <span className="text-caption text-ink-60">{t}</span>
        </span>
      ))}
    </span>
  );
}

/** Two full-width buttons stacked 6px apart (green action, grey "Cancel My Game"). */
export function StackedButtons({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-6">{children}</div>;
}
export function GreyCta({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-8 bg-cancel px-24 py-16 text-button-cta text-cancel-text"
    >
      {children}
    </button>
  );
}

/** "Cancel this game?" (Figma "RG - Cancel Game"): Keep Going, or clear what was built. */
export function CancelGameSheet({
  onKeep,
  onCancel,
}: {
  onKeep: () => void;
  onCancel: () => void;
}) {
  return (
    <PopUpSheet
      title="Cancel this game?"
      onClose={onKeep}
      variant="bottom"
      closable={false}
    >
      <p className="text-body text-black">
        I’ve put real work into this period. If I cancel, that progress clears
        and can’t be brought back.
      </p>
      <StackedButtons>
        <button
          type="button"
          onClick={onKeep}
          className="w-full rounded-8 bg-primary-600 py-16 text-button-cta text-white"
        >
          Keep Going
        </button>
        <GreyCta onClick={onCancel}>Yes, Cancel Game</GreyCta>
      </StackedButtons>
    </PopUpSheet>
  );
}
