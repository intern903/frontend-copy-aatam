"use client";

import { useState } from "react";
import { AreaChips, Chip, EngineFrame, EngineTop, FieldLabel } from "@/components/engine/ui";
import { PrimaryButton } from "@/components/life-purpose/ui";
import { FlowHeader, GreenButton, GreyButton, SplitButtons } from "@/components/visions/ui";
import { lifeAreas, type LifeAreaId, type LifeCodeType } from "@/lib/data";
import type { LifeCodeInput } from "@/lib/store";

// Adding a life code, laid out as Figma "RG - Guide" (New Life Code / Edit Life Code). One
// component runs when a life code is added by hand (/life-code/new), edited, or captured from the
// companion chat, so every life code lands in the same shape (lib/data.ts LifeCode).
//
// New, three screens (the Figma progress bar above them):
//   1. One card, as Figma: "My Life Code" (What would you tell your future self? Start with 'I'.)
//      → statement; "Select life area" ("All" first, then the 12) → lifeAreas, allLifeAreas;
//      "Type of life code" Micro / Macro → type, pre-filled from the areas (one area suggests
//      Micro, several or all Macro) until the client picks.
//   2. Read it out loud: "How does it feel in your body?" Light and open / Tight. Nothing is
//      saved; Tight goes back to screen 1 to reword. It is the client's own confirmation.
//   3. "How or when will you use this Life Code?" → howOrWhenToUse.
// Edit: every field on one screen, as Figma's Edit Life Code; Save in the header.
//
// HARD RULE: the app never writes or tidies a life code. Every word is the client's, saved as typed.

const STEPS = 3;
const ALL = lifeAreas.map((a) => a.id);

export default function LifeCodeFlow({
  title = "New Life Code",
  initial,
  edit,
  onSave,
  onCancel,
}: {
  title?: string;
  initial?: Partial<LifeCodeInput>; // an edit, or a statement captured in the companion chat
  edit?: boolean;
  onSave: (input: LifeCodeInput) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [areas, setAreas] = useState<LifeAreaId[]>(initial?.allLifeAreas ? [] : initial?.lifeAreas ?? []);
  const [all, setAll] = useState(initial?.allLifeAreas ?? false);
  const [chosenType, setChosenType] = useState<LifeCodeType | null>(initial?.type ?? null);
  const [how, setHow] = useState(initial?.howOrWhenToUse ?? "");

  const hasAreas = all || areas.length > 0;
  // Until the client picks, the type follows the areas: one suggests Micro, several or all Macro.
  const type: LifeCodeType | null = chosenType ?? (hasAreas ? (all || areas.length > 1 ? "macro" : "micro") : null);
  const complete = statement.trim().length > 0 && hasAreas && type !== null;
  const save = () =>
    complete &&
    onSave({ statement: statement.trim(), lifeAreas: all ? ALL : areas, allLifeAreas: all, type: type!, howOrWhenToUse: how.trim() });

  const statementField = (
    <div className="flex flex-col gap-12">
      <FieldLabel required>Life Code</FieldLabel>
      <Answer value={statement} onChange={setStatement} placeholder="What would you tell your future self? Start with ‘I’." autoFocus={!edit} />
    </div>
  );
  const areaField = (
    <div className="flex flex-col gap-12">
      <FieldLabel required>Select life area</FieldLabel>
      <div className="flex flex-col gap-8">
        <div className="flex">
          <Chip
            label="All"
            on={all}
            onClick={() => {
              setAll(!all);
              setAreas([]);
            }}
          />
        </div>
        <AreaChips
          selected={all ? [] : areas}
          onToggle={(id) => {
            setAll(false);
            setAreas(areas.includes(id) ? areas.filter((a) => a !== id) : [...areas, id]);
          }}
        />
      </div>
    </div>
  );
  const typeField = (
    <div className="flex flex-col gap-12">
      <FieldLabel required>Type of life code</FieldLabel>
      <p className="-mt-8 text-caption text-ink-60">Does it fit one situation (Micro), or many situations in your life (Macro)?</p>
      <div className="flex gap-8">
        <Chip label="Micro" on={type === "micro"} onClick={() => setChosenType("micro")} />
        <Chip label="Macro" on={type === "macro"} onClick={() => setChosenType("macro")} />
      </div>
    </div>
  );
  const howField = (
    <div className="flex flex-col gap-12">
      <FieldLabel>How or when will you use this Life Code?</FieldLabel>
      <Answer value={how} onChange={setHow} placeholder="My answer" rows={2} autoFocus={!edit} />
    </div>
  );

  const header = (
    <FlowHeader title={edit ? "Edit Life Code" : title} onCancel={onCancel} onSave={save} saveDisabled={!complete} />
  );

  if (edit) {
    return (
      <EngineFrame top={<EngineTop onBack={onCancel} />}>
        {header}
        <Card>
          {statementField}
          {areaField}
          {typeField}
        </Card>
        <Card>{howField}</Card>
      </EngineFrame>
    );
  }

  return (
    <EngineFrame top={<EngineTop onBack={step > 0 ? () => setStep(step - 1) : onCancel} />}>
      <div className="flex flex-col gap-12">
        {header}
        <div className="flex w-full gap-4" aria-label={`Step ${step + 1} of ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={`h-4 flex-1 rounded-pill ${i <= step ? "bg-black" : "bg-ink-25"}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <>
          <Card>
            {statementField}
            {areaField}
            {typeField}
          </Card>
          <PrimaryButton disabled={!complete} onClick={() => setStep(1)}>
            Next
          </PrimaryButton>
        </>
      )}

      {step === 1 && (
        <>
          <Card>
            <FieldLabel>Read it out loud. How does it feel in your body?</FieldLabel>
            <p className="font-heading text-h4 text-black">{statement.trim()}</p>
          </Card>
          <SplitButtons>
            <GreyButton onClick={() => setStep(0)}>Tight</GreyButton>
            <GreenButton onClick={() => setStep(2)}>Light and open</GreenButton>
          </SplitButtons>
        </>
      )}

      {step === 2 && (
        <>
          <Card>{howField}</Card>
          <PrimaryButton disabled={!complete} onClick={save}>
            Save
          </PrimaryButton>
        </>
      )}
    </EngineFrame>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="flex flex-col gap-16 rounded-24 bg-white p-16">{children}</section>;
}

function Answer({
  value,
  onChange,
  placeholder,
  rows = 3,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      autoFocus={autoFocus}
      className="w-full resize-none rounded-12 border-hairline border-background-600 bg-white p-12 text-body text-black outline-none placeholder:text-body-small placeholder:text-ink-50"
    />
  );
}
