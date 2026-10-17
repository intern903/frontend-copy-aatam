import Image from "next/image";
import type { ModuleProgress } from "@/lib/modules";

// A white label pill on the illustration (Figma Homepage "Frame 50x").
// States aren't in Figma; agreed treatment:
//   not started → pill at 60% opacity
//   in progress → thin Primary/600 bar along the bottom edge, filled to the percentage
//   finished    → the design's green check-circle before the label
export default function ModuleLabel({
  label,
  progress,
  size = "caption",
  onClick,
}: {
  label: string;
  progress?: ModuleProgress; // undefined = no state (the companion)
  size?: "caption" | "h4";
  onClick: () => void;
}) {
  const large = size === "h4";
  const status = progress?.status;
  const description =
    status === "finished"
      ? `${label}, complete`
      : status === "in-progress"
        ? `${label}, ${progress!.percent}% complete`
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
      {status === "finished" && (
        <Image
          src="/icons/check-circle.svg"
          alt=""
          width={large ? 16 : 12}
          height={large ? 16 : 12}
        />
      )}
      {label}
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
