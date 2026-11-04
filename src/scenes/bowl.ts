import type { Params, Scene, SceneDef, SolutionStep } from "../engine/types";
import { Camera } from "../engine/camera";
import { COLORS, INK, add, arrow, badge, grid, ground, label, scale } from "../engine/draw";
import { critter } from "../buddy/critters";

const DEG = Math.PI / 180;
const fmt = (x: number, d = 2) => x.toFixed(d);

/** Insect in a hemispherical bowl: it can stay put wherever mg sinθ ≤ μ mg cosθ, i.e. tanθ ≤ μ. */
export function bowlPhysics({ R, mu }: Params) {
  const thMax = Math.atan(mu); // angle from the bottom, measured at the centre
  const h = R * (1 - Math.cos(thMax));
  return { thMax, h, thMaxDeg: thMax / DEG };
}

function createBowl(): Scene {
  const cam = new Camera();
  let th = 0; // insect's current angle from the bottom (rad)
  let state: "climb" | "stuck" = "climb";
  let wiggle = 0;
  const speed = 0.35; // rad/s crawl

  return {
    reset() { th = 0; state = "climb"; wiggle = 0; },
    action(id) { if (id === "reset") { th = 0; state = "climb"; } },
    status() { return state === "stuck" ? "stuck" : "climb"; },

    step(dt, p) {
      const { thMax } = bowlPhysics(p);
      wiggle += dt;
      if (th < thMax) { th = Math.min(thMax, th + speed * dt); state = "climb"; }
      else { th = thMax; state = "stuck"; }
    },

    draw(ctx, vw, p) {
      const { h, thMaxDeg } = bowlPhysics(p);
      const R = p.R;
      cam.follow({ minX: -R * 1.5, maxX: R * 1.5, minY: 0, maxY: R * 1.45 }, vw, 0.15, { l: 40, r: 40, t: 110, b: 50 });
      const T = cam.toScreen;
      grid(ctx, vw, cam);
      ground(ctx, cam.oy, 0, vw.width);

      // bowl: a thick inked hemisphere sitting on the ground, centre at (0, R)
      const t = Math.max(10, 0.12 * cam.scale), off = t / cam.scale; // bowl wall thickness, so it sits ON the ground
      const C = T({ x: 0, y: R + off }), r = R * cam.scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(C.x, C.y, r + t, 0, Math.PI);
      ctx.arc(C.x, C.y, r, Math.PI, 0, true);
      ctx.closePath();
      ctx.fillStyle = "#9fd0e8";
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      // inner shine
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(C.x, C.y, r + t * 0.5, Math.PI * 0.62, Math.PI * 0.82);
      ctx.stroke();
      ctx.restore();

      // radius line + angle at the centre
      const P = { x: R * Math.sin(th), y: off + R - R * Math.cos(th) }; // point on the inner surface
      const Ps = T(P);
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(36,38,44,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(C.x, C.y);
      ctx.lineTo(C.x, C.y + r);
      ctx.moveTo(C.x, C.y);
      ctx.lineTo(Ps.x, Ps.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (th > 0.02) {
        ctx.beginPath();
        ctx.arc(C.x, C.y, 34, Math.PI / 2 - th, Math.PI / 2);
        ctx.stroke();
        label(ctx, `θ = ${fmt(th / DEG, 1)}°`, C.x + 18, C.y + 52, INK);
      }
      ctx.restore();
      label(ctx, `R = ${fmt(R, 1)} m`, C.x - r * 0.5, C.y - 14, COLORS.muted, "center");

      // highest point it can reach
      const yMax = T({ x: 0, y: h + off }).y;
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = "rgba(208,143,0,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(C.x - r * 1.15, yMax);
      ctx.lineTo(C.x + r * 1.15, yMax);
      ctx.stroke();
      ctx.restore();
      label(ctx, `max height h = ${fmt(h)} m`, C.x - r * 1.15, yMax - 14, COLORS.friction, "left");

      // forces on the insect (in units of mg so they're readable)
      const n = { x: -Math.sin(th), y: Math.cos(th) }; // towards the centre
      const tng = { x: Math.cos(th), y: Math.sin(th) }; // up the surface
      const L = R * 0.42;
      const body = add(P, scale(n, R * 0.06));
      arrow(ctx, T, body, { x: 0, y: -L }, COLORS.weight, "mg");
      arrow(ctx, T, body, scale(n, L * Math.cos(th)), COLORS.normal, "N");
      if (th > 0.01) arrow(ctx, T, body, scale(tng, L * Math.sin(th)), COLORS.friction, "f");

      // the insect itself, walking along the surface
      const sz = Math.max(46, 0.42 * cam.scale);
      const bob = state === "stuck" ? Math.sin(wiggle * 30) * 2 : Math.abs(Math.sin(wiggle * 14)) * 1.5;
      ctx.save();
      ctx.translate(Ps.x, Ps.y);
      ctx.rotate(-th);
      critter(ctx, "ladybug", 0, -bob, sz);
      ctx.restore();

      badge(ctx, 14, 14, state === "stuck" ? `can't go higher · tanθ = μ` : "climbing...", state === "stuck" ? "#ffe1c7" : "#d9f5e4");
      label(ctx, `θ_max = tan⁻¹(μ) = ${fmt(thMaxDeg, 1)}°`, 16, 62, COLORS.muted);
    },
  };
}

export const bowl: SceneDef = {
  id: "bowl",
  name: "Insect in a bowl",
  blurb: "How high up a rough bowl can an insect crawl before it starts slipping?",
  controls: [
    { key: "R", label: "R (bowl radius)", unit: "m", min: 0.5, max: 3, step: 0.1, default: 1.5 },
    { key: "mu", label: "μ (friction)", min: 0, max: 1.5, step: 0.01, default: 0.75 },
  ],
  actions: [{ id: "reset", label: "↺ Crawl again", primary: true }],
  create: createBowl,
  solve(p) {
    const { thMax, h, thMaxDeg } = bowlPhysics(p);
    const steps: SolutionStep[] = [
      { title: "1 · Forces at angle θ (from the bottom)", lines: ["along the surface: mg sinθ (pulls it back down)", "into the surface: N = mg cosθ"] },
      { title: "2 · Friction can only do so much", lines: ["needs f = mg sinθ", "can give at most μN = μ mg cosθ"] },
      {
        title: "3 · Limit",
        lines: [`mg sinθ = μ mg cosθ → tanθ = μ`, `θ_max = tan⁻¹(${fmt(p.mu)}) = ${fmt(thMaxDeg, 1)}°`],
      },
      {
        title: "4 · Height",
        lines: [`h = R − R cosθ = R(1 − cosθ)`, `cosθ = 1/√(1 + μ²) = ${fmt(Math.cos(thMax), 3)}`, `h = ${fmt(p.R, 1)} × (1 − ${fmt(Math.cos(thMax), 3)}) = ${fmt(h)} m`],
        verdict: { text: `h = R(1 − 1/√(1+μ²)) = ${fmt(h)} m`, tone: "good" },
      },
      { title: "Notice", lines: ["The insect's mass cancels out. A heavy beetle and a tiny ant get exactly as high."] },
    ];
    return steps;
  },
};
