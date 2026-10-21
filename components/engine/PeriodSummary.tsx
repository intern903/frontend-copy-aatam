import type { LifeCode, Outcome } from "@/lib/data";
import { areaColour, areaName } from "@/lib/visions";
import LifeCodeCard from "./LifeCodeCard";
import { DotTags, Ring } from "./ui";

// The parts of a period's card in Figma "RG - Prior", shared with the close's summary and the
// well-being results: the three rings, "My life codes emerged", "My Outcomes" and "My well-being".

/** Overall %, Priority % and the well-being average, side by side and the same size. */
export function ScoreRings({ items }: { items: { label: string; value: number; text: string }[] }) {
  return (
    <div className="flex items-center gap-20 p-8">
      {items.map((it) => (
        <div key={it.label} className="flex flex-1 flex-col items-center gap-8">
          <Ring value={it.value}>
            <span className="font-mono text-stat-large text-black">{it.text}</span>
          </Ring>
          <span className="text-body-medium text-ink-75">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-caption text-black">{label}</p>
      {children}
    </div>
  );
}

export function EmergedCodes({ codes }: { codes: LifeCode[] }) {
  return (
    <Labelled label="My life codes emerged">
      {codes.length === 0 ? (
        <p className="text-body-small text-ink-60">None from this period. That’s fine: not every outcome brings one.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {codes.map((c) => (
            <LifeCodeCard key={c.id} code={c} href={`/life-code/${c.id}`} compact />
          ))}
        </div>
      )}
    </Labelled>
  );
}

/** A small card with a strip of the area's colour down its left edge, scrolled sideways. */
function Strip({ colour, children }: { colour: string; children: React.ReactNode }) {
  return (
    // Outlined all round in the area's colour, with the wider strip down the left (Figma "RG - Prior").
    <div className={`min-w-0 rounded-8 border pl-4 ${colour} ${colour.replace("bg-", "border-")}`}>
      <div className="flex h-full flex-col justify-center rounded-8 bg-white px-16 py-12">{children}</div>
    </div>
  );
}

export function OutcomeStrips({ outcomes }: { outcomes: Outcome[] }) {
  return (
    <Labelled label="My Outcomes">
      {/* Stacked, full width: every card shows whole, with its coloured edge and outline (they used
          to scroll sideways and were cut off at the card's edge). */}
      <div className="flex flex-col gap-8">
        {outcomes.map((o) => (
          <Strip key={o.id} colour={areaColour(o.lifeArea).solid}>
            <DotTags tags={[areaName(o.lifeArea), o.type]} />
            <p className="text-body-small text-black">{o.text}</p>
            <p className="text-caption text-ink-60">
              {o.done ? "Done" : "Not done"}
              {o.type === "Being" && o.score !== null ? ` · ${o.score}/10` : ""}
            </p>
          </Strip>
        ))}
      </div>
    </Labelled>
  );
}

const STRIP_TONES = ["bg-primary-500", "bg-pink-500", "bg-blue-500", "bg-yellow-500"];

export function WellbeingStrips({ scores }: { scores: Record<string, number> }) {
  return (
    <Labelled label="My well-being">
      <div className="grid grid-cols-2 gap-8">
        {Object.entries(scores).map(([quality, score], i) => (
          <Strip key={quality} colour={STRIP_TONES[i % STRIP_TONES.length]}>
            <span className="flex items-center justify-between gap-8">
              <span className="min-w-0 truncate text-body-small text-black">{quality}</span>
              <span className="font-mono text-h4 text-black">{score}/10</span>
            </span>
          </Strip>
        ))}
      </div>
    </Labelled>
  );
}
