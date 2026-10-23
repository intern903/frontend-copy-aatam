"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AddRow, CtaRow, NumBox, PageTitle, PurposeCard, StepBar, Trail } from "@/components/decisions/ui";
import { LifeAreaCard } from "@/components/settings/LifeAreaImage";
import BackButton from "@/components/shell/BackButton";
import { useHydrated } from "@/components/values/ui";
import { lifeAreas } from "@/lib/data";
import { MAX_VALUES, STEPS, filledChoices, finalScore, groupScore, groups, stepIssue, tone, weightIssue, type Decision } from "@/lib/decisions";
import { removeDecision, updateDecision, useApp } from "@/lib/store";

// The decision flow (Figma "DT - Life Area" → "DT - Final Score"), one step per screen at
// /decisions/<id>/flow?step=1…9. Each step works on a local copy; Next saves it and moves on,
// Back saves and steps back, and Save as Draft saves it where it is and returns to the list
// ("Continue where I left off" picks up on that step). Finishing Importance marks the decision
// Completed. On Final Score, Take Decision Later returns to the list; Take Decision Now records
// the client's choice — the app shows the scores but never picks for them.

export default function DecisionFlowPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <Flow id={params.id} />
    </Suspense>
  );
}

function Flow({ id }: { id: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const stored = useApp().decisions.find((x) => x.id === id);
  // A decision already taken is read on its own page, not reopened; one that is gone (left blank
  // and dropped, or a stale link) goes back to the list.
  useEffect(() => {
    if (!hydrated) return;
    if (!stored) router.replace("/decisions");
    else if (stored.status === "decided") router.replace(`/decisions/${id}`);
  }, [hydrated, stored, id, router]);
  if (!hydrated || !stored || stored.status === "decided") return null;
  return <Editor initial={stored} />;
}

// What a save writes: everything but the id and date (the store stamps the date).
const fields = (d: Decision): Partial<Omit<Decision, "id">> => {
  const rest: Partial<Decision> = { ...d };
  delete rest.id;
  delete rest.date;
  return rest;
};

function Editor({ initial }: { initial: Decision }) {
  const router = useRouter();
  const step = Math.min(STEPS, Math.max(1, Number(useSearchParams().get("step")) || initial.step));
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Decision>) => {
    setD((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const goTo = (n: number, patch: Partial<Decision> = {}) => {
    const next = { ...d, ...patch, step: n };
    setD(next);
    updateDecision(d.id, fields(next));
    setError(null);
    router.push(`/decisions/${d.id}/flow?step=${n}`);
    window.scrollTo(0, 0);
  };

  function onNext(patch: Partial<Decision> = {}) {
    const next = { ...d, ...patch };
    const issue = stepIssue(next, step);
    if (issue) return setError(issue);
    // The choices close up (no gaps) once written, so each choice's scores line up with it.
    if (step === 3) return goTo(4, { ...patch, choices: filledChoices(next) });
    // Scored: the decision is complete and waits to be taken.
    if (step === 8) return goTo(9, { ...patch, status: "completed" });
    goTo(step + 1, patch);
  }

  function onDraft() {
    updateDecision(d.id, { ...fields(d), step, status: "draft" });
    router.push("/decisions");
  }

  function onBack() {
    if (step > 1) return goTo(step - 1);
    // Left before anything was written: nothing to keep.
    if (!d.lifeArea && !d.statement.trim()) removeDecision(d.id);
    else updateDecision(d.id, fields(d));
    router.push("/decisions");
  }

  return (
    <main className="flex flex-col px-32 pb-40 pt-header-top">
      <BackButton onClick={onBack} />
      <div className="mt-24">
        <StepBar step={step} />
      </div>
      <div className="mt-20 flex flex-col gap-20">
        {step > 1 && <Trail d={d} step={step} />}
        {step === 1 && <LifeAreaStep d={d} onPick={(lifeArea) => onNext({ lifeArea })} />}
        {step === 2 && <StatementStep d={d} set={set} />}
        {step === 3 && <ChoicesStep d={d} set={set} />}
        {step === 4 && <PowerWordsStep d={d} set={set} />}
        {step === 5 && <ValuesStep d={d} set={set} onLimit={() => setError(`Choose up to ${MAX_VALUES} values.`)} />}
        {step === 6 && <ParamsStep d={d} set={set} />}
        {step === 7 && <WeightStep d={d} set={set} />}
        {step === 8 && <ImportanceStep d={d} set={set} />}
        {step === 9 && <FinalStep d={d} />}

        {error && (
          <p role="alert" className="text-body-small text-danger">
            {error}
          </p>
        )}
        {step > 1 && step < STEPS && <CtaRow onDraft={onDraft} onNext={() => onNext()} />}
      </div>
    </main>
  );
}

type StepProps = { d: Decision; set: (patch: Partial<Decision>) => void };

/** Figma "DT - Life Area": the twelve life-area tiles; tapping one chooses it and moves on. */
function LifeAreaStep({ d, onPick }: { d: Decision; onPick: (id: Decision["lifeArea"]) => void }) {
  return (
    <>
      <PageTitle title="Life Area" sub="Choose life area of my decision" />
      <div className="grid grid-cols-2 gap-12">
        {lifeAreas.map((a) => (
          <div key={a.id} className={`rounded-24 ${d.lifeArea === a.id ? "ring-2 ring-primary-600 ring-offset-4 ring-offset-background" : ""}`}>
            <LifeAreaCard id={a.id} name={a.name} variant="tile" onOpen={() => onPick(a.id)} />
          </div>
        ))}
      </div>
    </>
  );
}

/** Figma "DT - Statement". */
function StatementStep({ d, set }: StepProps) {
  return (
    <>
      <PageTitle title="Decision Statement" sub="Write decision statement" />
      <label className="flex flex-col gap-16">
        <span className="text-body text-black">Statement</span>
        <textarea
          value={d.statement}
          onChange={(e) => set({ statement: e.target.value })}
          placeholder="I want to take a decision on ..."
          className="h-[125px] resize-none rounded-8 bg-white px-16 py-16 text-body text-black shadow-card-sm outline-none placeholder:text-chat-muted"
        />
      </label>
    </>
  );
}

/** Figma "DT - Choices": two to start, each in its own accent; more with Add Choice. */
function ChoicesStep({ d, set }: StepProps) {
  const change = (i: number, text: string) => set({ choices: d.choices.map((c, j) => (j === i ? text : c)) });
  return (
    <>
      <PageTitle title="Decision Choices" sub="Add choices from which you want to choose" />
      <div className="flex flex-col gap-16">
        <p className="text-body text-black">Choices</p>
        <div className="flex flex-col gap-12">
          {d.choices.map((c, i) => {
            const t = tone(i);
            return (
              <div key={i} className="relative">
                <input
                  value={c}
                  onChange={(e) => change(i, e.target.value)}
                  placeholder={`Choice ${i + 1}`}
                  aria-label={`Choice ${i + 1}`}
                  className={`w-full rounded-8 border-2 px-40 py-12 text-center text-body text-black outline-none placeholder:text-black/60 ${t.soft} ${t.border}`}
                />
                {i >= 2 && (
                  <button
                    type="button"
                    aria-label={`Remove choice ${i + 1}`}
                    onClick={() => set({ choices: d.choices.filter((_, j) => j !== i) })}
                    className="absolute right-12 top-1/2 flex -translate-y-1/2"
                  >
                    <Image src="/icons/x.svg" alt="" width={16} height={16} />
                  </button>
                )}
              </div>
            );
          })}
          <AddRow label="Add Choice" shadow onClick={() => set({ choices: [...d.choices, ""] })} />
        </div>
      </div>
    </>
  );
}

/**
 * A tappable list where picks rise to the top in the order picked, with a darker border (Figma
 * "DT - Choices" power words, "DT - Values"). Colours cycle by each item's place in the full list.
 */
function PickList({ all, picked, onToggle }: { all: string[]; picked: string[]; onToggle: (item: string) => void }) {
  const rest = all.filter((x) => !picked.includes(x));
  return (
    <div className="flex flex-col gap-12">
      {[...picked, ...rest].map((item) => {
        const on = picked.includes(item);
        const t = tone(Math.max(0, all.indexOf(item)));
        return (
          <button
            key={item}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(item)}
            className={`flex items-center justify-center gap-8 rounded-8 border-2 py-12 text-body text-black transition-transform motion-reduce:transition-none ${t.tint} ${
              on ? `${t.strong} shadow-card-sm` : "border-transparent"
            }`}
          >
            {on && (
              <span className={`rounded-pill px-6 font-mono text-data-small text-white ${t.solid}`} aria-label={`priority ${picked.indexOf(item) + 1}`}>
                #{picked.indexOf(item) + 1}
              </span>
            )}
            {item}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Figma "DT - Choices" (Life Purpose): the client's statement, then the power words to pick from.
 * They come from the client's life stories: the power words named in Life Purpose; before those
 * are set, the cluster names they are growing from; before any clusters, the stories' own words.
 */
function storyWords(lp: ReturnType<typeof useApp>["lifePurpose"]) {
  if (lp.powerWords.length) return { words: lp.powerWords, final: true };
  const clusters = lp.clusters.map((c) => c.name.trim()).filter(Boolean);
  if (clusters.length) return { words: clusters, final: false };
  return { words: Array.from(new Set(lp.stories.flatMap((st) => st.keywords.map((k) => k.trim()).filter(Boolean)))), final: false };
}

function PowerWordsStep({ d, set }: StepProps) {
  const { lifePurpose: lp } = useApp();
  const { words, final } = storyWords(lp);
  const all = [...words, ...d.powerWords.filter((w) => !words.includes(w))];
  return (
    <>
      <PageTitle title="Life Purpose" sub="Select power words from your life purpose" />
      <PurposeCard />
      <div className="flex flex-col gap-16">
        <p className="text-body text-black">Power Words</p>
        {!final && all.length > 0 && (
          <p className="-mt-8 text-body-small text-ink-60">From your life stories, until your power words are named in Life Purpose.</p>
        )}
        {all.length ? (
          <PickList
            all={all}
            picked={d.powerWords}
            onToggle={(w) => set({ powerWords: d.powerWords.includes(w) ? d.powerWords.filter((x) => x !== w) : [...d.powerWords, w] })}
          />
        ) : (
          <p className="text-body-small text-ink-60">Your power words appear here once your life stories are in. You can go on without them.</p>
        )}
      </div>
    </>
  );
}

/** Figma "DT - Values": up to five of the client's own values, in the order they matter. */
function ValuesStep({ d, set, onLimit }: StepProps & { onLimit: () => void }) {
  const { values } = useApp();
  const mine = [...values.selected.filter((t) => values.final.includes(t.id)).map((t) => t.name), ...values.added];
  const all = [...mine, ...d.values.filter((v) => !mine.includes(v))];
  return (
    <>
      <PageTitle title="Values" sub={`Select up to ${MAX_VALUES} values in priority order`} />
      <p className="-mt-8 text-body-small text-ink-60">Tap the one that matters most first: it becomes #1. Tap again to take it out.</p>
      <div className="flex flex-col gap-16">
        <p className="text-body text-black">Values</p>
        {all.length ? (
          <PickList
            all={all}
            picked={d.values}
            onToggle={(v) => {
              if (d.values.includes(v)) return set({ values: d.values.filter((x) => x !== v) });
              if (d.values.length >= MAX_VALUES) return onLimit();
              set({ values: [...d.values, v] });
            }}
          />
        ) : (
          <p className="text-body-small text-ink-60">Your values appear here once you’ve found them in Values & Qualities. You can go on without them.</p>
        )}
      </div>
    </>
  );
}

/** Figma "DT - Other Parameters": the client's own parameters, each with optional sub parameters. */
function ParamsStep({ d, set }: StepProps) {
  const setParams = (params: Decision["params"], reset = false) =>
    // Removing a parameter renumbers the ones after it, so their weightages and scores start over.
    set(reset ? { params, weights: dropOwn(d.weights), scores: d.scores.map(dropOwn) } : { params });
  const edit = (i: number, patch: Partial<Decision["params"][number]>) => setParams(d.params.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <>
      <PageTitle title="Other Parameters" sub="Add other parameters for your decision (optional)" />
      {d.params.map((p, i) => {
        const t = tone(i);
        return (
          <div key={i} className="flex flex-col gap-12">
            <div className="relative">
              <input
                value={p.name}
                onChange={(e) => edit(i, { name: e.target.value })}
                placeholder={`Parameter ${i + 1}`}
                aria-label={`Parameter ${i + 1}`}
                className={`w-full rounded-8 border-2 px-40 py-12 text-center text-body text-black outline-none placeholder:text-black/60 ${t.tint} ${t.border}`}
              />
              <button
                type="button"
                aria-label={`Remove parameter ${i + 1}`}
                onClick={() => setParams(d.params.filter((_, j) => j !== i), true)}
                className="absolute right-12 top-1/2 flex -translate-y-1/2"
              >
                <Image src="/icons/x.svg" alt="" width={16} height={16} />
              </button>
            </div>
            {p.subs.map((s, j) => (
              <SubRow key={j}>
                <input
                  value={s}
                  onChange={(e) => edit(i, { subs: p.subs.map((x, k) => (k === j ? e.target.value : x)) })}
                  placeholder={`Sub Parameter ${j + 1}`}
                  aria-label={`${p.name || `Parameter ${i + 1}`}, sub parameter ${j + 1}`}
                  className={`min-w-0 flex-1 rounded-8 py-12 text-center text-body text-black outline-none placeholder:text-black/60 ${t.soft}`}
                />
              </SubRow>
            ))}
            <SubRow>
              <AddRow label="Add Sub Parameter" onClick={() => edit(i, { subs: [...p.subs, ""] })} />
            </SubRow>
          </div>
        );
      })}
      <AddRow label="Add Parameter" onClick={() => setParams([...d.params, { name: "", subs: [] }])} />
    </>
  );
}

const dropOwn = (r: Record<string, number>) => Object.fromEntries(Object.entries(r).filter(([k]) => !/^p\d/.test(k)));

function SubRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-8 pl-8">
      <span aria-hidden className="w-16 shrink-0 border-t border-black" />
      {children}
    </div>
  );
}

/** Figma "DT - Weightage": a % per parameter (adding to 100) and per sub-item (adding to its parameter). */
function WeightStep({ d, set }: StepProps) {
  const gs = groups(d);
  const total = gs.reduce((sum, g) => sum + (d.weights[g.key] ?? 0), 0);
  const setW = (key: string, v: number | undefined) => {
    const weights = { ...d.weights };
    if (v === undefined) delete weights[key];
    else weights[key] = v;
    set({ weights });
  };
  return (
    <>
      <PageTitle
        title="Weightage"
        sub="Total weightage of all parameters must be 100% & total of sub parameters must match the weightage of that parameter."
      />
      <p className={`self-end font-mono text-data-small ${total === 100 && !weightIssue(d) ? "text-primary-700" : "text-ink-60"}`}>Total {total}% of 100%</p>
      <div className="flex flex-col gap-12">
        {gs.map((g, gi) => {
          const t = tone(gi);
          return (
            <div key={g.key} className={`flex flex-col gap-12 rounded-8 border-2 p-16 ${t.soft} ${t.border}`}>
              <div className="flex items-center justify-between gap-8">
                <span className={`min-w-0 text-body-large ${t.text}`}>{g.name}</span>
                <Percent>
                  <NumBox value={d.weights[g.key]} onChange={(v) => setW(g.key, v)} max={100} colour={t.solid} label={`${g.name} weightage`} />
                  <span className={`text-body ${t.text}`}>%</span>
                </Percent>
              </div>
              {g.items.length > 0 && (
                <>
                  <span className={`border-t ${t.border}`} />
                  <div className="flex flex-col gap-8">
                    {g.items.map((it) => (
                      <div key={it.key} className="flex items-center justify-between gap-8 pl-4">
                        <span className={`min-w-0 text-body ${t.text}`}>{it.name}</span>
                        <Percent>
                          <NumBox value={d.weights[it.key]} onChange={(v) => setW(it.key, v)} max={100} colour={t.solid} label={`${it.name} weightage`} />
                          <span className={`text-body ${t.text}`}>%</span>
                        </Percent>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Percent({ children }: { children: React.ReactNode }) {
  return <span className="flex shrink-0 items-center gap-4">{children}</span>;
}

/**
 * Figma "DT - Importance": one card per choice, side by side. Each sub-item (or a parameter with
 * none) gets a 1–10 score; a parameter's own score is worked out from its items, by weightage.
 */
function ImportanceStep({ d, set }: StepProps) {
  const gs = groups(d);
  const setS = (c: number, key: string, v: number | undefined) => {
    const scores = filledChoices(d).map((_, i) => ({ ...(d.scores[i] ?? {}) }));
    if (v === undefined) delete scores[c][key];
    else scores[c][key] = v;
    set({ scores });
  };
  return (
    <>
      <PageTitle title="Importance" sub="Give each parameter and sub parameter score between 1-10, according to choice." />
      <div className="-mr-32 flex snap-x items-start gap-12 self-stretch overflow-x-auto pr-32">
        {filledChoices(d).map((choice, c) => {
          const t = tone(c);
          return (
            <section key={c} className={`flex w-content shrink-0 snap-start flex-col gap-20 rounded-12 border-2 p-20 ${t.soft} ${t.border}`}>
              <div className="flex flex-col gap-12">
                <h3 className="font-heading text-h4 text-black">{choice}</h3>
                <span className="border-t border-black/50" />
              </div>
              {gs.map((g) => (
                <div key={g.key} className={`flex flex-col gap-12 rounded-8 border-2 bg-white p-16 ${t.border}`}>
                  <div className="flex items-center justify-between gap-8">
                    <span className="min-w-0 text-body-large text-black">{g.name}</span>
                    {g.items.length ? (
                      <NumBox value={groupScore(d, c, g)} max={10} colour={t.solid} label={`${g.name} score for ${choice}`} />
                    ) : (
                      <NumBox value={d.scores[c]?.[g.key]} onChange={(v) => setS(c, g.key, v)} max={10} colour={t.solid} label={`${g.name} score for ${choice}`} />
                    )}
                  </div>
                  {g.items.length > 0 && (
                    <>
                      <span className="border-t border-black/50" />
                      <div className="flex flex-col gap-8">
                        {g.items.map((it) => (
                          <div key={it.key} className="flex items-center justify-between gap-8 pl-4">
                            <span className="min-w-0 text-body text-black">{it.name}</span>
                            <NumBox value={d.scores[c]?.[it.key]} onChange={(v) => setS(c, it.key, v)} max={10} colour={t.solid} label={`${it.name} score for ${choice}`} />
                          </div>
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
    </>
  );
}

/**
 * Figma "DT - Final Score": each choice's score out of 10. Tapping one marks it; Take Decision Now
 * records it. Until one is marked, Take Decision Later sits beside it and returns to the list.
 */
function FinalStep({ d }: { d: Decision }) {
  const router = useRouter();
  const [pick, setPick] = useState<number | null>(d.winner);
  const later = () => {
    updateDecision(d.id, { ...fields(d), step: STEPS, status: "completed" });
    router.push("/decisions");
  };
  const now = () => {
    if (pick === null) return;
    updateDecision(d.id, { ...fields(d), step: STEPS, status: "decided", winner: pick });
    router.push(`/decisions/${d.id}`);
  };
  return (
    <>
      <PageTitle title="Final Score" sub="According to my response, these are my choice wise final scores out of 10. Take decision." />
      <div className="flex flex-col gap-16 rounded-12 bg-primary-100 p-20 shadow-card-sm">
        <p className="text-body-large text-black">{d.statement}</p>
        {filledChoices(d).map((choice, c) => {
          const t = tone(c);
          const on = pick === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => setPick(c)}
              className={`flex items-end justify-between gap-8 rounded-12 border-2 p-20 text-left ${on ? `${t.solid} ${t.strong} text-white` : `${t.tint} border-transparent text-black`}`}
            >
              <span className="flex flex-col gap-4">
                <span className="font-heading text-display">{finalScore(d, c) ?? "–"}</span>
                <span className="text-body-small">{choice}</span>
              </span>
              <span className="flex size-32 shrink-0 items-center justify-center rounded-pill bg-white">
                {on && <Image src="/icons/check.svg" alt="" width={20} height={20} />}
              </span>
            </button>
          );
        })}
      </div>
      {pick === null ? (
        <div className="flex gap-12">
          <button type="button" onClick={later} className="flex-1 rounded-8 bg-cancel py-12 text-button-cta text-cancel-text">
            Take Decision Later
          </button>
          <button type="button" disabled className="flex-1 rounded-8 bg-primary-600 py-12 text-button-cta text-white opacity-50">
            Take Decision Now
          </button>
        </div>
      ) : (
        <button type="button" onClick={now} className="w-full rounded-8 bg-primary-600 py-12 text-button-cta text-white">
          Take Decision Now
        </button>
      )}
    </>
  );
}
