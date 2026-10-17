import Link from "next/link";
import type { LifeCode } from "@/lib/data";
import { areaColour, areaName } from "@/lib/visions";
import { DotTags } from "./ui";

// Figma "RG - Guide" list rows and "My life codes emerged" (RG - Prior): the statement on the
// soft colour of its life area, a dot in the strong colour, then its tags. The colour follows
// the life area app-wide; a code for all life areas, or several, takes the brand green.

export function lifeCodeColour(code: LifeCode) {
  return !code.allLifeAreas && code.lifeAreas.length === 1 ? areaColour(code.lifeAreas[0]) : { solid: "bg-primary-500", soft: "bg-primary-100" };
}

export function lifeCodeAreas(code: LifeCode) {
  if (code.allLifeAreas) return "All life areas";
  return code.lifeAreas.map(areaName).join(", ");
}

/** Macro · Family · My Outcomes */
export function lifeCodeTags(code: LifeCode) {
  return [code.type === "macro" ? "Macro" : "Micro", lifeCodeAreas(code), code.addedThrough].filter(Boolean);
}

export default function LifeCodeCard({ code, href, compact }: { code: LifeCode; href?: string; compact?: boolean }) {
  const { solid, soft } = lifeCodeColour(code);
  const body = (
    <>
      <span className={`${compact ? "text-body-medium" : "text-body"} text-black`}>{code.statement}</span>
      <span className="flex items-center gap-8">
        <span className={`size-8 shrink-0 rounded-4 ${solid}`} />
        <DotTags tags={compact ? lifeCodeTags(code).slice(0, 2) : lifeCodeTags(code)} />
      </span>
    </>
  );
  const cls = `flex w-full flex-col ${compact ? "gap-2" : "gap-4"} rounded-24 px-16 py-12 text-left ${soft} ${
    code.status === "archived" ? "opacity-50" : ""
  }`;
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
