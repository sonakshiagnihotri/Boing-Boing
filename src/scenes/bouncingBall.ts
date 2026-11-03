import type { Scene, Viewport } from "../engine/types";
import { arrow, toScreen } from "../engine/draw";

export interface BallParams {
  g: number; // m/s^2
  restitution: number; // 0..1
}

export function createBouncingBall(): Scene<BallParams> {
  const r = 0.3; // m
  let pos = { x: 1, y: 5 };
  let vel = { x: 2.5, y: 0 };
  let world = { w: 10, h: 8 };

  return {
    reset(view: Viewport) {
      world = { w: view.width / view.pxPerMeter, h: view.height / view.pxPerMeter };
      pos = { x: 1, y: world.h * 0.8 };
      vel = { x: 2.5, y: 0 };
    },

    step(dt, { g, restitution }) {
      // semi-implicit Euler: update v, then x
      vel.y -= g * dt;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;

      if (pos.y - r < 0) {
        pos.y = r;
        vel.y = -vel.y * restitution;
        if (Math.abs(vel.y) < 0.05) vel.y = 0; // settle
      }
      if (pos.x - r < 0) {
        pos.x = r;
        vel.x = -vel.x * restitution;
      } else if (pos.x + r > world.w) {
        pos.x = world.w - r;
        vel.x = -vel.x * restitution;
      }
    },

    draw(ctx, view) {
      world = { w: view.width / view.pxPerMeter, h: view.height / view.pxPerMeter };
      const c = toScreen(pos, view);

      ctx.fillStyle = "#e8eaf0";
      ctx.fillRect(0, view.height - 2, view.width, 2); // ground

      ctx.beginPath();
      ctx.arc(c.x, c.y, r * view.pxPerMeter, 0, Math.PI * 2);
      ctx.fillStyle = "#ff8a3d";
      ctx.fill();

      // velocity arrow (scaled 0.3 s) — same helper the force arrows will use
      arrow(ctx, view, pos, { x: vel.x * 0.3, y: vel.y * 0.3 }, "#5ad1ff", "v");

      ctx.fillStyle = "#9aa3b2";
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillText(`v = (${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}) m/s`, 12, 20);
      ctx.fillText(`h = ${(pos.y - r).toFixed(2)} m`, 12, 36);
    },
  };
}
