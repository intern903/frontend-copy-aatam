"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AREA,
  AREAS,
  CHAPTERS,
  EXPLORE,
  OPT,
  OWN_GOAL,
  byScoreAscending,
  coachedYes,
  firstName,
  firstObstacle,
  focusList,
  listJoin,
  minutesLeft,
  withOwn,
  type CifState,
} from "@/lib/cif";
import type { CifAnswers, LifeAreaId } from "@/lib/data";
import { cifEdit, cifNext, cifNextAfter, setCifAnswers, setFocusAreas, setLifeAreaScore, updateUser, useApp } from "@/lib/store";
import Wheel from "./Wheel";
import {
  Actions,
  CheckCard,
  ChoiceCard,
  ErrorText,
  FieldLabel,
  Meta,
  QuestionHead,
  SpecialCard,
  TextArea,
  TextInput,
} from "./ui";

type Props = { step: string; s: CifState; onSubmit: () => void };

// Errors: each message renders directly under the field it belongs to (the field points at it
// with aria-describedby), and when Continue finds something missing, focus moves to that field.
// Option groups take focus as a whole (tabIndex -1).
function useFieldError() {
  const [error, setError] = useState("");
  const field = useRef<HTMLElement | null>(null);
  const fail = (message: string, target?: HTMLElement | null) => {
    setError(message);
    // The field is already on screen, so focus it now (not on a later frame, which a
    // background tab may never run).
    (target ?? field.current)?.focus();
  };
  return { error, setError, fail, field };
}
const ERR = "cif-error";
const describedBy = (error: string, id = ERR) => (error ? id : undefined);

const set = (patch: Partial<CifAnswers>) => setCifAnswers(patch);
const filled = (v: string) => v.trim().length > 0;

// ---------- generic question types ----------

type Option = string | { label: string; save: string };
const labelOf = (o: Option) => (typeof o === "string" ? o : o.label);
const saveOf = (o: Option) => (typeof o === "string" ? o : o.save);

function PickOne({
  title,
  helper,
  options,
  value,
  onPick,
  own,
  skippable,
}: {
  title: string;
  helper?: string;
  options: Option[];
  value: string | null;
  onPick: (v: string | null) => void;
  own?: { placeholder: string; value: string; onChange: (v: string) => void };
  skippable?: boolean;
}) {
  const { error, setError, fail, field } = useFieldError();
  const answered = value !== null || (!!own && filled(own.value));
  return (
    <>
      <QuestionHead title={title} helper={helper} />
      <div
        ref={(el) => {
          field.current = el;
        }}
        tabIndex={-1}
        role="group"
        aria-labelledby="qtitle"
        aria-describedby={describedBy(error)}
        className="mt-16 flex flex-col gap-8 outline-none"
      >
        {options.map((o) => (
          <ChoiceCard
            key={saveOf(o)}
            label={labelOf(o)}
            selected={value === saveOf(o) && !(own && filled(own.value))}
            onClick={() => {
              setError("");
              onPick(saveOf(o));
              own?.onChange("");
              cifNextAfter(220); // single choice moves on by itself (once, however many taps)
            }}
          />
        ))}
      </div>
      <ErrorText id={ERR} message={error} />
      {own && (
        <div className="mt-16">
          <TextInput
            aria-label={own.placeholder}
            placeholder={own.placeholder}
            value={own.value}
            onChange={(e) => {
              setError("");
              own.onChange(e.target.value);
              if (filled(e.target.value)) onPick(null);
            }}
          />
        </div>
      )}
      <Actions
        onNext={() => (answered || skippable ? cifNext() : fail("Pick one to continue."))}
        onSkip={skippable ? cifNext : undefined}
      />
    </>
  );
}

function PickMany({
  title,
  helper,
  options,
  values,
  onChange,
  max,
  own,
  none,
  required = true,
}: {
  title: string;
  helper?: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
  own?: { placeholder: string; value: string; onChange: (v: string) => void };
  none?: { label: string; value: boolean; onChange: (v: boolean) => void };
  required?: boolean;
}) {
  const { error, setError, fail, field } = useFieldError();
  // A "pick up to" message from the own-words box sits under that box instead.
  const [ownError, setOwnError] = useState("");
  const chips = options.length > 8;
  const ownCount = own && filled(own.value) ? 1 : 0;
  const count = values.length + ownCount + (none?.value ? 1 : 0);

  function toggle(o: string) {
    setError("");
    if (values.includes(o)) return onChange(values.filter((x) => x !== o));
    if (max && values.length + ownCount >= max) return setError(`Pick up to ${max}. Untick one to swap.`);
    onChange([...values, o]);
    none?.onChange(false);
  }

  return (
    <>
      <QuestionHead title={title} helper={helper} />
      <div
        ref={(el) => {
          field.current = el;
        }}
        tabIndex={-1}
        role="group"
        aria-labelledby="qtitle"
        aria-describedby={describedBy(error)}
        className={`mt-16 outline-none ${chips ? "flex flex-wrap gap-8" : "flex flex-col gap-8"}`}
      >
        {options.map((o) => (
          <CheckCard key={o} label={o} chip={chips} selected={values.includes(o)} onClick={() => toggle(o)} />
        ))}
        {none && (
          // "None of these" clears every other tag.
          <CheckCard
            label={none.label}
            chip={chips}
            selected={none.value}
            onClick={() => {
              setError("");
              if (!none.value) onChange([]);
              none.onChange(!none.value);
            }}
          />
        )}
      </div>
      <ErrorText id={ERR} message={error} />
      {own && (
        <div className="mt-16">
          <TextInput
            aria-label={own.placeholder}
            placeholder={own.placeholder}
            value={own.value}
            aria-describedby={describedBy(ownError, "cif-own-error")}
            onChange={(e) => {
              const v = e.target.value;
              if (max && filled(v) && !filled(own.value) && values.length >= max) {
                setOwnError(`Pick up to ${max}. Untick one to swap.`);
                return;
              }
              setOwnError("");
              setError("");
              own.onChange(v);
            }}
          />
          <ErrorText id="cif-own-error" message={ownError} />
        </div>
      )}
      <Actions
        onNext={() => (required && count === 0 ? fail("Pick at least one to continue.") : cifNext())}
        onSkip={required ? undefined : cifNext}
      />
    </>
  );
}

function LongText({
  title,
  helper,
  value,
  onChange,
  required,
}: {
  title: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const { error, setError, fail, field } = useFieldError();
  return (
    <>
      <QuestionHead title={title} helper={helper} />
      <div className="mt-16">
        <TextArea
          ref={(el) => {
            field.current = el;
          }}
          aria-labelledby="qtitle"
          aria-invalid={!!error}
          aria-describedby={describedBy(error)}
          placeholder="My answer"
          value={value}
          onChange={(e) => {
            setError("");
            onChange(e.target.value);
          }}
        />
        <ErrorText id={ERR} message={error} />
      </div>
      <Actions
        onNext={() => (required && !filled(value) ? fail("A few words is plenty.") : cifNext())}
        onSkip={required ? undefined : cifNext}
      />
    </>
  );
}

// ---------- screens ----------

export function ChapterScreen({ n, s }: { n: number; s: CifState }) {
  const c = CHAPTERS[n - 1];
  const name = firstName(s.answers.name);
  const intro = n === 7 && name ? `Nearly there, ${name}. ${c.intro}` : c.intro;
  return (
    <>
      <p className="text-body-small text-ink-50">
        <Meta parts={[c.time, minutesLeft(n)]} />
      </p>
      <h1 className="mt-8 font-heading text-h2 text-black">{c.title}</h1>
      <p className="mt-8 text-body text-ink-50">{intro}</p>
      <ol className="mt-24 flex flex-col">
        {CHAPTERS.map((x, i) => {
          const state = i + 1 < n ? "done" : i + 1 === n ? "now" : "next";
          return (
            <li
              key={x.title}
              className="flex items-center justify-between border-ink-25 py-12 [&+&]:border-t-hairline"
              aria-current={state === "now" ? "step" : undefined}
            >
              <span className="flex items-center gap-12">
                <StepDot state={state} />
                <span className={`text-body ${state === "now" ? "text-black" : "text-ink-50"}`}>{x.title}</span>
              </span>
              <span className={`text-body-small ${state === "now" ? "text-black" : "text-ink-50"}`}>{x.time}</span>
            </li>
          );
        })}
      </ol>
      <Actions onNext={cifNext} label={n === 1 ? "Start" : "Continue"} />
    </>
  );
}

// Figma numbers these circles; numbers are left out (no chapter numbers shown to the client).
function StepDot({ state }: { state: "done" | "now" | "next" }) {
  if (state === "done")
    return (
      <span className="flex size-32 items-center justify-center rounded-24 border border-background-600 bg-primary-500">
        <Image src="/icons/check.svg" alt="" width={16} height={16} />
      </span>
    );
  if (state === "now")
    return (
      <span className="flex size-32 items-center justify-center rounded-24 border border-background-600 bg-primary-500">
        <span className="size-8 rounded-pill bg-white" />
      </span>
    );
  return <span className="size-32 rounded-24 border border-background-600" />;
}

// Natural breaks after "Your goals" and "Working together". Not in Figma: wording is a draft.
const BREAKS: Record<number, { title: string; body: string }> = {
  3: { title: "Nice work", body: "That's the biggest part done. Take a breath if you need one. Your answers are saved." },
  5: { title: "Thank you for your honesty", body: "Two short parts left, and then we're done." },
};

export function BreakScreen({ n }: { n: number }) {
  const b = BREAKS[n];
  return (
    <>
      <h1 className="font-heading text-h2 text-black">{b.title}</h1>
      <p className="mt-8 text-body text-ink-50">{b.body}</p>
      <Actions onNext={cifNext} />
    </>
  );
}

export function CifStep({ step, s, onSubmit }: Props) {
  const a = s.answers;
  const { error, setError, fail, field } = useFieldError();
  const groupRef = (el: HTMLElement | null) => {
    field.current = el;
  };

  if (step.startsWith("rate:")) {
    const id = step.slice(5) as LifeAreaId;
    const area = AREA[id];
    const index = AREAS.findIndex((x) => x.id === id);
    const score = s.lifeAreas.find((x) => x.id === id)?.score ?? null;
    return (
      <>
        <QuestionHead
          meta={<Meta parts={[`${index + 1} of 12`, area.label]} />}
          title={`How would you rate ${area.phrase} right now?`}
          helper={area.hint}
        />
        <div
          ref={groupRef}
          tabIndex={-1}
          role="group"
          aria-label="Score from 1 to 10"
          aria-describedby={describedBy(error)}
          className="mt-16 grid grid-cols-5 gap-8 outline-none"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={score === n}
              aria-label={`${n} out of 10`}
              onClick={() => {
                setError("");
                setLifeAreaScore(id, n);
                cifNextAfter(260);
              }}
              className={`rounded-pill border-hairline px-12 py-8 font-mono text-data-table ${
                score === n ? "border-primary-700 bg-primary-500 text-white" : "border-background-600 bg-white text-black"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <ErrorText id={ERR} message={error} />
        <div className="mt-8 flex justify-between text-caption text-ink-50">
          <span>1 · Not at all where I want it</span>
          <span>10 · Exactly right</span>
        </div>
        <div className="mt-24 flex justify-center">
          <Wheel lifeAreas={s.lifeAreas} active={id} />
        </div>
        <Actions onNext={() => (score === null ? fail("Tap a number to continue.") : cifNext())} />
      </>
    );
  }

  if (step.startsWith("goal:")) {
    const id = step.slice(5) as LifeAreaId;
    const area = AREA[id];
    const score = s.lifeAreas.find((x) => x.id === id)?.score;
    const g = a.goals[id] ?? { picks: [], own: "", explore: false };
    const setGoal = (patch: Partial<typeof g>) => set({ goals: { ...a.goals, [id]: { ...g, ...patch } } });
    return (
      <>
        <QuestionHead
          meta={area.label}
          title={`What would it take to move ${area.phrase} from ${score} closer to 10?`}
          helper="Pick any that fit, write your own, or both."
        />
        <div
          ref={groupRef}
          tabIndex={-1}
          role="group"
          aria-labelledby="qtitle"
          aria-describedby={describedBy(error)}
          className="mt-16 flex flex-col gap-8 outline-none"
        >
          {area.goals.map((o) => (
            <CheckCard
              key={o}
              label={o}
              selected={g.picks.includes(o) && !g.explore}
              onClick={() => {
                setError("");
                setGoal({ explore: false, picks: g.picks.includes(o) ? g.picks.filter((x) => x !== o) : [...g.picks, o] });
              }}
            />
          ))}
        </div>
        <ErrorText id={ERR} message={error} />
        <div className="my-16 border-t-hairline border-ink-25" />
        <div className="flex flex-col gap-8">
          <TextArea
            rows={3}
            aria-label="Your goal in your own words"
            placeholder={OWN_GOAL}
            value={g.explore ? "" : g.own}
            onChange={(e) => {
              setError("");
              setGoal({ explore: false, own: e.target.value });
            }}
          />
          {/* "I'm not sure yet…" clears the other picks and stands alone. */}
          <SpecialCard
            label={EXPLORE}
            selected={g.explore}
            onClick={() => {
              setError("");
              setGoal(g.explore ? { explore: false } : { explore: true, picks: [], own: "" });
            }}
          />
        </div>
        <Actions
          onNext={() =>
            g.explore || g.picks.length || filled(g.own)
              ? cifNext()
              : fail("Pick a goal, write your own, or choose to explore it together.")
          }
        />
      </>
    );
  }

  switch (step) {
    case "name":
      return <NameAndEmail name={a.name} email={a.email} />;

    case "pronoun":
      return (
        <PickOne
          title="Your pronouns"
          options={OPT.pronouns}
          value={a.pronoun}
          onPick={(v) => set({ pronoun: v })}
          own={{ placeholder: "Write my own", value: a.pronounOwn, onChange: (v) => set({ pronounOwn: v }) }}
          skippable
        />
      );
    case "contact":
      return (
        <PickOne
          title="What's the best way to reach you between sessions?"
          options={OPT.contact}
          value={a.contact}
          onPick={(v) => set({ contact: v })}
        />
      );
    case "age":
      return <PickOne title="Which age range are you in?" options={OPT.age} value={a.age} onPick={(v) => set({ age: v })} skippable />;

    case "focus": {
      const chosen = focusList(s);
      return (
        <>
          <QuestionHead
            title="Which 1 to 3 areas would you most like to focus on?"
            helper="I've ticked your three lowest scores. Change them if something else matters more."
          />
          <div className="mt-16 flex justify-center">
            <Wheel lifeAreas={s.lifeAreas} />
          </div>
          <div
            ref={groupRef}
            tabIndex={-1}
            role="group"
            aria-labelledby="qtitle"
            aria-describedby={describedBy(error)}
            className="mt-16 flex flex-col gap-8 outline-none"
          >
            {byScoreAscending(s.lifeAreas).map((area) => {
              const on = chosen.includes(area.id);
              return (
                <CheckCard
                  key={area.id}
                  label={AREA[area.id].label}
                  selected={on}
                  trailing={<span className="font-mono text-data-table">{area.score}</span>}
                  onClick={() => {
                    setError("");
                    if (on) return setFocusAreas(chosen.filter((x) => x !== area.id));
                    if (chosen.length >= 3) return setError("Pick up to 3. Untick one to swap.");
                    setFocusAreas([...chosen, area.id]);
                  }}
                />
              );
            })}
          </div>
          <ErrorText id={ERR} message={error} />
          <Actions
            onNext={() => {
              if (!chosen.length) return fail("Pick at least one area.");
              if (!s.progress.focusChosen) setFocusAreas(chosen); // keep the pre-ticked three
              cifNext();
            }}
          />
        </>
      );
    }

    case "objectives":
      return (
        <LongText
          title="In your own words, my main goals for this coaching are…"
          helper="I've started this from your answers. Change it however you like."
          value={a.objectives}
          onChange={(v) => set({ objectives: v })}
          required
        />
      );
    case "special":
      return (
        <PickMany
          title="Which of these would you like extra support with?"
          helper="Pick up to 3."
          options={OPT.special}
          values={a.special}
          onChange={(v) => set({ special: v })}
          max={3}
        />
      );

    case "transition":
      return (
        <PickOne
          title="Which feels closest to where you are right now?"
          options={OPT.transition}
          value={a.transition}
          onPick={(v) => set(v === a.transition ? { transition: v } : { transition: v, transDetail: [], transOwn: "" })}
        />
      );
    case "changeKind":
    case "noticed":
      return (
        <PickMany
          title={step === "changeKind" ? "What kind of change are you going through?" : "Lately, I've noticed…"}
          helper="Pick up to 3."
          options={step === "changeKind" ? OPT.changeKind : OPT.noticed}
          values={a.transDetail}
          onChange={(v) => set({ transDetail: v })}
          max={3}
          own={{ placeholder: "Something else", value: a.transOwn, onChange: (v) => set({ transOwn: v }) }}
        />
      );

    case "obstacles":
      return (
        <PickMany
          title="What tends to get in your way?"
          helper="Pick up to 3."
          options={OPT.obstacles}
          values={a.obstacles}
          onChange={(v) => set({ obstacles: v })}
          max={3}
          own={{ placeholder: "Something else", value: a.obstaclesOwn, onChange: (v) => set({ obstaclesOwn: v }) }}
        />
      );
    case "obstacleStory": {
      // Names the first obstacle picked on the previous question. Optional.
      const first = firstObstacle(a);
      return (
        <LongText
          title={first ? `When “${first}” shows up, what usually happens?` : "When that shows up, what usually happens?"}
          helper="Optional. A sentence or two is plenty."
          value={a.obstacleStory}
          onChange={(v) => set({ obstacleStory: v })}
        />
      );
    }
    case "motivation":
      return (
        <PickMany
          title="When you're working towards a goal, what keeps you going?"
          helper="Pick up to 2."
          options={OPT.motivation}
          values={a.motivation}
          onChange={(v) => set({ motivation: v })}
          max={2}
          own={{ placeholder: "Something else", value: a.motivationOwn, onChange: (v) => set({ motivationOwn: v }) }}
        />
      );
    case "coached":
      return <PickOne title="Have you worked with a coach before?" options={OPT.coached} value={a.coached} onPick={(v) => set({ coached: v })} />;
    case "worked":
      return (
        <>
          <p className="text-body-small text-ink-50">Both optional. It helps me know what to keep and what to leave out.</p>
          {(
            [
              ["What worked for you?", "worked", OPT.worked, "workedOwn"],
              ["And what didn't?", "didnt", OPT.didnt, "didntOwn"],
            ] as const
          ).map(([title, key, opts, ownKey]) => (
            <div key={key} className="mt-16">
              <h2 className="font-heading text-h4 text-black">{title}</h2>
              <div className="mt-12 flex flex-wrap gap-8">
                {opts.map((o) => {
                  const on = a[key].includes(o);
                  return (
                    <CheckCard
                      key={o}
                      chip
                      label={o}
                      selected={on}
                      onClick={() => set({ [key]: on ? a[key].filter((x) => x !== o) : [...a[key], o] } as Partial<CifAnswers>)}
                    />
                  );
                })}
              </div>
              <div className="mt-8">
                <TextInput aria-label={`${title} Something else`} placeholder="Something else" value={a[ownKey]} onChange={(e) => set({ [ownKey]: e.target.value } as Partial<CifAnswers>)} />
              </div>
            </div>
          ))}
          <Actions onNext={cifNext} onSkip={cifNext} />
        </>
      );
    case "challenge":
      return (
        <PickOne
          title="How much would you like me to challenge you to step outside your comfort zone?"
          options={OPT.challenge}
          value={a.challenge}
          onPick={(v) => set({ challenge: v })}
        />
      );

    case "hobbies":
      return (
        <PickMany
          title="Some of my hobbies have been or are…"
          helper="Pick any, and add your own."
          options={OPT.hobbies}
          values={a.hobbies}
          onChange={(v) => set({ hobbies: v })}
          own={{ placeholder: "Add your own", value: a.hobbiesOwn, onChange: (v) => set({ hobbiesOwn: v }) }}
        />
      );
    case "words":
      return (
        <>
          <QuestionHead title="People who know me well describe me as…" helper="One word in each box." />
          <div className="mt-16 flex flex-col gap-8">
            {["e.g. Calm", "e.g. Funny", "e.g. Smart"].map((placeholder, i) => (
              <TextInput
                key={i}
                id={`cif-word-${i}`}
                large
                aria-label={`Word ${i + 1}`}
                aria-invalid={!!error && !filled(a.words[i])}
                aria-describedby={describedBy(error)}
                placeholder={placeholder}
                value={a.words[i]}
                // Exactly three words: one per box, no spaces.
                onChange={(e) => {
                  setError("");
                  const words = [...a.words] as CifAnswers["words"];
                  words[i] = e.target.value.replace(/\s+/g, "");
                  set({ words });
                }}
              />
            ))}
          </div>
          <ErrorText id={ERR} message={error} />
          <Actions
            onNext={() => {
              const empty = a.words.findIndex((w) => !filled(w));
              if (empty === -1) return cifNext();
              fail("Three words, one in each box.", document.getElementById(`cif-word-${empty}`));
            }}
          />
        </>
      );
    case "background":
      return (
        <PickMany
          title="Is there anything about your background that would help me support you better?"
          options={OPT.background}
          values={a.bgTags}
          onChange={(v) => set({ bgTags: v })}
          none={{ label: "None of these", value: a.bgNone, onChange: (v) => set({ bgNone: v }) }}
        />
      );
    case "bgMore":
      return (
        <LongText
          title="Something about my background, culture or norms that will help you serve me better is…"
          helper={`You picked: ${listJoin(a.bgTags).toLowerCase()}. Optional.`}
          value={a.bgMore}
          onChange={(v) => set({ bgMore: v })}
        />
      );
    case "anythingElse":
      return (
        <LongText
          title="Anything else you'd like me to know about you?"
          helper="Optional."
          value={a.anythingElse}
          onChange={(v) => set({ anythingElse: v })}
        />
      );
    case "reflection":
      return (
        <LongText
          title="One thing from our last conversation that continues to sit with me is…"
          value={a.reflection}
          onChange={(v) => set({ reflection: v })}
          required
        />
      );

    case "summary":
      return <Summary s={s} onSubmit={onSubmit} />;

    default:
      return null;
  }
}

// ---------- name and email ----------

const EMAIL = /^\S+@\S+\.\S+$/;

function NameAndEmail({ name, email }: { name: string; email: string }) {
  const { user } = useApp();
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // The client is already signed in: start from the account's name and email.
  useEffect(() => {
    const patch: Partial<CifAnswers> = {};
    if (!filled(name) && user?.name) patch.name = user.name;
    if (!filled(email) && user?.email) patch.email = user.email;
    if (Object.keys(patch).length) set(patch);
    // Only on arrival; after that the fields belong to the client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (key: "name" | "email", value: string) => {
    setErrors((e) => ({ ...e, [key]: undefined }));
    set({ [key]: value });
    // Kept in step with the account, so Settings and sign-in show the corrected value.
    if (filled(value) && (key === "name" || EMAIL.test(value.trim()))) updateUser({ [key]: value.trim() });
  };

  return (
    <>
      <QuestionHead title="What should I call you?" helper="Your email helps me match this to your file." />
      <div className="mt-16 flex flex-col gap-16">
        <div className="flex flex-col gap-8">
          <label htmlFor="cif-name">
            <FieldLabel>Your name</FieldLabel>
          </label>
          <TextInput
            id="cif-name"
            ref={nameRef}
            autoComplete="name"
            placeholder="Your first and last name"
            value={name}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cif-name-error" : undefined}
            onChange={(e) => change("name", e.target.value)}
          />
          <ErrorText id="cif-name-error" message={errors.name ?? ""} />
        </div>
        <div className="flex flex-col gap-8">
          <label htmlFor="cif-email">
            <FieldLabel>Your email</FieldLabel>
          </label>
          <TextInput
            id="cif-email"
            ref={emailRef}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cif-email-error" : undefined}
            onChange={(e) => change("email", e.target.value)}
          />
          <ErrorText id="cif-email-error" message={errors.email ?? ""} />
        </div>
      </div>
      <Actions
        onNext={() => {
          const next = {
            name: filled(name) ? undefined : "Please add your name.",
            email: EMAIL.test(email.trim()) ? undefined : "Please check your email address.",
          };
          setErrors(next);
          if (next.name) return nameRef.current?.focus();
          if (next.email) return emailRef.current?.focus();
          cifNext();
        }}
      />
    </>
  );
}

// ---------- summary ----------

function Summary({ s, onSubmit }: { s: CifState; onSubmit: () => void }) {
  const a = s.answers;
  const name = firstName(a.name);
  const focus = focusList(s);
  const score = (id: LifeAreaId) => s.lifeAreas.find((x) => x.id === id)?.score;
  const goals = focus
    .map((id) => {
      const g = a.goals[id];
      const picked = withOwn(g?.picks ?? [], g?.own ?? "");
      // Never a bare "Career (7):" — an area without goals says so, and Edit leads back to it.
      return g?.explore
        ? `${AREA[id].label} (${score(id)}): explore together`
        : `${AREA[id].label} (${score(id)}): ${picked.length ? picked.join("; ") : "no goals picked yet"}`;
    })
    .join("\n");
  const label = <T extends { save: string; label: string }>(list: T[], v: string | null) =>
    list.find((o) => o.save === v)?.label;

  return (
    <>
      <QuestionHead
        title={`Here's what I heard${name ? `, ${name}` : ""}`}
        helper="Check it over and change anything that doesn't sound like you."
      />
      <div className="mt-16 flex flex-col gap-16">
        <Block title="Your life wheel" edit="rate:career">
          <Wheel lifeAreas={s.lifeAreas} labels />
        </Block>
        <Block title="About you" edit="name">
          <Line label="Name" value={a.name} />
          <Line label="Email" value={a.email} />
          <Line label="Pronouns" value={a.pronounOwn || a.pronoun} />
          <Line label="Best way to reach you" value={a.contact} />
          <Line label="Age range" value={a.age} />
        </Block>
        <Block title="Your focus and goals" edit="focus">
          <Line label="Focus areas" value={focus.map((id) => AREA[id].label).join(", ")} />
          <Line label="Goals" value={goals} />
          <Line label="Extra support" value={listJoin(a.special)} />
        </Block>
        <Block title="In your own words" edit="objectives">
          <p className="whitespace-pre-line text-body-small text-ink-75">{a.objectives}</p>
        </Block>
        <Block title="This season" edit="transition">
          <Line label="Right now" value={label(OPT.transition, a.transition)} />
          <Line label="Details" value={listJoin(withOwn(a.transDetail, a.transOwn))} />
        </Block>
        <Block title="What gets in the way" edit="obstacles">
          <Line label="Obstacles" value={listJoin(withOwn(a.obstacles, a.obstaclesOwn))} />
          <Line label="When it shows up" value={a.obstacleStory} />
          <Line label="What keeps you going" value={listJoin(withOwn(a.motivation, a.motivationOwn))} />
        </Block>
        <Block title="Working together" edit="coached">
          <Line label="Coached before" value={label(OPT.coached, a.coached)} />
          {coachedYes(a) && <Line label="What worked" value={listJoin(withOwn(a.worked, a.workedOwn))} />}
          {coachedYes(a) && <Line label="What didn't" value={listJoin(withOwn(a.didnt, a.didntOwn))} />}
        </Block>
        <Block title="Challenge level" edit="challenge">
          <Line label="Challenge" value={label(OPT.challenge, a.challenge)} />
        </Block>
        <Block title="Who you are" edit="hobbies">
          <Line label="Hobbies" value={listJoin(withOwn(a.hobbies, a.hobbiesOwn))} />
          <Line label="Three words" value={listJoin(a.words)} />
          <Line label="Background" value={a.bgNone ? "None of these" : listJoin(a.bgTags)} />
          <Line label="More about your background" value={a.bgMore} />
          <Line label="Anything else" value={a.anythingElse} />
        </Block>
        <Block title="Since we last spoke" edit="reflection">
          <p className="whitespace-pre-line text-body-small text-ink-75">{a.reflection}</p>
        </Block>
      </div>
      <Actions onNext={onSubmit} label="Send to Dinesh" />
    </>
  );
}

// Figma summary block: white card, Body Medium grey title, Primary/600 "Edit".
function Block({ title, edit, children }: { title: string; edit: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-10 rounded-12 border-hairline border-background-600 bg-white p-12">
      <div className="flex items-center justify-between">
        <h2 className="text-body-medium text-ink-50">{title}</h2>
        <button type="button" onClick={() => cifEdit(edit)} className="text-caption text-primary-600" aria-label={`Edit ${title}`}>
          Edit
        </button>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <p className="whitespace-pre-line text-body-small text-black">
      {label}: <span className="text-ink-75">{value}</span>
    </p>
  );
}
