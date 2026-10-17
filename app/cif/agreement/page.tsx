"use client";

import { FloatingBack } from "@/components/shell/BackButton";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CifFrame, QuestionHead, Tick } from "@/components/cif/ui";
import { signAgreement } from "@/lib/store";

// The last step before the journey opens. No Figma frame: built from the CIF screens'
// parts (wordmark, full progress bar, section label, white field boxes, tick box, Continue).
// Draft wording — to be reviewed by Dinesh before real clients see it.
const AGREEMENT = [
  "This agreement is between you and Dinesh, your coach. It sets out how we will work together and how what you share is looked after.",
  "Confidentiality. What you share in our sessions and in this app stays between us. I will not pass it on without your permission, unless the law requires it or I believe you or someone else is at risk of serious harm.",
  "Your content is yours. Everything you write here, your answers, stories, visions and notes, belongs to you. I use it only to support your coaching. You can ask to see it, download it or have it deleted at any time.",
  "Your AI companion. This app includes a companion that reads what you write so it can reflect it back to you and help you between sessions. It only sees your own content, and it supports our work rather than replacing our conversations. If there is anything you would rather it did not read, tell me and we will switch it off.",
  "Working together. Coaching is a partnership. I will show up prepared and honest, and I ask the same of you. Either of us can pause or end the engagement at any time.",
];

export default function AgreementPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);
  const [consent, setConsent] = useState(false);

  // Size the canvas to its box at device resolution so strokes stay sharp.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    const [x, y] = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01); // a tap leaves a dot
    ctx.stroke();
    setSigned(true);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const [x, y] = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  }

  return (
    <>
      <FloatingBack />
      <CifFrame fills={[1, 1, 1, 1, 1, 1, 1]} label="Agreement">
        <QuestionHead title="Our coaching agreement" helper="Please read it, sign below and tick the box." />
        <div className="mt-16 flex flex-col gap-8 rounded-12 border-hairline border-background-600 bg-white p-12 text-body-small text-black">
          {AGREEMENT.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-between">
          <span className="text-body-small text-black">Your signature</span>
          <button type="button" onClick={clear} disabled={!signed} className="text-caption text-primary-600 disabled:text-ink-25">
            Clear
          </button>
        </div>
        <div className="relative mt-8 h-area-card w-full overflow-hidden rounded-12 border-hairline border-background-600 bg-white">
          {!signed && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-body-small text-ink-50">
              Sign here with your finger
            </span>
          )}
          <canvas
            ref={canvasRef}
            aria-label="Signature pad. Draw your signature here."
            className="size-full touch-none"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => (drawing.current = false)}
            onPointerCancel={() => (drawing.current = false)}
          />
        </div>

        <button
          type="button"
          role="checkbox"
          aria-checked={consent}
          onClick={() => setConsent((c) => !c)}
          className="mt-16 flex w-full items-start gap-10 text-left text-body-small text-black"
        >
          <Tick on={consent} />
          I have read this agreement and I agree to it, including my AI companion reading what I write.
        </button>

        <div className="mt-24 flex justify-end">
          <button
            type="button"
            disabled={!signed || !consent}
            onClick={() => {
              signAgreement();
              router.push("/");
            }}
            className="rounded-8 bg-primary-600 px-24 py-12 text-button-cta text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </CifFrame>
    </>
  );
}
