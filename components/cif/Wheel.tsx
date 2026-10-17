import { AREAS } from "@/lib/cif";
import type { LifeArea, LifeAreaId } from "@/lib/data";

// The life wheel (Figma 230px wheel): five Figma "grid/light grey" rings and one wedge per
// area, its length set by the score. Wedges use each area's colour from the live form;
// the area being rated is drawn solid with a dashed outline. Labels are used on the summary.
const R = 115;
const R0 = 11.5;

export default function Wheel({
  lifeAreas,
  active,
  labels,
}: {
  lifeAreas: LifeArea[];
  active?: LifeAreaId;
  labels?: boolean;
}) {
  const step = (2 * Math.PI) / AREAS.length;
  // Rounded so the server and browser render identical paths (no hydration mismatch).
  const round = (n: number) => Math.round(n * 100) / 100;
  const pt = (r: number, a: number) => [round(R + r * Math.cos(a)), round(R + r * Math.sin(a))];
  const pad = labels ? 80 : 1;
  const score = (id: LifeAreaId) => lifeAreas.find((a) => a.id === id)?.score ?? null;

  return (
    <svg
      viewBox={`${-pad} ${-pad / 3} ${2 * R + 2 * pad} ${2 * R + (2 * pad) / 3}`}
      className={labels ? "w-full overflow-visible" : "size-wheel"}
      role="img"
      aria-label={
        "Life wheel: " +
        AREAS.map((a) => `${a.label} ${score(a.id) ?? "not rated"}`).join(", ")
      }
    >
      {[1, 2, 3, 4, 5].map((k) => (
        <circle key={k} cx={R} cy={R} r={(R * k) / 5} fill="none" stroke="#b0b0b0" strokeWidth={0.5} />
      ))}
      {AREAS.map((a, i) => {
        const a0 = -Math.PI / 2 + i * step;
        const a1 = a0 + step;
        const sc = score(a.id);
        const isActive = active === a.id;
        const wedge =
          sc !== null
            ? (() => {
                const r = round(R0 + ((R - R0) * sc) / 10);
                const [p1x, p1y] = pt(r, a0);
                const [p2x, p2y] = pt(r, a1);
                const [q1x, q1y] = pt(R0, a1);
                const [q2x, q2y] = pt(R0, a0);
                return (
                  <path
                    d={`M${q2x},${q2y} L${p1x},${p1y} A${r},${r} 0 0 1 ${p2x},${p2y} L${q1x},${q1y} A${R0},${R0} 0 0 0 ${q2x},${q2y} Z`}
                    fill={a.color}
                    opacity={active ? (isActive ? 0.9 : 0.35) : 0.55}
                  />
                );
              })()
            : null;
        const outline = isActive
          ? (() => {
              const [p1x, p1y] = pt(R, a0);
              const [p2x, p2y] = pt(R, a1);
              return (
                <path
                  d={`M${R},${R} L${p1x},${p1y} A${R},${R} 0 0 1 ${p2x},${p2y} Z`}
                  fill="none"
                  stroke="#4a3122"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              );
            })()
          : null;
        const label = labels
          ? (() => {
              const mid = a0 + step / 2;
              const [lx, ly] = pt(R + 10, mid);
              const anchor = Math.cos(mid) > 0.2 ? "start" : Math.cos(mid) < -0.2 ? "end" : "middle";
              return (
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className="fill-black font-body text-caption"
                >
                  {/* Long names (Personal Development) wrap onto two lines so they fit. */}
                  {a.label.includes(" ") && a.label.length > 12 ? (
                    a.label.split(" ").map((word, w, words) => (
                      <tspan key={word} x={lx} dy={w === 0 ? "-0.6em" : "1.2em"}>
                        {word}
                        {w === words.length - 1 && sc !== null ? ` ${sc}` : ""}
                      </tspan>
                    ))
                  ) : (
                    <>
                      {a.label}
                      {sc !== null ? ` ${sc}` : ""}
                    </>
                  )}
                </text>
              );
            })()
          : null;
        return (
          <g key={a.id}>
            {wedge}
            {outline}
            {label}
          </g>
        );
      })}
    </svg>
  );
}
