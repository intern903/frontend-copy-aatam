"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import PopUpSheet from "@/components/PopUpSheet";
import LifeCodeCard from "@/components/engine/LifeCodeCard";
import { Chip, EngineFrame, EngineTop, SectionHead } from "@/components/engine/ui";
import { useHydrated } from "@/components/values/ui";
import { lifeAreas, type LifeAreaId, type LifeCode, type LifeCodeSource, type LifeCodeType } from "@/lib/data";
import { useApp } from "@/lib/store";
import { areaColour } from "@/lib/visions";

// Figma "RG - Guide" (My Life Codes) and "RG - Filter Guidelines".
// Five statements at a time with the count, then the pager ("1-5 out of 14"). The filter pop-up
// narrows by life area, by micro or macro, by where it came from, and by status; all
// multi-select and usable together. Default view: every active life code.
// The app never ranks or picks life codes: the list is in the order they were written.

const PAGE = 5;
const SOURCES: LifeCodeSource[] = ["My Outcomes", "My Well-Being", "Session", "My Vision", "Added by hand", "Chat"];

type Filters = { areas: LifeAreaId[]; types: LifeCodeType[]; sources: LifeCodeSource[]; status: LifeCode["status"][] };
const DEFAULT: Filters = { areas: [], types: [], sources: [], status: ["active"] };

const matches = (c: LifeCode, f: Filters) =>
  (f.areas.length === 0 || c.allLifeAreas || c.lifeAreas.some((a) => f.areas.includes(a))) &&
  (f.types.length === 0 || f.types.includes(c.type)) &&
  (f.sources.length === 0 || f.sources.includes(c.addedThrough)) &&
  (f.status.length === 0 || f.status.includes(c.status));

/** How many filters are set beyond the default view: the badge on the funnel. */
const activeCount = (f: Filters) =>
  f.areas.length + f.types.length + f.sources.length + (f.status.join() === "active" ? 0 : f.status.length);

export default function LifeCodesPage() {
  const hydrated = useHydrated();
  const { lifeCodes } = useApp();
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [page, setPage] = useState(0);
  const [filtering, setFiltering] = useState(false);

  const shown = lifeCodes.filter((c) => matches(c, filters));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages - 1);
  const slice = shown.slice(current * PAGE, current * PAGE + PAGE);
  const badge = activeCount(filters);
  const total = lifeCodes.filter((c) => c.status === "active").length;

  return (
    <EngineFrame top={<EngineTop search />}>
      <div className="flex flex-col gap-16">
        <SectionHead
          title="My Life Codes"
          sub={hydrated ? `${total} life code${total === 1 ? "" : "s"}` : undefined}
          right={
            <span className="flex items-center gap-4">
              <button type="button" aria-label="Filter life codes" onClick={() => setFiltering(true)} className="relative flex size-[27px] items-center justify-center rounded-pill bg-white">
                <Image src="/icons/filter.svg" alt="" width={16} height={16} />
                {badge > 0 && (
                  <span className="absolute -top-4 left-[15px] flex size-16 items-center justify-center rounded-8 bg-background-700 font-mono text-micro-data text-white">{badge}</span>
                )}
              </button>
              <Link href="/life-code/new" aria-label="Add a life code" className="flex size-[28px] items-center justify-center rounded-pill bg-white">
                <Image src="/icons/plus-small.svg" alt="" width={16} height={16} />
              </Link>
            </span>
          }
        />

        {hydrated && lifeCodes.length === 0 ? (
          // Empty state: a line, not a 0.
          <p className="text-body-small text-ink-60">
            Your life codes build up as you go: from your outcomes, your well-being and your sessions. You can also add one yourself with the plus.
          </p>
        ) : hydrated && shown.length === 0 ? (
          <p className="text-body-small text-ink-60">No life codes match these filters.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {slice.map((c) => (
              <LifeCodeCard key={c.id} code={c} href={`/life-code/${c.id}`} />
            ))}
          </div>
        )}

        {shown.length > PAGE && (
          <div className="flex items-center justify-end gap-8">
            <span className="text-caption text-ink-50">
              {current * PAGE + 1}-{current * PAGE + slice.length} out of {shown.length}
            </span>
            <span className="flex items-center gap-4">
              <PageButton label="Previous five" dir="left" disabled={current === 0} onClick={() => setPage(current - 1)} />
              <PageButton label="Next five" dir="right" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} />
            </span>
          </div>
        )}
      </div>

      {filtering && (
        <FilterSheet
          codes={lifeCodes}
          initial={filters}
          onClose={() => setFiltering(false)}
          onApply={(f) => {
            setFilters(f);
            setPage(0);
            setFiltering(false);
          }}
        />
      )}
    </EngineFrame>
  );
}

function PageButton({ label, dir, disabled, onClick }: { label: string; dir: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center rounded-16 border ${disabled ? "border-cancel" : "border-background-700"}`}
    >
      {/* Figma's chevrons: #808080 when there is a page that way, #D9D9D9 when there isn't. */}
      <Image
        src={disabled ? "/icons/chevron-left-sm.svg" : "/icons/chevron-right-sm.svg"}
        alt=""
        width={16}
        height={16}
        className={(dir === "left") === !disabled ? "rotate-180" : ""}
      />
    </button>
  );
}

function FilterSheet({ codes, initial, onClose, onApply }: { codes: LifeCode[]; initial: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [f, setF] = useState(initial);
  const toggle = <K extends keyof Filters>(key: K, value: Filters[K][number]) =>
    setF((prev) => {
      const list = prev[key] as Filters[K][number][];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  const count = codes.filter((c) => matches(c, f)).length;
  // Only areas, sources that have at least one life code are offered, each with its count.
  const usedAreas = lifeAreas.filter((a) => codes.some((c) => c.lifeAreas.includes(a.id)));
  const usedSources = SOURCES.filter((s) => codes.some((c) => c.addedThrough === s));

  return (
    <PopUpSheet title="Filter Life Codes" onClose={onClose} variant="bottom">
      <Group title="Life area">
        {usedAreas.map((a) => (
          <Chip
            key={a.id}
            label={a.name}
            dot={areaColour(a.id).solid}
            count={codes.filter((c) => c.lifeAreas.includes(a.id)).length}
            on={f.areas.includes(a.id)}
            onClick={() => toggle("areas", a.id)}
          />
        ))}
      </Group>
      <Group title="Type">
        <Chip label="Micro" count={codes.filter((c) => c.type === "micro").length} on={f.types.includes("micro")} onClick={() => toggle("types", "micro")} />
        <Chip label="Macro" count={codes.filter((c) => c.type === "macro").length} on={f.types.includes("macro")} onClick={() => toggle("types", "macro")} />
      </Group>
      <Group title="Added through">
        {usedSources.map((s) => (
          <Chip key={s} label={s} count={codes.filter((c) => c.addedThrough === s).length} on={f.sources.includes(s)} onClick={() => toggle("sources", s)} />
        ))}
      </Group>
      <Group title="Status">
        <Chip label="Active" on={f.status.includes("active")} onClick={() => toggle("status", "active")} />
        <Chip label="Archived" on={f.status.includes("archived")} onClick={() => toggle("status", "archived")} />
      </Group>
      <div className="flex gap-8">
        <button type="button" onClick={() => setF({ areas: [], types: [], sources: [], status: [] })} className="rounded-8 bg-cancel px-32 py-16 text-button-cta text-cancel-text">
          Clear All
        </button>
        <button type="button" onClick={() => onApply(f)} className="flex-1 rounded-8 bg-primary-600 py-16 text-button-cta text-white">
          Show {count} Life Code{count === 1 ? "" : "s"}
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
