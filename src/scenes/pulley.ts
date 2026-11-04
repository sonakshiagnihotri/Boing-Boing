import type { Params, Scene, SceneDef, SolutionStep, Vec2 } from "../engine/types";
import { Camera, type Bounds } from "../engine/camera";
import { COLORS, add, arrow, badge, block, grid, ground, label, scale, shape } from "../engine/draw";
import { googlyGuy } from "../buddy/critters";

const G = 9.8;
const DEG = Math.PI / 180;
const fmt = (x: number, d = 2) => x.toFixed(d);
const MODES = ["Table + hanging", "Atwood machine", "Incline + hanging"];

/**
 * Sign convention everywhere: positive = m2 (the hanging block) moves DOWN.
 */
export function solveSystem({ mode, m1, m2, mu, theta }: Params) {
  const M = m1 + m2;
  if (mode === 1) {
    const a = ((m2 - m1) * G) / M;
    return { a, T: (2 * m1 * m2 * G) / M, f: 0, fmax: 0, N: 0, moving: Math.abs(a) > 1e-9, stuck: false };
  }
  if (mode === 0) {
    const N = m1 * G, fmax = mu * N, pull = m2 * G;
    if (pull <= fmax + 1e-9) return { a: 0, T: pull, f: pull, fmax, N, moving: false, stuck: true };
    const a = (pull - fmax) / M;
    return { a, T: m2 * (G - a), f: fmax, fmax, N, moving: true, stuck: false };
  }
  const t = theta * DEG;
  const N = m1 * G * Math.cos(t), fmax = mu * N, pull = m2 * G, down = m1 * G * Math.sin(t);
  if (pull > down + fmax + 1e-9) {
    const a = (pull - down - fmax) / M;
    return { a, T: m2 * (G - a), f: fmax, fmax, N, moving: true, stuck: false, down, pull };
  }
  if (down > pull + fmax + 1e-9) {
    const a = -(down - pull - fmax) / M;
    return { a, T: m2 * (G - a), f: -fmax, fmax, N, moving: true, stuck: false, down, pull };
  }
  // f > 0 means friction points down the slope (resisting m2's pull)
  return { a: 0, T: pull, f: pull - down, fmax, N, moving: false, stuck: true, down, pull };
}

const side = (m: number) => 0.55 + 0.16 * Math.sqrt(m); // heavier block = bigger box

interface Layout {
  bounds: Bounds;
  dMin: number;
  dMax: number;
  pulley: { c: Vec2; r: number };
}

function layout(p: Params): Layout {
  if (p.mode === 0) {
    const s2 = side(p.m2);
    const top0 = 3.7;
    return {
      bounds: { minX: -0.5, maxX: 8.2, minY: 0, maxY: 6.4 },
      dMin: 0,
      dMax: Math.min(3.3, top0 - s2 - 0.02),
      pulley: { c: { x: 6.3, y: 4.65 }, r: 0.35 },
    };
  }
  if (p.mode === 1) {
    const s1 = side(p.m1), s2 = side(p.m2);
    const top0 = 3.6, ceil = 6 - 0.6 - 0.25;
    return {
      bounds: { minX: -4.5, maxX: 4.5, minY: 0, maxY: 7.2 },
      dMin: -Math.min(top0 - s2 - 0.02, ceil - top0),
      dMax: Math.min(top0 - s1 - 0.02, ceil - top0),
      pulley: { c: { x: 0, y: 6 }, r: 0.6 },
    };
  }
  const t = p.theta * DEG, L = 7;
  const H = L * Math.sin(t), ped = Math.max(0, 3.6 - H);
  const top = { x: L * Math.cos(t), y: ped + H };
  const u = { x: Math.cos(t), y: Math.sin(t) }, n = { x: -Math.sin(t), y: Math.cos(t) };
  const r = 0.32;
  const c = add(add(top, scale(n, 0.5 - r)), scale(u, 0.25));
  const s2 = side(p.m2);
  const top0 = c.y - 1.4;
  const s0 = L * 0.4;
  return {
    bounds: { minX: -0.8, maxX: top.x + 2.2, minY: 0, maxY: top.y + 1.6 },
    dMin: -Math.min(s0 - 0.6, c.y - r - 0.3 - top0),
    dMax: Math.min(L - 0.9 - s0, top0 - s2 - 0.02),
    pulley: { c, r },
  };
}

function createPulley(): Scene {
  const cam = new Camera();
  let d = 0, v = 0, t = 0;
  let hit = false;
  let lastKey = "";

  const restart = () => { d = 0; v = 0; t = 0; hit = false; };

  return {
    reset() { restart(); },
    status(p) {
      const s = solveSystem(p);
      if (hit) return "hit";
      if (s.stuck) return "stuck";
      if (!s.moving) return "balanced";
      return p.mode === 1 ? "atwood" : "moving";
    },

    step(dt, p) {
      // structural changes (mode, angle) restart the run so geometry stays valid
      const key = `${p.mode}|${p.theta}`;
      if (key !== lastKey) { lastKey = key; restart(); }
      if (hit) return;
      const s = solveSystem(p);
      const L = layout(p);
      if (!s.moving) { v = 0; return; }
      v += s.a * dt;
      d += v * dt;
      t += dt;
      if (d >= L.dMax || d <= L.dMin) {
        d = Math.max(L.dMin, Math.min(L.dMax, d));
        v = 0;
        hit = true;
      }
    },

    draw(ctx, vw, p) {

      const L = layout(p);
      const s = solveSystem(p);
      cam.follow(L.bounds, vw, 0.2, { l: 40, r: 40, t: 80, b: 40 });
      const T = cam.toScreen;
      const px = cam.scale;
      grid(ctx, vw, cam);
      ground(ctx, cam.oy, 0, vw.width);

      const k = 1.9 / Math.max(p.m1 * G, p.m2 * G); // biggest weight ≈ 1.9 m long
      const aArrow = (from: Vec2, dir: Vec2) => {
        if (!s.moving || hit) return;
        const len = Math.min(1.4, Math.abs(s.a) * 0.18 + 0.35);
        arrow(ctx, T, from, scale(dir, len * Math.sign(s.a)), COLORS.accel, "a", { width: 3 });
      };
      const string = (a: Vec2, b: Vec2) => {
        const A = T(a), B = T(b);
        ctx.save();
        ctx.strokeStyle = "#24262c";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
        ctx.restore();
      };

      const { c: pc, r: pr } = L.pulley;
      let m1c: Vec2, m2c: Vec2;
      const s2 = side(p.m2);

      const later: (() => void)[] = []; // blocks drawn after arrows so labels stay readable
      if (p.mode === 0) {
        // table
        const tl = T({ x: 0, y: 4.5 }), tr = T({ x: 6.3, y: 4.5 });
        const rect = (x: number, y: number, w: number, h: number) => shape(ctx, [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], "#d9a066");
        rect(tl.x + 0.3 * px, tl.y, 0.2 * px, cam.oy - tl.y);
        rect(tr.x - 0.6 * px, tl.y, 0.2 * px, cam.oy - tl.y);
        rect(tl.x, tl.y, tr.x - tl.x, 0.22 * px);
        m1c = { x: 2.0 + d, y: 5.0 };
        m2c = { x: pc.x + pr, y: 3.7 - d - s2 / 2 };
        string({ x: m1c.x + 0.5, y: 5.0 }, { x: pc.x, y: pc.y + pr });
        string({ x: pc.x + pr, y: pc.y }, { x: m2c.x, y: m2c.y + s2 / 2 });
        const M1 = T(m1c), M2 = T(m2c);
        later.push(() => block(ctx, M1.x, M1.y, px, px, s.stuck ? "#6fcf97" : "#ff8a3d", 0, `m₁ ${fmt(p.m1, 1)}`));
        later.push(() => block(ctx, M2.x, M2.y, s2 * px, s2 * px, "#6ec3ee", 0, `m₂ ${fmt(p.m2, 1)}`));
        // forces on m1
        arrow(ctx, T, m1c, { x: 0, y: -p.m1 * G * k }, COLORS.weight, "m₁g");
        arrow(ctx, T, m1c, { x: 0, y: s.N * k }, COLORS.normal, "N");
        arrow(ctx, T, { x: m1c.x + 0.5, y: m1c.y }, { x: s.T * k, y: 0 }, COLORS.tension, "T");
        arrow(ctx, T, { x: m1c.x - 0.5, y: m1c.y - 0.35 }, { x: -s.f * k, y: 0 }, COLORS.friction, s.stuck ? "fₛ" : "fₖ");
        // forces on m2
        arrow(ctx, T, m2c, { x: 0, y: -p.m2 * G * k }, COLORS.weight, "m₂g");
        arrow(ctx, T, { x: m2c.x, y: m2c.y + s2 / 2 }, { x: 0, y: s.T * k }, COLORS.tension, "T");
        aArrow({ x: m1c.x, y: m1c.y + 0.85 }, { x: 1, y: 0 });
        aArrow({ x: m2c.x - s2 / 2 - 0.35, y: m2c.y }, { x: 0, y: -1 });
      } else if (p.mode === 1) {
        const s1 = side(p.m1);
        // ceiling + rod
        const ce = T({ x: -1.2, y: 7 });
        shape(ctx, [{ x: ce.x, y: ce.y - 10 }, { x: ce.x + 2.4 * px, y: ce.y - 10 }, { x: ce.x + 2.4 * px, y: ce.y }, { x: ce.x, y: ce.y }], "#d9a066");
        string({ x: 0, y: 7 }, pc);
        m1c = { x: -pr, y: 3.6 + d - s1 / 2 };
        m2c = { x: pr, y: 3.6 - d - s2 / 2 };
        string({ x: -pr, y: pc.y }, { x: m1c.x, y: m1c.y + s1 / 2 });
        string({ x: pr, y: pc.y }, { x: m2c.x, y: m2c.y + s2 / 2 });
        const M1 = T(m1c), M2 = T(m2c);
        later.push(() => block(ctx, M1.x, M1.y, s1 * px, s1 * px, "#ff8a3d", 0, `m₁ ${fmt(p.m1, 1)}`));
        later.push(() => block(ctx, M2.x, M2.y, s2 * px, s2 * px, "#6ec3ee", 0, `m₂ ${fmt(p.m2, 1)}`));
        arrow(ctx, T, { x: m1c.x - 0.15, y: m1c.y }, { x: 0, y: -p.m1 * G * k }, COLORS.weight, "m₁g");
        arrow(ctx, T, { x: m1c.x, y: m1c.y + s1 / 2 }, { x: 0, y: s.T * k }, COLORS.tension, "T");
        arrow(ctx, T, { x: m2c.x + 0.15, y: m2c.y }, { x: 0, y: -p.m2 * G * k }, COLORS.weight, "m₂g");
        arrow(ctx, T, { x: m2c.x, y: m2c.y + s2 / 2 }, { x: 0, y: s.T * k }, COLORS.tension, "T");
        aArrow({ x: m1c.x - s1 / 2 - 0.4, y: m1c.y }, { x: 0, y: 1 });
        aArrow({ x: m2c.x + s2 / 2 + 0.4, y: m2c.y }, { x: 0, y: -1 });
      } else {
        const th = p.theta * DEG, Ls = 7;
        const H = Ls * Math.sin(th), ped = Math.max(0, 3.6 - H);
        const corner = { x: 0, y: ped }, topV = { x: Ls * Math.cos(th), y: ped + H }, foot = { x: topV.x, y: ped };
        const u = { x: Math.cos(th), y: Math.sin(th) }, n = { x: -Math.sin(th), y: Math.cos(th) };
        if (ped > 0) {
          const a = T({ x: -0.3, y: ped }), b = T({ x: topV.x + 0.3, y: 0 });
          shape(ctx, [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }, { x: a.x, y: b.y }], "#e8dcc2");
        }
        const [A, B, C] = [T(corner), T(topV), T(foot)];
        shape(ctx, [A, B, C], "#d9a066");
        ctx.beginPath();
        ctx.arc(A.x, A.y, 40, -th, 0);
        ctx.strokeStyle = COLORS.muted;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        label(ctx, `θ = ${fmt(p.theta, 0)}°`, A.x + 48, A.y - 12, COLORS.text);

        const sPos = Ls * 0.4 + d;
        m1c = add(add(corner, scale(u, sPos)), scale(n, 0.5));
        m2c = { x: pc.x + pr, y: pc.y - 1.4 - d - s2 / 2 };
        string(add(m1c, scale(u, 0.5)), add(pc, scale(n, pr)));
        string({ x: pc.x + pr, y: pc.y }, { x: m2c.x, y: m2c.y + s2 / 2 });
        const M1 = T(m1c), M2 = T(m2c);
        later.push(() => block(ctx, M1.x, M1.y, px, px, s.stuck ? "#6fcf97" : "#ff8a3d", -th, `m₁ ${fmt(p.m1, 1)}`));
        later.push(() => block(ctx, M2.x, M2.y, s2 * px, s2 * px, "#6ec3ee", 0, `m₂ ${fmt(p.m2, 1)}`));
        arrow(ctx, T, m1c, { x: 0, y: -p.m1 * G * k }, COLORS.weight, "m₁g");
        arrow(ctx, T, m1c, scale(n, s.N * k), COLORS.normal, "N");
        arrow(ctx, T, add(m1c, scale(u, 0.5)), scale(u, s.T * k), COLORS.tension, "T");
        if (Math.abs(s.f) > 1e-6) arrow(ctx, T, add(add(m1c, scale(u, -0.5)), scale(n, -0.35)), scale(u, -s.f * k), COLORS.friction, s.stuck ? "fₛ" : "fₖ");
        arrow(ctx, T, m2c, { x: 0, y: -p.m2 * G * k }, COLORS.weight, "m₂g");
        arrow(ctx, T, { x: m2c.x, y: m2c.y + s2 / 2 }, { x: 0, y: s.T * k }, COLORS.tension, "T");
        aArrow(add(m1c, scale(n, 0.95)), u);
        aArrow({ x: m2c.x + s2 / 2 + 0.35, y: m2c.y }, { x: 0, y: -1 });
      }

      later.forEach((f) => f());

      // pulley: spins with the string (θ = d / r)
      const P = T(pc), R = pr * px;
      ctx.save();
      ctx.translate(P.x, P.y);
      ctx.rotate(d / pr);
      ctx.fillStyle = "#cfd8e6";
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#24262c";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = "#24262c";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(R * 0.85, 0);
        ctx.stroke();
      }
      ctx.restore();

      // googly guy keeping an eye on m₂
      googlyGuy(ctx, 44, cam.oy, 62, T(m2c));

      // HUD
      const status = s.stuck
        ? ["STUCK · friction holds it", "#6fcf97"]
        : !s.moving ? ["BALANCED · a = 0", "#6fcf97"]
        : hit ? ["Hit the end · press Reset", "#7d7668"]
        : [`MOVING · a = ${fmt(Math.abs(s.a))} m/s²`, "#ff8a3d"];
      badge(ctx, 14, 14, status[0], status[1]);
      label(ctx, `T = ${fmt(s.T)} N    v = ${fmt(Math.abs(v))} m/s    moved = ${fmt(Math.abs(d))} m    t = ${fmt(t)} s`, 14, 58, COLORS.muted);
      if (p.mode !== 1) label(ctx, `μ = ${fmt(p.mu)}`, 14, 78, COLORS.muted);
    },
  };
}

export const pulley: SceneDef = {
  id: "pulley",
  name: "Strings & pulleys",
  blurb: "Three classic string questions. Change the masses or μ and see whether it moves, which way, and how hard the string pulls.",
  controls: [
    { key: "mode", label: "setup", min: 0, max: 2, step: 1, default: 0, options: MODES },
    { key: "m1", label: "m₁", unit: "kg", min: 0.5, max: 10, step: 0.1, default: 3 },
    { key: "m2", label: "m₂ (hanging)", unit: "kg", min: 0.5, max: 10, step: 0.1, default: 2 },
    { key: "mu", label: "μ (friction on m₁)", min: 0, max: 1, step: 0.01, default: 0.2, showIf: { key: "mode", in: [0, 2] } },
    { key: "theta", label: "θ (incline)", unit: "°", min: 10, max: 70, step: 1, default: 30, showIf: { key: "mode", in: [2] } },
  ],
  create: createPulley,
  solve(p) {
    const s = solveSystem(p);
    const steps: SolutionStep[] = [];
    if (p.mode === 1) {
      steps.push(
        { title: "1 · FBD of each block", lines: [`m₂: m₂g − T = m₂a`, `m₁: T − m₁g = m₁a`, `(a = acceleration of m₂ downward)`] },
        { title: "2 · Add the equations", lines: [`(m₂ − m₁)g = (m₁ + m₂)a`, `a = (m₂ − m₁)g / (m₁ + m₂) = ${fmt(s.a)} m/s²`],
          verdict: s.a > 0 ? { text: "m₂ goes down", tone: "warn" } : s.a < 0 ? { text: "m₁ goes down", tone: "warn" } : { text: "Equal masses → no acceleration", tone: "good" } },
        { title: "3 · Tension", lines: [`T = 2m₁m₂g / (m₁ + m₂) = ${fmt(s.T)} N`, `Always between m₁g (${fmt(p.m1 * G)}) and m₂g (${fmt(p.m2 * G)})`] },
      );
      return steps;
    }
    if (p.mode === 0) {
      steps.push(
        { title: "1 · FBD of each block", lines: [`m₂: m₂g − T = m₂a`, `m₁: T − f = m₁a,  N = m₁g = ${fmt(s.N)} N`] },
        { title: "2 · Does it even move?", lines: [`pull = m₂g = ${fmt(p.m2 * G)} N`, `f_max = μN = ${fmt(p.mu)} × ${fmt(s.N)} = ${fmt(s.fmax)} N`],
          verdict: s.stuck ? { text: `${fmt(p.m2 * G)} ≤ ${fmt(s.fmax)} → stays put`, tone: "good" } : { text: `${fmt(p.m2 * G)} > ${fmt(s.fmax)} → it moves`, tone: "warn" } },
      );
      steps.push(
        s.stuck
          ? { title: "3 · Forces at rest", lines: [`a = 0, so T = m₂g = ${fmt(s.T)} N`, `friction = T = ${fmt(s.f)} N (not μN!)`] }
          : { title: "3 · Solve", lines: [`a = (m₂ − μm₁)g / (m₁ + m₂) = ${fmt(s.a)} m/s²`, `T = m₂(g − a) = ${fmt(s.T)} N`, `T < m₂g because m₂ is accelerating down`] },
      );
      return steps;
    }
    const t = p.theta * DEG;
    steps.push(
      { title: "1 · Forces on m₁ along the slope", lines: [`down-slope: m₁g sinθ = ${fmt(p.m1 * G * Math.sin(t))} N`, `N = m₁g cosθ = ${fmt(s.N)} N`, `f_max = μN = ${fmt(s.fmax)} N`] },
      { title: "2 · Which way does it want to go?", lines: [`m₂ pulls up-slope with m₂g = ${fmt(p.m2 * G)} N`],
        verdict: s.stuck
          ? { text: "Difference is within f_max → stays put", tone: "good" }
          : s.a > 0 ? { text: "m₂g wins → m₂ goes down, m₁ goes up", tone: "warn" } : { text: "m₁g sinθ wins → m₁ slides down", tone: "warn" } },
    );
    steps.push(
      s.stuck
        ? { title: "3 · At rest", lines: [`T = m₂g = ${fmt(s.T)} N`, `friction needed = |m₂g − m₁g sinθ| = ${fmt(Math.abs(s.f))} N`, `(acts ${s.f > 0 ? "down" : "up"} the slope)`] }
        : { title: "3 · Solve", lines: [
            s.a > 0 ? `a = (m₂g − m₁g sinθ − μm₁g cosθ)/(m₁+m₂)` : `a = (m₁g sinθ − m₂g − μm₁g cosθ)/(m₁+m₂)`,
            `a = ${fmt(Math.abs(s.a))} m/s²`, `T = ${fmt(s.T)} N`] },
    );
    return steps;
  },
};
