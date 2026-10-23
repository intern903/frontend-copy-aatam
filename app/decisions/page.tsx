"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import { DecisionCard } from "@/components/decisions/ui";
import { Chip } from "@/components/engine/ui";
import { useHydrated } from "@/components/values/ui";
import { lifeAreas, type LifeAreaId } from "@/lib/data";
import { STATUS_STYLE, type Decision, type DecisionStatus } from "@/lib/decisions";
import { createDecision, useApp } from "@/lib/store";
import { areaColour } from "@/lib/visions";

// Figma "DT- Screen" (1653:9605): every decision, newest first, coloured by where it stands —
// Draft (blue), Completed but not yet taken (yellow), Decided (green). The funnel narrows by
// status and life area (its badge counts what is set); the plus starts a new decision.

type Filters = { status: DecisionStatus[]; areas: LifeAreaId[] };
const NONE: Filters = { status: [], areas: [] };
const STATUSES: DecisionStatus[] = ["draft", "completed", "decided"];

const matches = (d: Decision, f: Filters) =>
  (f.status.length === 0 || f.status.includes(d.status)) && (f.areas.length === 0 || (!!d.lifeArea && f.areas.includes(d.lifeArea)));

export default function DecisionsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { decisions } = useApp();
  const [filters, setFilters] = useState<Filters>(NONE);
  const [filtering, setFiltering] = useState(false);
  const shown = decisions.filter((d) => matches(d, filters));
  const badge = filters.status.length + filters.areas.length;

  return (
    <main className="flex flex-col gap-20 px-32 pb-40 pt-[82px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-h1 text-black">Decisions</h1>
          <span className="flex items-center">
            <button type="button" aria-label="Filter decisions" onClick={() => setFiltering(true)} className="relative flex size-32 items-center justify-center">
              <Image src="/icons/filter.svg" alt="" width={24} height={24} />
              {badge > 0 && (
                <span className="absolute right-0 top-0 flex size-16 items-center justify-center rounded-8 bg-primary-600 font-mono text-micro-data text-white">{badge}</span>
              )}
            </button>
            <button
              type="button"
              aria-label="New decision"
              onClick={() => router.push(`/decisions/${createDecision()}/flow?step=1`)}
              className="flex size-32 items-center justify-center"
            >
              <Image src="/icons/plus-circle.svg" alt="" width={24} height={24} />
            </button>
          </span>
        </div>
        <p className="text-body-small text-ink-brown">Every choice I’ve made, and why</p>
      </div>

      {hydrated && decisions.length === 0 ? (
        // Empty state: a line, not a blank page.
        <p className="text-body-small text-ink-60">
          Weigh a choice against your life purpose and your values, and keep a record of why you chose it. Tap the plus to start.
        </p>
      ) : hydrated && shown.length === 0 ? (
        <p className="text-body-small text-ink-60">No decisions match these filters.</p>
      ) : (
        <div className="flex flex-col gap-12">
          {shown.map((d) => (
            <DecisionCard key={d.id} d={d} href={`/decisions/${d.id}`} />
          ))}
        </div>
      )}

      {filtering && (
        <FilterSheet
          decisions={decisions}
          initial={filters}
          onClose={() => setFiltering(false)}
          onApply={(f) => {
            setFilters(f);
            setFiltering(false);
          }}
        />
      )}
    </main>
  );
}

function FilterSheet({ decisions, initial, onClose, onApply }: { decisions: Decision[]; initial: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [f, setF] = useState(initial);
  const toggle = <K extends keyof Filters>(key: K, value: Filters[K][number]) =>
    setF((prev) => {
      const list = prev[key] as Filters[K][number][];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  const count = decisions.filter((d) => matches(d, f)).length;
  const usedAreas = lifeAreas.filter((a) => decisions.some((d) => d.lifeArea === a.id));

  return (
    <PopUpSheet title="Filter Decisions" onClose={onClose} variant="bottom">
      <Group title="Status">
        {STATUSES.map((s) => (
          <Chip key={s} label={STATUS_STYLE[s].label} count={decisions.filter((d) => d.status === s).length} on={f.status.includes(s)} onClick={() => toggle("status", s)} />
        ))}
      </Group>
      {usedAreas.length > 0 && (
        <Group title="Life area">
          {usedAreas.map((a) => (
            <Chip
              key={a.id}
              label={a.name}
              dot={areaColour(a.id).solid}
              count={decisions.filter((d) => d.lifeArea === a.id).length}
              on={f.areas.includes(a.id)}
              onClick={() => toggle("areas", a.id)}
            />
          ))}
        </Group>
      )}
      <div className="flex gap-8">
        <button type="button" onClick={() => setF(NONE)} className="rounded-8 bg-cancel px-32 py-16 text-button-cta text-cancel-text">
          Clear All
        </button>
        <button type="button" onClick={() => onApply(f)} className="flex-1 rounded-8 bg-primary-600 py-16 text-button-cta text-white">
          Show {count} Decision{count === 1 ? "" : "s"}
        </button>
      </div>
    </PopUpSheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-body-small text-black">{title}</p>
      <div className="flex flex-wrap gap-8">{children}</div>
    </div>
  );
}
