"use client";

import { useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import { EmergedCodes, OutcomeStrips, ScoreRings, WellbeingStrips } from "@/components/engine/PeriodSummary";
import TrendChart from "@/components/engine/TrendChart";
import { Chip, DotTags, EngineFrame, EngineTop, SectionHead } from "@/components/engine/ui";
import { useHydrated } from "@/components/values/ui";
import { averageScore, chipDate, trend } from "@/lib/outcomes";
import { useApp } from "@/lib/store";

// Figma "RG - Prior" and "RG - Trend View", behind the clock icon: past periods newest first
// (date chips), the chosen one's three rings, the life codes that came out of it, its outcomes
// and well-being; then the trend. The trend shows once there are two periods to compare.
// Numbers are stated, never judged: no "best period", no comment on the shape.

export default function PriorPage() {
  const hydrated = useHydrated();
  const { outcomes, wellbeing, lifeCodes } = useApp();
  const past = outcomes.pastPeriods;
  const [chosen, setChosen] = useState(0);
  const [sheet, setSheet] = useState<"qualities" | "outcomes" | null>(null);
  // Well-being lines on the trend: any mix of the average and single qualities, all at once.
  const AVERAGE = "Well-being Average";
  const [shown, setShown] = useState<string[]>([AVERAGE]);
  const toggleLine = (name: string) => setShown((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  const [series, setSeries] = useState({ overall: true, priority: true });

  const points = trend(past, wellbeing.pastScores);
  const qualityNames = Array.from(new Set(wellbeing.pastScores.flatMap((s) => Object.keys(s.scores))));
  const p = past[Math.min(chosen, past.length - 1)];
  const scores = p ? wellbeing.pastScores.find((s) => s.periodId === p.id)?.scores ?? {} : {};
  const wb = p ? averageScore(scores) ?? p.wellbeing : 0;

  if (!hydrated) return null;

  return (
    <EngineFrame top={<EngineTop search />}>
      <div className="flex flex-col gap-16">
        <SectionHead title="My Prior Games" />
        {!p ? (
          <p className="text-body-small text-ink-60">Your past periods will show here after your first close.</p>
        ) : (
          <>
            <div className="-mr-32 flex gap-4 overflow-x-auto pr-32">
              {past.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={i === chosen}
                  onClick={() => setChosen(i)}
                  className={`shrink-0 rounded-pill border-hairline border-background-600 px-12 py-6 ${
                    i === chosen ? "bg-primary-500 text-body-small text-white" : "bg-white text-caption text-ink-75"
                  }`}
                >
                  {chipDate(x.start)} - {chipDate(x.end)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-16 overflow-hidden rounded-24 bg-white px-16 py-12">
              <DotTags tags={[p.label, `${p.outcomes.filter((o) => o.done).length} of ${p.outcomes.length} done`]} />
              <ScoreRings
                items={[
                  { label: "Overall", value: p.overall / 100, text: `${p.overall}%` },
                  { label: "Priority", value: p.priority / 100, text: `${p.priority}%` },
                  { label: "Well-being", value: wb / 10, text: String(wb) },
                ]}
              />
              <EmergedCodes codes={lifeCodes.filter((c) => c.periodId === p.id || p.lifeCodesEmerged.includes(c.id))} />
              <OutcomeStrips outcomes={p.outcomes} />
              {Object.keys(scores).length > 0 && <WellbeingStrips scores={scores} />}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-16">
        <SectionHead title="My Trend View" />
        {points.length < 2 ? (
          <p className="text-body-small text-ink-60">The trend appears once there are two periods to compare.</p>
        ) : (
          <>
            <div className="flex gap-8">
              <PillButton label="My Well-being" count={shown.length} onClick={() => setSheet("qualities")} />
              <PillButton label="My Outcomes" count={Number(series.overall) + Number(series.priority)} onClick={() => setSheet("outcomes")} />
            </div>
            <TrendChart
              points={points}
              showOverall={series.overall}
              showPriority={series.priority}
              lines={shown.map((name) => ({
                label: name,
                values: points.map((pt) => (name === AVERAGE ? pt.wellbeing : pt.scores[name] ?? null)),
              }))}
            />
          </>
        )}
      </div>

      {sheet === "qualities" && (
        <PopUpSheet title="Select my qualities" onClose={() => setSheet(null)} variant="bottom">
          <div className="flex flex-wrap gap-8">
            <Chip label="Average" on={shown.includes(AVERAGE)} onClick={() => toggleLine(AVERAGE)} />
            {qualityNames.map((q) => (
              <Chip key={q} label={q} on={shown.includes(q)} onClick={() => toggleLine(q)} />
            ))}
          </div>
        </PopUpSheet>
      )}
      {sheet === "outcomes" && (
        <PopUpSheet title="Select my outcomes" onClose={() => setSheet(null)} variant="bottom">
          <div className="flex flex-wrap gap-8">
            <Chip label="Overall" on={series.overall} onClick={() => setSeries({ ...series, overall: !series.overall })} />
            <Chip label="Priority" on={series.priority} onClick={() => setSeries({ ...series, priority: !series.priority })} />
          </div>
        </PopUpSheet>
      )}
    </EngineFrame>
  );
}

function PillButton({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-1 items-center justify-center gap-6 rounded-pill border-hairline border-background-600 bg-white px-12 py-6 text-body-small text-black">
      {label}
      <span className="size-2 rounded-2 bg-ink-60" />
      {count}
    </button>
  );
}
