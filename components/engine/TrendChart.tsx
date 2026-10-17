import type { TrendPoint } from "@/lib/outcomes";

// Figma "RG - Trend View": a white 12px-radius card. Bars for My Outcomes (Overall Primary/300,
// Priority Pink/200, 20px wide, fully rounded tops), a line for My Well-Being (Blue/400, 2px,
// Blue/600 12px points) on the same 0–100 axis (well-being × 10), dashed guides, the 100/50/0
// labels on the left, the periods along the bottom and the legend under it.
// Plain SVG, newest period on the left as in Figma; more than four scroll sideways.

const PLOT = { left: 40, top: 20, height: 240 };
const GROUP = 68; // one period's slot
const FIRST = 18; // gap from the axis to the first pair of bars
const BAR = 20;
const GAP = 4;

export default function TrendChart({
  points,
  showOverall,
  showPriority,
  line,
}: {
  points: TrendPoint[];
  showOverall: boolean;
  showPriority: boolean;
  line: { label: string; values: (number | null)[] } | null;
}) {
  const width = Math.max(329, PLOT.left + FIRST + points.length * GROUP);
  const y = (v: number) => PLOT.top + PLOT.height - (Math.max(0, Math.min(100, v)) / 100) * PLOT.height;
  const bottom = PLOT.top + PLOT.height;
  const centre = (i: number) => PLOT.left + FIRST + i * GROUP + (BAR * 2 + GAP) / 2;
  const plotRight = width - 20;

  const bars: { x: number; v: number; cls: string }[] = [];
  points.forEach((p, i) => {
    const series = [showOverall && { v: p.overall, cls: "fill-primary-300" }, showPriority && { v: p.priority, cls: "fill-pink-200" }].filter(Boolean) as {
      v: number;
      cls: string;
    }[];
    const start = centre(i) - (series.length * BAR + (series.length - 1) * GAP) / 2;
    series.forEach((s, k) => bars.push({ x: start + k * (BAR + GAP), v: s.v, cls: s.cls }));
  });

  const linePoints = line ? line.values.map((v, i) => (v === null ? null : { x: centre(i), y: y(v * 10) })) : [];
  const path = linePoints
    .filter((p): p is { x: number; y: number } => !!p)
    .map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="flex flex-col rounded-12 bg-white pb-20">
      <div className="overflow-x-auto">
        <svg width={width} height={300} viewBox={`0 0 ${width} 300`} role="img" aria-label="Trend across periods">
          {/* dashed guides every 10, then the axes */}
          {Array.from({ length: 10 }, (_, k) => (
            <line key={k} x1={PLOT.left} x2={plotRight} y1={y((k + 1) * 10)} y2={y((k + 1) * 10)} className="stroke-line" strokeDasharray="4 4" />
          ))}
          <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={bottom} className="stroke-background-700" />
          <line x1={PLOT.left} x2={plotRight} y1={bottom} y2={bottom} className="stroke-background-700" />
          {[100, 50, 0].map((v) => (
            <text key={v} x={20} y={y(v) + 5} textAnchor="middle" className="fill-ink-75 font-mono text-data-table">
              {v}
            </text>
          ))}

          {bars.map((b, i) => {
            const top = y(b.v);
            const h = bottom - top;
            const r = Math.min(BAR / 2, h);
            return (
              <path
                key={i}
                className={b.cls}
                d={`M${b.x} ${bottom} V${top + r} A${r} ${r} 0 0 1 ${b.x + BAR} ${top + r} V${bottom} Z`}
              />
            );
          })}

          {path && <path d={path} fill="none" strokeWidth={2} className="stroke-blue-400" />}
          {linePoints.map((p, i) => p && <circle key={i} cx={p.x} cy={p.y} r={6} className="fill-blue-600" />)}

          {points.map((p, i) => (
            <text key={p.label} x={centre(i)} y={bottom + 24} textAnchor="middle" className="fill-ink-75 font-body text-body-small">
              {p.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex flex-col items-center gap-8 px-16">
        {line && (
          <span className="flex items-center gap-8">
            <span className="h-2 w-20 rounded-pill bg-blue-400" />
            <span className="text-caption text-ink-grey">{line.label}</span>
          </span>
        )}
        <span className="flex items-center gap-8">
          {showOverall && <Legend swatch="bg-primary-300" label="Outcomes Overall" />}
          {showPriority && <Legend swatch="bg-pink-200" label="Outcomes Priority" />}
        </span>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-8">
      <span className={`h-10 w-20 ${swatch}`} />
      <span className="text-caption text-ink-grey">{label}</span>
    </span>
  );
}
