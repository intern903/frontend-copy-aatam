"use client";

import BackButton from "@/components/shell/BackButton";
import { ProgressBar, TextArea } from "@/components/cif/ui";
import { FlowHeader, PurposeBanner } from "@/components/visions/ui";

/**
 * One question per screen (Figma "Vision - Flow Screen 2–10"): the Life Purpose card on top,
 * then Cancel · title · Save, the step bar, a white card holding the question and its answer
 * box, and the screen's buttons.
 *
 * `top` sits between the Life Purpose card and the header (the earlier answers on the writing
 * screen); `intro` sits under the step bar; `above` and `below` sit inside the card, around the box.
 */
export default function QuestionScreen({
  title,
  step,
  steps,
  label,
  required,
  value,
  onChange,
  placeholder = "My answer",
  onCancel,
  onSave,
  top,
  intro,
  above,
  below,
  children,
}: {
  title: string;
  step: number; // 1-based: how many segments are filled
  steps: number;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCancel: () => void;
  onSave: () => void;
  top?: React.ReactNode;
  intro?: React.ReactNode;
  above?: React.ReactNode;
  below?: React.ReactNode;
  children: React.ReactNode; // the buttons
}) {
  return (
    <main className="flex flex-col items-center gap-20 px-32 pb-40 pt-header-top">
      <div className="flex h-icon-button w-content items-center">
        <BackButton />
      </div>
      <div className="mt-12">
        <PurposeBanner />
      </div>
      {top}
      <div className="flex w-content flex-col gap-16">
        <FlowHeader title={title} onCancel={onCancel} onSave={onSave} />
        <ProgressBar fills={Array.from({ length: steps }, (_, i) => (i < step ? 1 : 0))} />
        {intro}
        <div className="flex w-full flex-col gap-12 rounded-24 bg-white p-16">
          <label htmlFor="answer" className="text-body-small text-black">
            {label}
            {required && <span className="text-black/50"> *</span>}
          </label>
          {above}
          <TextArea id="answer" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-answer-box" />
          {below}
        </div>
        {children}
      </div>
    </main>
  );
}
