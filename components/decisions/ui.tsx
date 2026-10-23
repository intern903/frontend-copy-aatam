"use client";

import Image from "next/image";
import Link from "next/link";
import { StatementText } from "@/components/life-purpose/ui";
import { STATUS_STYLE, STEPS, filledChoices, finalScore, groupScore, groups, longDate, tone, type Decision } from "@/lib/decisions";
import { useApp } from "@/lib/store";
import { areaName } from "@/lib/visions";

// Building blocks for the Decision screens (Figma "DT" frames).

/** H1 title and its Body Small line (Figma "Frame 2178"). */
export function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-h1 text-black">{title}</h1>
      <p className="text-body-small text-ink-brown">{sub}</p>
    </div>
  );
}

/** The nine-step bar under the back arrow (Figma "Frame 330"): done and current in black, the rest grey. */
export function StepBar({ step }: { step: number }) {
  return (
    <div aria-label={`Step ${step} of ${STEPS}`} className="flex w-full gap-8">
      {Array.from({ length: STEPS }, (_, i) => (
        <span key={i} className={`h-4 flex-1 rounded-pill ${i < step ? "bg-black" : "bg-cancel"}`} />
      ))}
    </div>
  );
}

/**
 * What has been decided so far, as Primary/600 chips joined by arrows, ending in "?" for the step
 * being answered (Figma: Career → statement → choices → …). Scrolls sideways past the gutter.
 */
export function Trail({ d, step }: { d: Decision; step: number }) {
  const parts: string[][] = [];
  if (step > 1 && d.lifeArea) parts.push([areaName(d.lifeArea)]);
  if (step > 2) parts.push([d.statement.trim()]);
  if (step > 3) parts.push(filledChoices(d));
  if (step > 4 && d.powerWords.length) parts.push(d.powerWords);
  if (step > 5 && d.values.length) parts.push(d.values);
  if (step > 6) {
    const own = d.params
      .filter((p) => p.name.trim())
      .map((p) => {
        const subs = p.subs.map((s) => s.trim()).filter(Boolean);
        return subs.length ? `${p.name.trim()} → ${subs.join(" / ")}` : p.name.trim();
      });
    if (own.length) parts.push(own);
  }
  if (step > 7) parts.push(["Weightage Given"]);
  if (step > 8) parts.push(["Scores Given"]);
  if (step < STEPS) parts.push(["?"]);

  return (
    <div className="-mr-32 flex items-center gap-8 self-stretch overflow-x-auto pr-32 [scrollbar-width:none]">
      {parts.map((chips, i) => (
        <span key={i} className="flex shrink-0 items-center gap-8">
          {i > 0 && <Image src="/icons/trail-arrow.svg" alt="" width={21} height={7} className="shrink-0" />}
          {chips.map((c, j) => (
            <span key={j} className="shrink-0 whitespace-nowrap rounded-pill bg-primary-600 px-12 py-4 text-body-small text-white">
              {c}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

/** Save as Draft (grey) on the left, Next → (Primary/600) on the right. */
export function CtaRow({ onDraft, onNext, next = "Next" }: { onDraft: () => void; onNext: () => void; next?: string }) {
  return (
    <div className="flex w-full items-center justify-between">
      <button type="button" onClick={onDraft} className="rounded-8 bg-cancel px-16 py-12 text-button-cta text-cancel-text">
        Save as Draft
      </button>
      <button type="button" onClick={onNext} className="flex items-center gap-8 rounded-8 bg-primary-600 px-16 py-12 text-button-cta text-white">
        {next}
        <Image src="/icons/arrow-right-white.svg" alt="" width={16} height={16} />
      </button>
    </div>
  );
}

/** A dashed-free white "+ Add …" row (Figma "Add Choice", "Add Parameter"). */
export function AddRow({ label, onClick, shadow }: { label: string; onClick: () => void; shadow?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-10 rounded-8 bg-white py-12 text-body text-chat-muted ${shadow ? "shadow-card-sm" : ""}`}
    >
      <Image src="/icons/plus.svg" alt="" width={20} height={20} />
      {label}
    </button>
  );
}

/** The 32px coloured number box (JetBrains Mono, Data Small, white), editable when onChange is given. */
export function NumBox({
  value,
  onChange,
  max,
  colour,
  label,
}: {
  value: number | null | undefined;
  onChange?: (v: number | undefined) => void;
  max: number;
  colour: string; // bg class
  label: string;
}) {
  const box = `w-32 shrink-0 rounded-4 py-4 text-center font-mono text-data-small text-white ${colour}`;
  if (!onChange) return <span className={box}>{value ?? "–"}</span>;
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={value ?? ""}
      placeholder="0"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onChange(digits === "" ? undefined : Math.min(max, Number(digits)));
      }}
      className={`${box} outline-none placeholder:text-white/70 focus:ring-2 focus:ring-black/30`}
    />
  );
}

/** The decision summary card (Figma "Frame 9" on DT- Screen / Completed / Final Decision). */
export function DecisionCard({ d, href }: { d: Decision; href?: string }) {
  const style = STATUS_STYLE[d.status];
  const body = (
    <>
      <div className="flex flex-col gap-12">
        <div className="flex items-center justify-between">
          <span className={`rounded-pill px-8 py-2 text-body-small text-white ${style.chip}`}>{d.lifeArea ? areaName(d.lifeArea) : "Life area"}</span>
          <span className={`rounded-pill px-8 py-2 text-body-small text-white ${style.chip}`}>{style.label}</span>
        </div>
        <p className="text-body text-black">{d.statement.trim() || "A decision not yet written"}</p>
      </div>
      <span className="border-t border-black/50" />
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-caption text-black">Winning Choice</span>
          <span className="truncate text-body text-black">{d.winner !== null ? d.choices[d.winner] : "Undecided"}</span>
        </div>
        <span className="shrink-0 text-body-small text-black">{longDate(d.date)}</span>
      </div>
    </>
  );
  const cls = `flex w-full flex-col gap-16 rounded-12 p-16 ${style.card}`;
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Each choice's score card side by side, scrolling sideways (Figma "DT - Completed" / "Final
 * Decision"): the choice and its final score, then every parameter as "weightage % – score".
 */
export function Breakdown({ d }: { d: Decision }) {
  const gs = groups(d);
  return (
    <div className="-mr-32 flex snap-x gap-12 self-stretch overflow-x-auto pr-32">
      {filledChoices(d).map((choice, c) => {
        const t = tone(c);
        const won = d.winner === c;
        return (
          <section key={c} className={`flex w-content shrink-0 snap-start flex-col gap-20 rounded-12 border-2 p-20 ${t.soft} ${won ? t.strong : t.border}`}>
            <div className="flex flex-col gap-12">
              <div className="flex items-end justify-between gap-8">
                <h3 className="font-heading text-h4 text-black">{choice}</h3>
                <span className="font-heading text-h1 text-black">{finalScore(d, c) ?? "–"}</span>
              </div>
              <span className="border-t border-black/50" />
            </div>
            {gs.map((g) => (
              <div key={g.key} className={`flex flex-col gap-12 rounded-8 border-2 bg-white p-16 ${t.border}`}>
                <WeightScore name={g.name} large weight={d.weights[g.key]} score={groupScore(d, c, g)} colour={t.solid} />
                {g.items.length > 0 && (
                  <>
                    <span className="border-t border-black/50" />
                    <div className="flex flex-col gap-8">
                      {g.items.map((it) => (
                        <WeightScore key={it.key} name={it.name} weight={d.weights[it.key]} score={d.scores[c]?.[it.key]} colour={t.solid} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function WeightScore({ name, weight, score, colour, large }: { name: string; weight?: number; score?: number | null; colour: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className={`min-w-0 ${large ? "text-body-large text-black" : "text-body-small text-black"}`}>{name}</span>
      <span className="flex shrink-0 items-center gap-8">
        <span className="flex items-center gap-4">
          <NumBox value={weight ?? 0} max={100} colour={colour} label={`${name} weightage`} />
          <span className="text-body text-black">%</span>
        </span>
        <span className="h-px w-8 bg-black" />
        <NumBox value={score ?? null} max={10} colour={colour} label={`${name} score`} />
      </span>
    </div>
  );
}

/** The Life Purpose card on the power-words step (Figma "image 41"): not a link, it is for reading. */
export function PurposeCard() {
  const { lifePurpose: lp } = useApp();
  return (
    <div className="relative h-purpose-banner w-content shrink-0 overflow-hidden rounded-24 shadow-image">
      <Image src="/images/life-purpose/purpose-sky.webp" alt="" fill sizes="329px" className="object-cover object-[50%_20%]" />
      <div className="absolute inset-x-16 top-16">
        <p className="font-heading text-h3 text-white">Life Purpose</p>
        <p className="mt-4 text-caption text-white">The thread through every moment when I’m most alive</p>
      </div>
      <div className="absolute inset-x-16 bottom-16 rounded-12 bg-white/10 p-16 backdrop-blur-[2px]">
        {lp.statement.trim() ? (
          <StatementText statement={lp.statement} />
        ) : (
          <p className="text-body text-white">Your life purpose will appear here once you have written it.</p>
        )}
      </div>
    </div>
  );
}
