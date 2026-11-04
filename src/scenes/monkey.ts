import type { Params, Scene, SceneDef, SolutionStep } from "../engine/types";
import { Camera } from "../engine/camera";
import { COLORS, INK, arrow, badge, grid, ground, label, shape, sketchLine } from "../engine/draw";
import { critter } from "../buddy/critters";

const G = 9.8;
const fmt = (x: number, d = 2) => x.toFixed(d);
const TOP = 8; // ceiling height, m

/** Monkey on a rope: T − mg = ma (a positive = accelerating up). Rope breaks when T > T_max. */
export function monkeyPhysics({ m, a, Tmax }: Params) {
  const T = Math.max(0, m * (G + a));
  return { T, snaps: T > Tmax + 1e-9, aMaxUp: Tmax / m - G, W: m * G };
}

function createMonkey(): Scene {
  const cam = new Camera();
  let y = 3, v = 0, t = 0;
  let snapped = false, fallV = 0, end = false;

  const restart = () => { y = 3; v = 0; t = 0; snapped = false; fallV = 0; end = false; };

  return {
    reset: restart,
    action(id) { if (id === "reset") restart(); },
    status(p) {
      const s = monkeyPhysics(p);
      if (snapped) return "snap";
      if (s.T / p.Tmax > 0.85) return "close";
      return p.a > 0 ? "up" : p.a < 0 ? "down" : "hold";
    },

    step(dt, p) {
      const s = monkeyPhysics(p);
      t += dt;
      if (snapped) {
        // free fall once the rope breaks
        fallV -= G * dt;
        y = Math.max(0.05, y + fallV * dt);
        return;
      }
      if (s.snaps && t > 0.35) { snapped = true; fallV = v; return; }
      if (end) return;
      v += Math.max(p.a, -G) * dt;
      y += v * dt;
      if (y > TOP - 1.4 || y < 0.6) { y = Math.max(0.6, Math.min(TOP - 1.4, y)); v = 0; end = true; }
    },

    draw(ctx, vw, p) {
      const s = monkeyPhysics(p);
      cam.follow({ minX: -4, maxX: 4, minY: 0, maxY: TOP + 0.6 }, vw, 0.2, { l: 40, r: 40, t: 70, b: 40 });
      const T = cam.toScreen;
      grid(ctx, vw, cam);
      ground(ctx, cam.oy, 0, vw.width);

      // ceiling beam + hook
      const cl = T({ x: -1.6, y: TOP }), cr = T({ x: 1.6, y: TOP + 0.35 });
      shape(ctx, [{ x: cl.x, y: cr.y }, { x: cr.x, y: cr.y }, { x: cr.x, y: cl.y }, { x: cl.x, y: cl.y }], "#d9a066");

      // rope: goes from ink to red as tension approaches the limit
      const stress = Math.min(1, s.T / p.Tmax);
      const hot = Math.max(0, (stress - 0.6) / 0.4); // only starts reddening past 60% of the limit
      const ropeCol = snapped ? "#e2483d" : `rgb(${Math.round(150 + 76 * hot)},${Math.round(100 - 28 * hot)},${Math.round(50 + 11 * hot)})`;
      const hands = { x: 0, y: y + 0.55 };
      const top = T({ x: 0, y: TOP }), hs = T(hands), bottom = T({ x: 0, y: 0.25 });
      ctx.save();
      ctx.strokeStyle = ropeCol;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      if (!snapped) {
        sketchLine(ctx, top.x, top.y, bottom.x, bottom.y, 1);
      } else {
        // broken stub at the top, the rest falls with the monkey
        sketchLine(ctx, top.x, top.y, top.x + 3, top.y + 40, 1);
        sketchLine(ctx, hs.x, hs.y - 40, hs.x - 2, bottom.y, 1);
        label(ctx, "SNAP!", top.x + 26, top.y + 34, "#e2483d", "left", `700 30px "Patrick Hand", system-ui`);
      }
      // little twist marks so it reads as rope
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(36,38,44,0.4)";
      const yA = snapped ? hs.y - 40 : top.y;
      for (let yy = yA + 6; yy < bottom.y; yy += 12) { ctx.beginPath(); ctx.moveTo(top.x - 2.5, yy); ctx.lineTo(top.x + 2.5, yy + 4); ctx.stroke(); }
      ctx.restore();

      // monkey (hands at the top of the sprite)
      const size = 1.5 * cam.scale;
      const ms = T({ x: 0, y });
      critter(ctx, "monkey", ms.x, ms.y + size * 0.05, size, { tilt: snapped ? Math.sin(t * 12) * 0.15 : 0 });

      // forces
      const k = 2.4 / Math.max(s.W, s.T, 1);
      const c = { x: 0, y: y + 0.5 };
      arrow(ctx, T, { x: 0.55, y: c.y }, { x: 0, y: -s.W * k }, COLORS.weight, "mg");
      if (!snapped) arrow(ctx, T, { x: -0.55, y: c.y }, { x: 0, y: s.T * k }, COLORS.tension, "T");
      if (Math.abs(p.a) > 0.01 && !snapped) arrow(ctx, T, { x: 1.4, y: c.y }, { x: 0, y: Math.sign(p.a) * Math.min(1.6, 0.4 + Math.abs(p.a) * 0.12) }, COLORS.accel, "a", { width: 3 });

      // tension meter
      const mx = vw.width - 60, my0 = 170, mh = Math.min(240, vw.height - 260);
      ctx.save();
      ctx.fillStyle = "#fffdf7";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(mx - 14, my0, 28, mh, 8); ctx.fill(); ctx.stroke();
      const fillH = mh * Math.min(1.08, s.T / p.Tmax) / 1.08;
      ctx.fillStyle = s.snaps ? "#e2483d" : stress > 0.85 ? "#ffb35c" : "#6fcf97";
      ctx.beginPath(); ctx.roundRect(mx - 10, my0 + mh - fillH, 20, Math.max(0, fillH - 4), 6); ctx.fill();
      const limY = my0 + mh - mh / 1.08;
      ctx.strokeStyle = "#e2483d"; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(mx - 22, limY); ctx.lineTo(mx + 22, limY); ctx.stroke();
      ctx.restore();
      label(ctx, "T_max", mx - 26, limY, "#e2483d", "right");
      label(ctx, "tension", mx, my0 + mh + 16, COLORS.muted, "center");

      const st = snapped ? ["rope SNAPPED 💥", "#ffc9c2"] : s.T / p.Tmax > 0.85 ? ["rope is about to give...", "#ffe1c7"] : ["rope holding", "#d9f5e4"];
      badge(ctx, 14, 14, st[0], st[1]);
      label(ctx, `T = m(g + a) = ${fmt(s.T, 1)} N   (max ${fmt(p.Tmax, 0)} N)`, 16, 62, COLORS.muted);
    },
  };
}

export const monkey: SceneDef = {
  id: "monkey",
  name: "Monkey on a rope",
  blurb: "Climb faster and the rope pulls harder. Find the acceleration where it snaps.",
  controls: [
    { key: "m", label: "m (monkey)", unit: "kg", min: 5, max: 50, step: 0.5, default: 20 },
    { key: "a", label: "a (+ up, − down)", unit: "m/s²", min: -9.8, max: 10, step: 0.1, default: 2 },
    { key: "Tmax", label: "T_max (rope breaks above)", unit: "N", min: 50, max: 600, step: 5, default: 300 },
  ],
  actions: [{ id: "reset", label: "↺ Climb again", primary: true }],
  create: createMonkey,
  solve(p) {
    const s = monkeyPhysics(p);
    const steps: SolutionStep[] = [
      { title: "1 · FBD of the monkey", lines: ["T upward (rope), mg downward", "T − mg = ma  (a positive = up)"] },
      { title: "2 · Tension", lines: [`T = m(g + a) = ${fmt(p.m, 1)} × (9.8 + ${fmt(p.a, 1)}) = ${fmt(s.T, 1)} N`],
        verdict: s.snaps ? { text: `${fmt(s.T, 1)} > ${fmt(p.Tmax, 0)} → rope snaps`, tone: "warn" } : { text: `${fmt(s.T, 1)} ≤ ${fmt(p.Tmax, 0)} → rope holds`, tone: "good" } },
      { title: "3 · Fastest it can climb", lines: [`T_max = m(g + a_max)`, `a_max = T_max/m − g = ${fmt(s.aMaxUp)} m/s²`] },
    ];
    if (s.W > p.Tmax) {
      steps.push({ title: "4 · Even hanging still breaks it", lines: [`mg = ${fmt(s.W, 1)} N > T_max`, `it must slide DOWN with a ≥ g − T_max/m = ${fmt(-s.aMaxUp)} m/s² downward`], verdict: { text: "climbing up is impossible here", tone: "info" } });
    }
    steps.push({ title: "Notice", lines: ["Velocity doesn't matter, only acceleration. Climbing up at constant speed: T = mg."] });
    return steps;
  },
};
