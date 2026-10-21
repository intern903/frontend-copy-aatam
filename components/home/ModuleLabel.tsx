import Image from "next/image";
import type { ModuleProgress } from "@/lib/modules";

// A white label pill on the illustration (Figma Homepage "Frame 50x").
// States aren't in Figma; agreed treatment:
//   not started → pill at 60% opacity
//   in progress → thin Primary/600 bar along the bottom edge, filled to the percentage
//   finished    → the design's green check-circle before the label
//   locked      → Figma's 12px lock before the label, at full strength (Homepage 1021:3599): a
//                 module that opens only after the Get to Know You form is sent
//   in progress → also its percentage after the label, so it is visible, not only announced
export default function ModuleLabel({
  label,
  progress,
  size = "caption",
  locked,
  onClick,
}: {
  label: string;
  progress?: ModuleProgress; // undefined = no state (the companion)
  locked?: boolean;
  size?: "caption" | "h4";
  onClick: () => void;
}) {
  const large = size === "h4";
  const status = locked ? undefined : progress?.status;
  const description =
    status === "finished"
      ? `${label}, complete`
      : status === "in-progress"
        ? `${label}, ${progress!.percent}% complete`
        : locked
          ? `${label}, locked`
          : status === "not-started"
            ? `${label}, not started`
            : label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={description}
      className={`relative flex items-center gap-4 overflow-hidden whitespace-nowrap rounded-pill bg-white text-black ${
        large ? "px-12 py-4 font-heading text-h4" : "px-6 py-2 text-caption"
      } ${status === "not-started" ? "opacity-60" : ""}`}
    >
      {locked && <Image src="/icons/lock.svg" alt="" width={12} height={12} />}
      {status === "finished" && (
        <Image
          src="/icons/check-circle.svg"
          alt=""
          width={large ? 16 : 12}
          height={large ? 16 : 12}
        />
      )}
      {label}
      {status === "in-progress" && <span className="text-ink-60">{progress!.percent}%</span>}
      {status === "in-progress" && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-2 bg-primary-100">
          <span
            className="block h-full bg-primary-600"
            style={{ width: `${progress!.percent}%` }}
          />
        </span>
      )}
    </button>
  );
}
