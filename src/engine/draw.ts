import type { Viewport, Vec2 } from "./types";
import type { Camera } from "./camera";

export type ToScreen = (p: Vec2) => Vec2;

/** World (m, y-up, origin bottom-left) -> canvas (px, y-down) at a fixed scale. */
export function toScreen(p: Vec2, view: Viewport): Vec2 {
  return { x: p.x * view.pxPerMeter, y: view.height - p.y * view.pxPerMeter };
}

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });

/** Notebook palette: ink on cream paper, crayon colours. */
export const PAPER = "#f7f3ea";
export const INK = "#24262c";
export const COLORS = {
  text: INK,
  muted: "#7d7668",
  paper: PAPER,
  paperShade: "#ece5d4",
  paperDeep: "#ddd3bd",
  grid: "rgba(70,120,190,0.10)",
  gridMajor: "rgba(70,120,190,0.22)",
  margin: "rgba(226,72,61,0.35)",
  weight: "#e2483d",
  normal: "#2f7fd8",
  friction: "#d08f00",
  tension: "#8b4fd1",
  accel: "#2e9e5b",
  velocity: "#2f7fd8",
  orange: "#ff8a3d",
  blue: "#6ec3ee",
  green: "#6fcf97",
  purple: "#b48cf0",
  yellow: "#ffd166",
  pink: "#ff9fb4",
};
export const HAND = `"Patrick Hand", "Comic Neue", "Chalkboard SE", system-ui, sans-serif`;

/* ---------- sketchy lines: deterministic wobble so nothing flickers between frames ---------- */
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s) - 0.5; // -0.5..0.5
};

/** A hand-drawn line: slightly bowed, drawn twice like a quick pen stroke. */
export function sketchLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, passes = 2) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
  for (let p = 0; p < passes; p++) {
    const j = Math.min(2.2, len * 0.012 + 0.6);
    const s = p * 3.1;
    const bow = hash(x1 + s, y2) * j * 2;
    const o1 = hash(x1, y1 + s) * j, o2 = hash(x2 + s, y2) * j;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * o1, y1 + ny * o1);
    ctx.quadraticCurveTo((x1 + x2) / 2 + nx * bow, (y1 + y2) / 2 + ny * bow, x2 + nx * o2, y2 + ny * o2);
    ctx.stroke();
  }
}

/** Closed hand-drawn polygon (outline only). */
export function sketchPoly(ctx: CanvasRenderingContext2D, pts: Vec2[], passes = 2) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    sketchLine(ctx, a.x, a.y, b.x, b.y, passes);
  }
}

/** Crayon fill: flat colour plus diagonal hatch strokes, clipped to the shape. */
export function crayonFill(ctx: CanvasRenderingContext2D, pts: Vec2[], color: string, hatch = 0.22) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.clip();
  ctx.globalAlpha = hatch;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let x = x0 - (y1 - y0); x < x1; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x + (y1 - y0), y0);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws a vector arrow from `from` along `vec` (both in world metres). */
export function arrow(
  ctx: CanvasRenderingContext2D,
  T: ToScreen,
  from: Vec2,
  vec: Vec2,
  color: string,
  text?: string,
  opts: { dashed?: boolean; width?: number } = {},
) {
  const a = T(from);
  const b = T(add(from, vec));
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 3) return; // zero-length vector: draw nothing
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const head = Math.min(11, len * 0.45);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = opts.width ?? 2.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (opts.dashed) ctx.setLineDash([5, 5]);
  const ex = b.x - head * 0.5 * Math.cos(ang), ey = b.y - head * 0.5 * Math.sin(ang);
  if (opts.dashed) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  } else sketchLine(ctx, a.x, a.y, ex, ey, 1);
  ctx.setLineDash([]);
  // open "pen" arrowhead
  ctx.beginPath();
  ctx.moveTo(b.x - head * Math.cos(ang - 0.5), b.y - head * Math.sin(ang - 0.5));
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(b.x - head * Math.cos(ang + 0.5), b.y - head * Math.sin(ang + 0.5));
  ctx.stroke();
  if (text) label(ctx, text, b.x + 16 * Math.cos(ang), b.y + 14 * Math.sin(ang), color, "center", `700 17px ${HAND}`);
  ctx.restore();
}

/** Rounded sticky-note pill used for status badges on the canvas. */
export function badge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg = INK) {
  ctx.save();
  ctx.font = `700 17px ${HAND}`;
  const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 30, 8);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  sketchPoly(ctx, [{ x, y }, { x: x + w, y }, { x: x + w, y: y + 30 }, { x, y: y + 30 }], 1);
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 11, y + 16);
  ctx.restore();
  return w;
}

/** Handwritten text with a paper-coloured halo so it stays readable over lines and paths. */
export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = COLORS.text, align: CanvasTextAlign = "left", font = `600 15px ${HAND}`) {
  ctx.save();
  ctx.font = font;
  // keep the whole label on the canvas (e.g. "R = 9204 m" at the far right edge)
  const w = ctx.measureText(text).width;
  const maxX = ctx.canvas.clientWidth - 6;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  const shift = left < 6 ? 6 - left : left + w > maxX ? maxX - (left + w) : 0;
  x += shift;
  y = Math.max(10, Math.min(ctx.canvas.clientHeight - 8, y));
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.strokeStyle = PAPER;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Graph-paper grid (1-2-5 metre spacing) with a red margin line, like a notebook page. */
export function grid(ctx: CanvasRenderingContext2D, view: Viewport, cam: Camera) {
  const raw = 70 / cam.scale;
  const p10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((k) => k * p10).find((s) => s >= raw)!;
  const tl = cam.toWorld({ x: 0, y: 0 });
  const br = cam.toWorld({ x: view.width, y: view.height });
  ctx.save();
  // small squares between the metre lines
  const minor = step * cam.scale / 5;
  if (minor > 9) {
    ctx.strokeStyle = "rgba(70,120,190,0.05)";
    ctx.lineWidth = 1;
    const x0 = cam.ox % minor, y0 = cam.oy % minor;
    for (let x = x0; x < view.width; x += minor) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, view.height); ctx.stroke(); }
    for (let y = y0; y < view.height; y += minor) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(view.width, y); ctx.stroke(); }
  }
  ctx.lineWidth = 1;
  ctx.font = `13px ${HAND}`;
  ctx.fillStyle = "rgba(70,120,190,0.55)";
  for (let x = Math.ceil(tl.x / step) * step; x <= br.x; x += step) {
    const sx = Math.round(cam.toScreen({ x, y: 0 }).x) + 0.5;
    ctx.strokeStyle = Math.abs(x) < 1e-9 ? COLORS.gridMajor : COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, view.height);
    ctx.stroke();
    ctx.fillText(`${+x.toFixed(6)}`, sx + 3, Math.min(cam.oy + 16, view.height - 4));
  }
  for (let y = Math.ceil(br.y / step) * step; y <= tl.y; y += step) {
    const sy = Math.round(cam.toScreen({ x: 0, y }).y) + 0.5;
    ctx.strokeStyle = Math.abs(y) < 1e-9 ? COLORS.gridMajor : COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(view.width, sy);
    ctx.stroke();
    if (y > 0) ctx.fillText(`${+y.toFixed(6)} m`, 6, sy - 4);
  }
  ctx.restore();
  return step;
}

/** Paper background + notebook margin. Call first each frame. */
export function paper(ctx: CanvasRenderingContext2D, view: Viewport) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, view.width, view.height);
}

/** Hand-drawn ground line with textbook hatching. */
export function ground(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  sketchLine(ctx, x0, y, x1, y);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(36,38,44,0.45)";
  for (let x = x0 - (x0 % 14); x < x1; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x - 8, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

/** A crayon-coloured box with an inked outline, like a doodled crate. */
export function block(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, angle = 0, text?: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const pts = [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }];
  crayonFill(ctx, pts, color);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  sketchPoly(ctx, pts);
  if (text) {
    ctx.fillStyle = INK;
    ctx.font = `700 ${Math.max(13, Math.min(19, h / 2.6))}px ${HAND}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 2);
  }
  ctx.restore();
}

/** Inked ball with a crayon fill and a shine. */
export function ballDoodle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 0.5, y - 0.3, r, 0.2, Math.PI * 2 + 0.1);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
  ctx.restore();
}

/** Filled + inked polygon in one go (inclines, wedges, tables). */
export function shape(ctx: CanvasRenderingContext2D, pts: Vec2[], color: string, lineWidth = 2.4) {
  crayonFill(ctx, pts, color, 0.18);
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  sketchPoly(ctx, pts);
  ctx.restore();
}
