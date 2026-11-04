import type { Viewport, Vec2 } from "./types";
import type { Camera } from "./camera";

export type ToScreen = (p: Vec2) => Vec2;

/** World (m, y-up, origin bottom-left) -> canvas (px, y-down) at a fixed scale. */
export function toScreen(p: Vec2, view: Viewport): Vec2 {
  return { x: p.x * view.pxPerMeter, y: view.height - p.y * view.pxPerMeter };
}

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });

export const COLORS = {
  text: "#e8eaf0",
  muted: "#9aa3b2",
  grid: "rgba(255,255,255,0.045)",
  gridMajor: "rgba(255,255,255,0.09)",
  weight: "#ff5d6c",
  normal: "#5ad1ff",
  friction: "#ffd166",
  tension: "#c792ff",
  accel: "#4bd28f",
  velocity: "#5ad1ff",
};

/** Draws a vector arrow from `from` along `vec` (both in world metres). */
export function arrow(
  ctx: CanvasRenderingContext2D,
  T: ToScreen,
  from: Vec2,
  vec: Vec2,
  color: string,
  label?: string,
  opts: { dashed?: boolean; width?: number } = {},
) {
  const a = T(from);
  const b = T(add(from, vec));
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 3) return; // zero-length vector: draw nothing
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const head = Math.min(10, len * 0.45);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = opts.width ?? 2.5;
  ctx.lineCap = "round";
  if (opts.dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x - head * 0.6 * Math.cos(ang), b.y - head * 0.6 * Math.sin(ang));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - head * Math.cos(ang - 0.45), b.y - head * Math.sin(ang - 0.45));
  ctx.lineTo(b.x - head * Math.cos(ang + 0.45), b.y - head * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = "600 13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, b.x + 16 * Math.cos(ang), b.y + 14 * Math.sin(ang));
  }
  ctx.restore();
}

/** Small rounded pill used for status badges on the canvas. */
export function badge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg = "#0f1115") {
  ctx.save();
  ctx.font = "600 13px system-ui, sans-serif";
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 10, y + 13);
  ctx.restore();
  return w;
}

/** Text with a dark halo so it stays readable over trails and grid. */
export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = COLORS.text, align: CanvasTextAlign = "left", font = "12px ui-monospace, monospace") {
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
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#14171d";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Metre grid that picks a 1-2-5 spacing so lines stay ~60px apart at any zoom. */
export function grid(ctx: CanvasRenderingContext2D, view: Viewport, cam: Camera) {
  const raw = 70 / cam.scale;
  const p10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((k) => k * p10).find((s) => s >= raw)!;
  const tl = cam.toWorld({ x: 0, y: 0 });
  const br = cam.toWorld({ x: view.width, y: view.height });
  ctx.save();
  ctx.lineWidth = 1;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = "rgba(154,163,178,0.55)";
  for (let x = Math.ceil(tl.x / step) * step; x <= br.x; x += step) {
    const sx = Math.round(cam.toScreen({ x, y: 0 }).x) + 0.5;
    ctx.strokeStyle = Math.abs(x) < 1e-9 ? COLORS.gridMajor : COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, view.height);
    ctx.stroke();
    ctx.fillText(`${+x.toFixed(6)}`, sx + 3, Math.min(cam.oy + 13, view.height - 4));
  }
  for (let y = Math.ceil(br.y / step) * step; y <= tl.y; y += step) {
    const sy = Math.round(cam.toScreen({ x: 0, y }).y) + 0.5;
    ctx.strokeStyle = Math.abs(y) < 1e-9 ? COLORS.gridMajor : COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(view.width, sy);
    ctx.stroke();
    if (y > 0) ctx.fillText(`${+y.toFixed(6)} m`, 4, sy - 3);
  }
  ctx.restore();
  return step;
}

/** Hatched ground line, the way it's drawn in textbooks. */
export function ground(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.save();
  ctx.strokeStyle = "#3a4150";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(58,65,80,0.7)";
  for (let x = x0 - (x0 % 14); x < x1; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.lineTo(x - 8, y + 9);
    ctx.stroke();
  }
  ctx.restore();
}

/** A box drawn as a solid with a soft highlight. */
export function block(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, angle = 0, text?: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, Math.min(5, h / 6));
  if (text) {
    ctx.fillStyle = "#0f1115";
    ctx.font = `600 ${Math.max(10, Math.min(14, h / 3))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 1);
  }
  ctx.restore();
}
