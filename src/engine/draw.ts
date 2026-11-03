import type { Viewport, Vec2 } from "./types";

/** World (m, y-up, origin bottom-left) -> canvas (px, y-down). */
export function toScreen(p: Vec2, view: Viewport): Vec2 {
  return { x: p.x * view.pxPerMeter, y: view.height - p.y * view.pxPerMeter };
}

/** Draws a vector arrow starting at `from` (world m), length in world m. Reused for force arrows later. */
export function arrow(
  ctx: CanvasRenderingContext2D,
  view: Viewport,
  from: Vec2,
  vec: Vec2,
  color: string,
  label?: string,
) {
  const a = toScreen(from, view);
  const b = toScreen({ x: from.x + vec.x, y: from.y + vec.y }, view);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const head = 8;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - head * Math.cos(ang - 0.4), b.y - head * Math.sin(ang - 0.4));
  ctx.lineTo(b.x - head * Math.cos(ang + 0.4), b.y - head * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(label, b.x + 6, b.y - 6);
  }
  ctx.restore();
}
