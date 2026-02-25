"use client";

const HEAT: Record<string, { count: number; action: string }> = {
  A: { count: 974, action: "Strafe Left"  },
  E: { count: 645, action: "Move Up"      },
  Q: { count: 631, action: "Move Down"    },
  W: { count: 528, action: "Forward"      },
  D: { count: 473, action: "Strafe Right" },
  S: { count: 0,   action: "—"            },
};

const MAX   = Math.max(...Object.values(HEAT).map((d) => d.count));
const TOTAL = Object.values(HEAT).reduce((s, d) => s + d.count, 0);

function heatRGB(t: number): [number, number, number] {
  return [
    Math.round(76  + t * 63),
    Math.round(29  + t * 63),
    Math.round(149 + t * 97),
  ];
}

function keyStyle(key: string) {
  const d = HEAT[key];
  if (!d)         return { fill: "#1c1c1f", stroke: "#282828", text: "#343438" };
  if (d.count === 0) return { fill: "#252527", stroke: "#333336", text: "#52525b" };
  const t = d.count / MAX;
  const [r, g, b] = heatRGB(t);
  return {
    fill:   `rgb(${r},${g},${b})`,
    stroke: `rgba(196,181,253,${0.3 + t * 0.6})`,
    text:   "#f5f3ff",
  };
}

// Unit pitch = 40px key + 4px gap = 44px per 1U
const PITCH = 44;
const G     = 4;
const KH    = 38;  // key height
const PAD   = 8;

type KeyRow = [label: string, width: number][];

// All rows total exactly 15U so they align
const ROWS: KeyRow[] = [
  // Number row
  [["`",1],["1",1],["2",1],["3",1],["4",1],["5",1],["6",1],["7",1],["8",1],["9",1],["0",1],["-",1],["=",1],["⌫",2]],
  // QWERTY
  [["⇥",1.5],["Q",1],["W",1],["E",1],["R",1],["T",1],["Y",1],["U",1],["I",1],["O",1],["P",1],["[",1],["]",1],["\\",1.5]],
  // ASDF
  [["⇪",1.75],["A",1],["S",1],["D",1],["F",1],["G",1],["H",1],["J",1],["K",1],["L",1],[";",1],["'",1],["↵",2.25]],
  // ZXCV
  [["⇧",2.25],["Z",1],["X",1],["C",1],["V",1],["B",1],["N",1],["M",1],[",",1],[".",1],["/",1],["⇧",2.75]],
  // Bottom
  [["fn",1.25],["ctrl",1.25],["⌥",1.25],["⌘",1.25],["",6.25],["⌘",1.25],["⌥",1.25],["←→",1.25]],
];

const KB_W  = 15 * PITCH - G;               // 656px
const KB_H  = ROWS.length * (KH + G) - G;  // 226px
const SVG_W = KB_W + PAD * 2;               // 672px
const SVG_H = KB_H + PAD * 2;               // 242px

export default function RUIKeyboardChart() {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Keyboard SVG ── */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ maxHeight: 260 }}
        aria-label="Keyboard heatmap showing RUI key usage"
      >
        {/* Keyboard plate */}
        <rect x={0} y={0} width={SVG_W} height={SVG_H} rx={10} fill="#0d0d0f" />

        {ROWS.map((row, ri) => {
          let cx = PAD;
          const cy = PAD + ri * (KH + G);

          return row.map(([key, w]) => {
            const kx = cx;
            const kw = w * PITCH - G;
            cx += w * PITCH;

            const s = keyStyle(key);
            const hd = HEAT[key];
            const isHeat   = hd !== undefined;
            const hasCount = isHeat && hd.count > 0;
            const isLetter = /^[A-Z]$/.test(key);
            const labelSize = isLetter ? 13 : kw < 30 ? 7 : 9;

            return (
              <g key={`${ri}-${kx}`}>
                <rect
                  x={kx} y={cy} width={kw} height={KH} rx={4}
                  fill={s.fill} stroke={s.stroke} strokeWidth={1}
                />

                {/* Key label */}
                <text
                  x={kx + kw / 2}
                  y={cy + (hasCount ? KH * 0.36 : KH * 0.52)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelSize}
                  fontWeight={isHeat ? 700 : 400}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fill={s.text}
                >
                  {key}
                </text>

                {/* Usage count inside heated letter keys */}
                {hasCount && isLetter && (
                  <text
                    x={kx + kw / 2}
                    y={cy + KH * 0.72}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fontFamily="ui-monospace, monospace"
                    fill={`rgba(221,214,254,${0.55 + (hd.count / MAX) * 0.45})`}
                  >
                    {hd.count}
                  </text>
                )}

                {/* S key "n/a" */}
                {key === "S" && (
                  <text
                    x={kx + kw / 2}
                    y={cy + KH * 0.72}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    fontFamily="ui-sans-serif, sans-serif"
                    fill="#3f3f46"
                  >
                    n/a
                  </text>
                )}
              </g>
            );
          });
        })}
      </svg>

      {/* ── Colour scale ── */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-zinc-600">low</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => {
            const [r, g, b] = heatRGB(i / 9);
            return (
              <div
                key={i}
                className="h-2.5 rounded-sm"
                style={{ width: 20, background: `rgb(${r},${g},${b})` }}
              />
            );
          })}
        </div>
        <span className="text-xs text-zinc-600">high</span>
      </div>

      {/* ── Key breakdown ── */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center">
        {Object.entries(HEAT)
          .filter(([, d]) => d.count > 0)
          .sort(([, a], [, b]) => b.count - a.count)
          .map(([key, d]) => {
            const [r, g, b] = heatRGB(d.count / MAX);
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <span className="font-bold" style={{ color: `rgb(${r},${g},${b})` }}>{key}</span>
                <span className="text-zinc-500">{d.action}</span>
                <span className="font-semibold text-zinc-400 tabular-nums">{d.count.toLocaleString()}</span>
                <span className="text-zinc-600">· {((d.count / TOTAL) * 100).toFixed(0)}%</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
