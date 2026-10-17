"use client";

import Image from "next/image";
import Link from "next/link";
import PopUpSheet from "@/components/PopUpSheet";
import BackButton from "@/components/shell/BackButton";
import { lifePurposeFaqs } from "@/lib/faq";
import { clusterColour, powerWordPieces, statementParts } from "@/lib/lifePurpose";

// Building blocks for the Life Purpose screens (Figma "LP - …" frames).

/**
 * Back (left) and search (right) 40px white circles at y 70, plus the FAQ help control. Back is
 * always there: `backHref` fixes where it goes, otherwise the screen's parent in the flow.
 */
export function LpHeader({ backHref, search, onHelp }: { backHref?: string; search?: boolean; onHelp?: () => void }) {
  return (
    <div className="pt-header-top">
    <div className="flex h-icon-button items-center justify-between">
      <BackButton href={backHref} />
      <span className="flex items-center gap-8">
        {onHelp && <HelpButton onClick={onHelp} />}
        {search && (
          <button type="button" aria-label="Search" className="flex size-icon-button items-center justify-center rounded-pill bg-white">
            <Image src="/icons/search.svg" alt="" width={24} height={24} />
          </button>
        )}
      </span>
    </div>
    </div>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Life purpose FAQs" onClick={onClick} className="flex size-[36px] items-center justify-center">
      <Image src="/icons/help-circle.svg" alt="" width={30} height={30} />
    </button>
  );
}

/** Figma "LP - Key Words": a pill, white with ink text, or filled with a cluster colour. */
export function WordPill({
  word,
  fill,
  large,
  tilt = 0,
  onClick,
  dim,
}: {
  word: string;
  fill?: string; // bg class
  large?: boolean;
  tilt?: number;
  onClick?: () => void;
  dim?: boolean;
}) {
  const cls = `inline-flex h-[39px] items-center whitespace-nowrap rounded-pill border border-cancel px-16 ${
    fill ? `${fill} text-white` : "bg-white text-ink-80"
  } ${large ? "text-body-large" : "text-body"} ${dim ? "opacity-50" : ""}`;
  const style = { transform: `rotate(${tilt}deg)` };
  return onClick ? (
    <button type="button" aria-pressed={!!fill} onClick={onClick} className={cls} style={style}>
      {word}
    </button>
  ) : (
    <span className={cls} style={style}>
      {word}
    </span>
  );
}

/** The statement as on the Draft / Final cards: the fixed frame words quieter, the client's words bold. */
/**
 * The statement, the client's own words emphasised. With `powerWords` (cluster names, in cluster
 * order) and `onWord`, each power word in it is filled with its cluster's colour and can be tapped.
 */
export function StatementText({
  statement,
  powerWords,
  onWord,
}: {
  statement: string;
  powerWords?: string[];
  onWord?: (cluster: number) => void;
}) {
  return (
    <p className="text-white">
      {statementParts(statement).map((part, i) => (
        <span key={i} className={part.mine ? "font-semibold text-body" : "text-body-medium text-white/50"}>
          {i > 0 ? " " : ""}
          {powerWords && onWord
            ? powerWordPieces(part.text, powerWords).map((p, j) =>
                p.cluster === -1 ? (
                  p.text
                ) : (
                  <button
                    key={j}
                    type="button"
                    onClick={() => onWord(p.cluster)}
                    className={`rounded-4 px-2 text-white ${clusterColour(p.cluster).solid}`}
                  >
                    {p.text}
                  </button>
                ),
              )
            : part.text}
        </span>
      ))}
    </p>
  );
}

/** Glass panel the statement sits in (white/10 on the photo). */
export function StatementGlass(props: Parameters<typeof StatementText>[0]) {
  return (
    <div className="rounded-12 bg-white/10 p-16 backdrop-blur-[2px]">
      <StatementText {...props} />
    </div>
  );
}

/** Map node: a 68px dashed ring around a 60px Primary/100 circle with a green icon. */
export function MapNode({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="flex size-node items-center justify-center rounded-pill border-hairline border-dashed border-primary-600">
      <span className="flex size-node-inner items-center justify-center rounded-pill bg-primary-100">
        <Image src={icon} alt="" width={32} height={32} />
      </span>
    </Link>
  );
}

/** Checklist row: 20px circle (Primary/500 with a tick when on), Body Small grey label. */
export function CheckRow({
  label,
  on,
  onClick,
  dark,
}: {
  label: string;
  on: boolean;
  onClick?: () => void;
  dark?: boolean; // "Make it real" uses black text
}) {
  const circle = on ? (
    <span className="flex size-check shrink-0 items-center justify-center rounded-pill bg-primary-500">
      <Image src="/icons/check.svg" alt="" width={14} height={14} />
    </span>
  ) : (
    <span className="size-check shrink-0 rounded-pill border border-line bg-white" />
  );
  const text = <span className={`flex-1 text-left text-body-small ${dark ? "text-black" : "text-ink-50"}`}>{label}</span>;
  return onClick ? (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick} className="flex w-full items-center gap-8">
      {circle}
      {text}
    </button>
  ) : (
    <div role="checkbox" aria-checked={on} aria-readonly className="flex w-full items-center gap-8">
      {circle}
      {text}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
}) {
  const cls =
    "flex w-full items-center justify-center rounded-8 bg-primary-600 py-16 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50";
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** FAQ pop-up (Figma "LP - FAQs"): each question a heading with its answer under it. */
export function FaqPopup({ onClose }: { onClose: () => void }) {
  return (
    <PopUpSheet title="FAQs" onClose={onClose}>
      <div className="flex flex-col gap-8">
        {lifePurposeFaqs.map((f) => (
          <section key={f.question} className="flex flex-col gap-4 rounded-24 bg-white p-16">
            <h3 className="text-caption text-ink-75">{f.question}</h3>
            <p className="text-body-small text-black">{f.answer}</p>
          </section>
        ))}
      </div>
    </PopUpSheet>
  );
}
