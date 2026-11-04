import type { Params, Scene, SceneDef, SolutionStep, Vec2 } from "../engine/types";
import { Camera } from "../engine/camera";
import { COLORS, add, arrow, badge, block, grid, ground, label, scale } from "../engine/draw";

const G = 9.8;
const BLOCK = 1.2; // block side, m
const DEG = Math.PI / 180;
const L = 10; // slope length, m

const fmt = (x: number, d = 2) => x.toFixed(d);

/** Pure physics for the given sliders. Shared by the sim and the solution panel so they never disagree. */
export function analyze({ theta, m, mus, muk }: Params) {
  const t = theta * DEG;
  const W = m * G;
  const N = W * Math.cos(t);
  const along = W * Math.sin(t); // mg sinθ, down the slope
  const fsMax = mus * N;
  const mukEff = Math.min(muk, mus); // μk > μs isn't physical; clamp it
  const fk = mukEff * N;
  const holds = along <= fsMax + 1e-9;
  return {
    W, N, along, perp: N, fsMax, fk, mukEff, holds,
    aSlide: (along - fk) / m, // down the slope, ≥ 0 whenever it slips
    aUp: G * (Math.sin(t) + mukEff * Math.cos(t)), // deceleration while moving UP the slope
    repose: Math.atan(mus) / DEG,
  };
}

function geometry(thetaDeg: number) {
  const t = thetaDeg * DEG;
  return {
    top: { x: 0, y: L * Math.sin(t) },
    bottom: { x: L * Math.cos(t), y: 0 },
    corner: { x: 0, y: 0 },
    d: { x: Math.cos(t), y: -Math.sin(t) } as Vec2, // unit vector down the slope
    n: { x: Math.sin(t), y: Math.cos(t) } as Vec2, // unit outward normal
  };
}

type State = "rest" | "up" | "sliding" | "bottom";
const S_MIN = BLOCK / 2 + 0.1;
const S_MAX = L - BLOCK / 2 - 0.4;

function createIncline(): Scene {
  const cam = new Camera();
  let s = 0; // distance of block centre from the top, along the slope (m)
  let v = 0; // velocity DOWN the slope (m/s); negative = moving up
  let t = 0;
  let travelled = 0;
  let state: State = "rest";
  let trail: number[] = []; // past s values, for a fading trail

  const start = (p: Params) => {
    s = p.v0 > 0 ? S_MAX - 0.2 : L * 0.3; // fired up from near the bottom, else start mid-slope
    v = -p.v0;
    t = 0;
    travelled = 0;
    trail = [];
    state = p.v0 > 0 ? "up" : "rest";
  };

  return {
    reset(_vw, p) { start(p); },
    action(id, p) { if (id === "reset") start(p); },

    step(dt, p) {
      if (state === "bottom") return;
      const a = analyze(p);
      t += dt;

      if (v < 0) {
        // moving UP: gravity component AND kinetic friction both point down the slope
        state = "up";
        v += a.aUp * dt;
        if (v >= 0) v = 0; // momentarily at rest at the highest point
      } else {
        if (v === 0 && a.holds) {
          state = "rest";
          return; // static friction balances mg sinθ exactly
        }
        state = "sliding";
        v += ((a.along - a.fk) / p.m) * dt;
        if (v <= 0) v = 0; // θ lowered mid-slide: it decelerates and stops
      }
      s += v * dt;
      travelled += Math.abs(v * dt);
      if (s <= S_MIN) { s = S_MIN; v = 0; }
      if (s >= S_MAX) { s = S_MAX; v = 0; state = "bottom"; }
      if (trail.length === 0 || Math.abs(trail[trail.length - 1] - s) > 0.12) trail.push(s);
      if (trail.length > 40) trail.shift();
    },

    draw(ctx, vw, p) {
      const a = analyze(p);
      const g = geometry(p.theta);
      cam.follow({ minX: -1.5, maxX: g.bottom.x + 1.5, minY: 0, maxY: g.top.y + 2.4 }, vw, 0.15, { l: 30, r: 30, t: 90, b: 40 });
      const T = cam.toScreen;
      const px = cam.scale;
      grid(ctx, vw, cam);
      ground(ctx, cam.oy, 0, vw.width);

      // incline
      const [pt, pb, pc] = [T(g.top), T(g.bottom), T(g.corner)];
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.lineTo(pc.x, pc.y);
      ctx.closePath();
      ctx.fillStyle = "#1c2029";
      ctx.fill();
      ctx.strokeStyle = "#3a4150";
      ctx.lineWidth = 2;
      ctx.stroke();

      // θ arc at the bottom vertex
      const th = p.theta * DEG;
      ctx.beginPath();
      ctx.arc(pb.x, pb.y, 46, Math.PI, Math.PI + th);
      ctx.strokeStyle = COLORS.muted;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      label(ctx, `θ = ${fmt(p.theta, 1)}°`, pb.x - 60, pb.y - 14, COLORS.text, "right", "13px ui-monospace, monospace");

      // ghost line at the angle of repose: steeper than this and it slips
      const r = a.repose * DEG;
      const ghostLen = L * 0.7;
      const ghostEnd = T({ x: g.bottom.x - ghostLen * Math.cos(r), y: ghostLen * Math.sin(r) });
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(255,209,102,0.45)";
      ctx.beginPath();
      ctx.moveTo(pb.x, pb.y);
      ctx.lineTo(ghostEnd.x, ghostEnd.y);
      ctx.stroke();
      ctx.restore();
      label(ctx, `slips above ${fmt(a.repose, 1)}°`, ghostEnd.x, ghostEnd.y - 12, "rgba(255,209,102,0.85)", "center");

      // fading trail of where the block has been
      trail.forEach((ts, i) => {
        const q = T(add(add(g.top, scale(g.d, ts)), scale(g.n, BLOCK / 2)));
        ctx.fillStyle = `rgba(255,138,61,${(0.35 * i) / trail.length})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // block
      const c = add(add(g.top, scale(g.d, s)), scale(g.n, BLOCK / 2));
      const cs = T(c);
      const col = state === "rest" ? "#4bd28f" : state === "up" ? "#c792ff" : state === "bottom" ? "#6b7280" : "#ff8a3d";
      block(ctx, cs.x, cs.y, BLOCK * px, BLOCK * px, col, th);

      // forces: scale so mg is always ~2.6 m long
      const k = 2.6 / a.W;
      // friction: static = just enough; kinetic opposes motion
      const fVec: Vec2 | null =
        state === "rest" ? scale(g.d, -a.along * k)
        : state === "sliding" ? scale(g.d, -a.fk * k)
        : state === "up" ? scale(g.d, a.fk * k)
        : null;
      arrow(ctx, T, c, { x: 0, y: -a.W * k }, COLORS.weight, "mg");
      arrow(ctx, T, c, scale(g.n, a.N * k), COLORS.normal, "N");
      if (fVec) arrow(ctx, T, add(c, scale(g.n, -BLOCK / 2)), fVec, COLORS.friction, state === "rest" ? "fₛ" : "fₖ");
      arrow(ctx, T, c, scale(g.d, a.along * k), "rgba(255,93,108,0.55)", "mg sinθ", { dashed: true, width: 1.5 });
      arrow(ctx, T, c, scale(g.n, -a.perp * k), "rgba(255,93,108,0.55)", "mg cosθ", { dashed: true, width: 1.5 });
      if (Math.abs(v) > 0.01) {
        arrow(ctx, T, add(c, scale(g.n, BLOCK * 0.9)), scale(g.d, Math.sign(v) * Math.min(2.2, 0.4 + Math.abs(v) * 0.25)), COLORS.accel, "v", { width: 3 });
      }

      // status + live readout
      const status =
        state === "rest" ? ["AT REST · static friction holds", "#4bd28f"]
        : state === "up" ? ["GOING UP · gravity + friction both slow it", "#c792ff"]
        : state === "sliding" ? ["SLIDING DOWN · kinetic friction", "#ff8a3d"]
        : ["Reached the bottom · hit Run again", "#9aa3b2"];
      badge(ctx, 14, 14, status[0], status[1]);
      const aNow = state === "sliding" ? (a.along - a.fk) / p.m : state === "up" ? a.aUp : 0;
      label(ctx, `v = ${fmt(Math.abs(v))} m/s ${v < 0 ? "↑" : v > 0 ? "↓" : ""}   a = ${fmt(aNow)} m/s²   t = ${fmt(t)} s   distance = ${fmt(travelled)} m`, 14, 58, COLORS.muted);
    },
  };
}

export const incline: SceneDef = {
  id: "incline",
  name: "Block on incline",
  blurb: "Raise θ until it slips, or push it up the slope with v₀ and see whether it comes back down.",
  controls: [
    { key: "theta", label: "θ (angle)", unit: "°", min: 5, max: 60, step: 0.5, default: 30 },
    { key: "m", label: "m (mass)", unit: "kg", min: 0.5, max: 10, step: 0.1, default: 2 },
    { key: "mus", label: "μs (static)", min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: "muk", label: "μk (kinetic)", min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: "v0", label: "v₀ (push up the slope)", unit: "m/s", min: 0, max: 12, step: 0.1, default: 0 },
  ],
  actions: [{ id: "reset", label: "↺ Run again", primary: true }],
  create: createIncline,
  solve(p) {
    const a = analyze(p);
    const steps: SolutionStep[] = [
      { title: "1 · Resolve the weight", lines: [`mg = ${fmt(p.m, 1)} × ${G} = ${fmt(a.W)} N`, `along slope: mg sinθ = ${fmt(a.along)} N`, `into slope: mg cosθ = ${fmt(a.perp)} N`] },
      { title: "2 · Normal reaction", lines: [`No motion ⟂ slope, so N = mg cosθ = ${fmt(a.N)} N`] },
    ];
    if (p.v0 > 0) {
      steps.push({
        title: `3 · Going up (v₀ = ${fmt(p.v0, 1)} m/s)`,
        lines: [
          `mg sinθ and f_k BOTH point down the slope`,
          `deceleration = g(sinθ + μk cosθ) = ${fmt(a.aUp)} m/s²`,
          `stops after t = v₀/a = ${fmt(p.v0 / a.aUp)} s`,
          `distance up = v₀²/2a = ${fmt((p.v0 * p.v0) / (2 * a.aUp))} m`,
        ],
      });
    }
    const n = p.v0 > 0 ? 4 : 3;
    steps.push({
      title: `${n} · ${p.v0 > 0 ? "At the top it's at rest. Does it come back?" : "Can static friction hold it?"}`,
      lines: [`f_s,max = μs N = ${fmt(p.mus)} × ${fmt(a.N)} = ${fmt(a.fsMax)} N`, `needed: mg sinθ = ${fmt(a.along)} N`],
      verdict: a.holds
        ? { text: `${fmt(a.along)} ≤ ${fmt(a.fsMax)} → ${p.v0 > 0 ? "stays at the top" : "stays at rest"}`, tone: "good" }
        : { text: `${fmt(a.along)} > ${fmt(a.fsMax)} → ${p.v0 > 0 ? "slides back down" : "it slips"}`, tone: "warn" },
    });
    if (a.holds) {
      steps.push({ title: `${n + 1} · Friction actually acting`, lines: [`f_s = mg sinθ = ${fmt(a.along)} N, a = 0`, `Not μs N! Static friction is only as big as it needs to be.`] });
    } else {
      steps.push({
        title: `${n + 1} · Sliding down`,
        lines: [
          `f_k = μk N = ${fmt(a.mukEff)} × ${fmt(a.N)} = ${fmt(a.fk)} N (points UP the slope)`,
          `a = g(sinθ − μk cosθ) = ${fmt(a.aSlide)} m/s²`,
          p.v0 > 0 ? `a_down (${fmt(a.aSlide)}) < a_up (${fmt(a.aUp)}), so coming down takes LONGER than going up` : `Mass cancels out, so changing m doesn't change a.`,
        ],
      });
    }
    steps.push({
      title: "Shortcut",
      lines: [`Slips when tanθ > μs`, `tan ${fmt(p.theta, 1)}° = ${fmt(Math.tan(p.theta * DEG), 3)} vs μs = ${fmt(p.mus)}`, `Angle of repose = tan⁻¹(μs) = ${fmt(a.repose, 1)}°`],
    });
    if (p.muk > p.mus) {
      steps.push({ title: "Heads up", lines: [`μk > μs isn't physical. Using μk = μs = ${fmt(p.mus)}.`], verdict: { text: "Set μk ≤ μs", tone: "info" } });
    }
    return steps;
  },
};
