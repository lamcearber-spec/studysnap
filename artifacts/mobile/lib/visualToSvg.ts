import type { ExerciseVisual } from "@/context/SessionContext";

/**
 * Pure-string SVG generation for the 15 math-visual primitives. Mirrors the
 * react-native-svg primitives used on-screen but emits plain SVG markup that
 * can be embedded in an HTML template for `expo-print` PDF export.
 *
 * Colors are inlined (no token reference) so the output stays self-contained.
 */
const C = {
  ink: "#3A3A3A",
  inkBody: "#4D4D4D",
  inkMuted: "#8A8378",
  hairline: "#E5DDC9",
  surface: "#FAF3E7",
  surfaceLow: "#F4ECDB",
  primary: "#A76A4A",
  primaryDark: "#8A5538",
  primaryFixedDim: "#D6A98C",
  yellow: "#FFB627",
  yellowDeep: "#A66C00",
  yellowSoft: "#FFE4A8",
  success: "#7BB37A",
  successDark: "#5C9659",
  error: "#E0533D",
};

type Props = Record<string, unknown>;

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function wrap(inner: string, w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}

function cubeArray(p: Props): string {
  const count = num(p.count, 1);
  const layout = str(p.layout, "row");
  const size = num(p.size, 32);
  const grid: number[][] = [];
  const m = /^(\d+)x(\d+)(?:\+(\d+))?$/.exec(layout);
  if (m) {
    const rows = Number(m[1]);
    const cols = Number(m[2]);
    const trailing = m[3] ? Number(m[3]) : 0;
    for (let r = 0; r < rows; r++) grid.push(Array(cols).fill(0));
    if (trailing > 0) grid.push(Array(trailing).fill(0));
  } else if (layout === "column") {
    for (let i = 0; i < count; i++) grid.push([0]);
  } else {
    grid.push(Array(count).fill(0));
  }
  const cols = Math.max(...grid.map((r) => r.length));
  const rows = grid.length;
  const gap = size * 0.15;
  const cubeBox = size + gap;
  const w = cols * cubeBox - gap;
  const h = rows * cubeBox - gap;

  let s = "";
  grid.forEach((row, rowIdx) => {
    row.forEach((_, colIdx) => {
      const x = colIdx * cubeBox;
      const y = rowIdx * cubeBox;
      const front = `${x},${y + size * 0.2} ${x + size * 0.8},${y + size * 0.2} ${x + size * 0.8},${y + size} ${x},${y + size}`;
      const top = `${x},${y + size * 0.2} ${x + size * 0.2},${y} ${x + size},${y} ${x + size * 0.8},${y + size * 0.2}`;
      const side = `${x + size * 0.8},${y + size * 0.2} ${x + size},${y} ${x + size},${y + size * 0.8} ${x + size * 0.8},${y + size}`;
      s += `<polygon points="${front}" fill="${C.primary}"/>`;
      s += `<polygon points="${top}" fill="${C.primaryFixedDim}"/>`;
      s += `<polygon points="${side}" fill="${C.primaryDark}"/>`;
    });
  });
  return wrap(s, w, h + size * 0.4);
}

function dotArray(p: Props): string {
  const count = num(p.count, 1);
  const cols = num(p.cols ?? 5, 5);
  const size = num(p.size, 20);
  const gap = size * 0.5;
  const rows = Math.ceil(count / cols);
  const w = cols * (size + gap);
  const h = rows * (size + gap);
  let s = "";
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const cx = c * (size + gap) + size / 2 + gap / 2;
    const cy = r * (size + gap) + size / 2 + gap / 2;
    s += `<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${C.primary}"/>`;
  }
  return wrap(s, w, h);
}

function fraction(p: Props): string {
  const numerator = num(p.numerator, 1);
  const denominator = num(p.denominator, 2);
  const style = str(p.style, "pie");
  const size = num(p.size, 100);

  if (style === "bar") {
    const w = size * 2.4;
    const h = size * 0.4;
    let s = "";
    const cellW = w / denominator;
    for (let i = 0; i < denominator; i++) {
      const fill = i < numerator ? C.primary : C.surface;
      s += `<rect x="${i * cellW}" y="0" width="${cellW}" height="${h}" fill="${fill}" stroke="${C.ink}" stroke-width="1.5"/>`;
    }
    return wrap(s, w, h);
  }
  if (style === "number-line") {
    const w = size * 2.4;
    const h = size * 0.5;
    let s = `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let i = 0; i <= denominator; i++) {
      const x = (w / denominator) * i;
      s += `<line x1="${x}" y1="${h / 2 - 6}" x2="${x}" y2="${h / 2 + 6}" stroke="${C.ink}" stroke-width="1.5"/>`;
    }
    const markerX = (w / denominator) * numerator;
    s += `<circle cx="${markerX}" cy="${h / 2}" r="6" fill="${C.primary}" stroke="${C.ink}" stroke-width="1.5"/>`;
    return wrap(s, w, h);
  }
  // pie
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.surface}" stroke="${C.ink}" stroke-width="1.5"/>`;
  for (let i = 0; i < denominator; i++) {
    const a1 = (-Math.PI / 2) + (i / denominator) * Math.PI * 2;
    const a2 = (-Math.PI / 2) + ((i + 1) / denominator) * Math.PI * 2;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    const fill = i < numerator ? C.primary : "transparent";
    s += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${fill}" stroke="${C.ink}" stroke-width="1"/>`;
  }
  return wrap(s, size, size);
}

function clock(p: Props): string {
  const hour = num(p.hour, 3) % 12;
  const minute = num(p.minute, 0) % 60;
  const size = num(p.size, 140);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;
  const hAngle = ((hour + minute / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const mAngle = (minute / 60) * Math.PI * 2 - Math.PI / 2;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.surface}" stroke="${C.ink}" stroke-width="2"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(a) * r * 0.85;
    const y1 = cy + Math.sin(a) * r * 0.85;
    const x2 = cx + Math.cos(a) * r * 0.95;
    const y2 = cy + Math.sin(a) * r * 0.95;
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="2"/>`;
  }
  s += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(hAngle) * r * 0.55}" y2="${cy + Math.sin(hAngle) * r * 0.55}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(mAngle) * r * 0.8}" y2="${cy + Math.sin(mAngle) * r * 0.8}" stroke="${C.primary}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="3" fill="${C.ink}"/>`;
  return wrap(s, size, size);
}

function shapeBasic(p: Props): string {
  const shape = str(p.shape, "square");
  const size = num(p.size, 100);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  let inner = "";
  if (shape === "circle") {
    inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.primaryFixedDim}" stroke="${C.ink}" stroke-width="2"/>`;
  } else if (shape === "triangle") {
    inner = `<polygon points="${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.85} ${cx - r * 0.95},${cy + r * 0.85}" fill="${C.primaryFixedDim}" stroke="${C.ink}" stroke-width="2"/>`;
  } else if (shape === "rectangle") {
    inner = `<rect x="${cx - r * 1.2}" y="${cy - r * 0.7}" width="${r * 2.4}" height="${r * 1.4}" fill="${C.primaryFixedDim}" stroke="${C.ink}" stroke-width="2"/>`;
  } else if (shape === "pentagon" || shape === "hexagon") {
    const sides = shape === "pentagon" ? 5 : 6;
    const pts: string[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
    }
    inner = `<polygon points="${pts.join(" ")}" fill="${C.primaryFixedDim}" stroke="${C.ink}" stroke-width="2"/>`;
  } else {
    inner = `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="${C.primaryFixedDim}" stroke="${C.ink}" stroke-width="2"/>`;
  }
  return wrap(inner, size, size);
}

function areaGrid(p: Props): string {
  const rows = Math.max(1, Math.min(12, num(p.rows, 3)));
  const cols = Math.max(1, Math.min(12, num(p.cols, 3)));
  const cellSize = num(p.cellSize, 28);
  const shaded = new Set(Array.isArray(p.shaded) ? (p.shaded as number[]) : []);
  const w = cols * cellSize;
  const h = rows * cellSize;
  let s = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const fill = shaded.has(idx) ? C.primaryFixedDim : C.surface;
      s += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="${C.ink}" stroke-width="1.5"/>`;
    }
  }
  return wrap(s, w, h);
}

function numberLine(p: Props): string {
  const min = num(p.min, 0);
  const max = num(p.max, 10);
  const markers = Array.isArray(p.markers) ? (p.markers as number[]) : [];
  const w = 280;
  const h = 50;
  const padding = 16;
  const usable = w - padding * 2;
  let s = `<line x1="${padding}" y1="${h / 2}" x2="${w - padding}" y2="${h / 2}" stroke="${C.ink}" stroke-width="2"/>`;
  const span = max - min || 1;
  for (let v = min; v <= max; v++) {
    const x = padding + ((v - min) / span) * usable;
    s += `<line x1="${x}" y1="${h / 2 - 6}" x2="${x}" y2="${h / 2 + 6}" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<text x="${x}" y="${h - 4}" font-family="Inter, sans-serif" font-size="10" fill="${C.inkBody}" text-anchor="middle">${v}</text>`;
  }
  markers.forEach((m) => {
    const x = padding + ((m - min) / span) * usable;
    s += `<circle cx="${x}" cy="${h / 2}" r="6" fill="${C.primary}" stroke="${C.ink}" stroke-width="1.5"/>`;
  });
  return wrap(s, w, h);
}

function placeholder(name: string): string {
  return wrap(
    `<rect x="0" y="0" width="180" height="60" rx="8" fill="${C.surfaceLow}" stroke="${C.hairline}" stroke-dasharray="4,4"/><text x="90" y="35" font-family="Inter, sans-serif" font-size="11" fill="${C.inkMuted}" text-anchor="middle">[${name}]</text>`,
    180,
    60,
  );
}

const HANDLERS: Record<string, (p: Props) => string> = {
  CubeArray: cubeArray,
  DotArray: dotArray,
  TenFrame: dotArray,
  Fraction: fraction,
  Clock: clock,
  ShapeBasic: shapeBasic,
  AreaGrid: areaGrid,
  NumberLine: numberLine,
};

export function visualToSvg(visual: ExerciseVisual): string {
  const handler = HANDLERS[visual.primitive];
  if (handler) return handler(visual.props ?? {});
  // The remaining 7 primitives (Money, Scale, Thermometer, BarChart, PieChart,
  // TallyMarks, GeometricSolid, PatternSequence) render to a labelled
  // placeholder in PDF for now — the on-screen experience still uses the full
  // react-native-svg implementation.
  return placeholder(visual.primitive);
}
