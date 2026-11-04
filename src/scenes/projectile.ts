import type { Params, Scene, SceneDef, SolutionStep, Vec2 } from "../engine/types";
import { Camera, type Bounds } from "../engine/camera";
import { COLORS, HAND, arrow, badge, ballDoodle, grid, ground, label, shape } from "../engine/draw";
import { clock, dinoFriend, googlyGuy } from "../buddy/critters";

const DEG = Math.PI / 180;
const fmt = (x: number, d = 2) => (Math.abs(x) >= 1000 ? x.toFixed(0) : x.toFixed(d));
const BALL_COLORS = ["#ff8a3d", "#6ec3ee", "#b48cf0", "#6fcf97", "#ffd166", "#ff9fb4"];
const MAX_BALLS = 6;

interface Pt { t: number; x: number; y: number; vx: number; vy: number }
interface Path {
  pts: Pt[];
  land?: Pt; // first time it touches the ground
  apex?: Pt; // highest point before first landing
  wallHit?: Pt;
  end: number; // time it comes to rest / leaves
}

/** Exact constant-acceleration stepping with exact event times for ground and wall hits. */
function simulate({ v, angle, h, g, e, wall }: Params): Path {
  let x = 0, y = h, vx = v * Math.cos(angle * DEG), vy = v * Math.sin(angle * DEG), t = 0;
  const uy = vy;
  const T0 = (uy + Math.sqrt(uy * uy + 2 * g * h)) / g || 0.5;
  const base = Math.min(Math.max(T0 / 500, 0.0005), 0.05);
  const pts: Pt[] = [{ t, x, y, vx, vy }];
  let land: Pt | undefined, apex: Pt | undefined = { t, x, y, vx, vy }, wallHit: Pt | undefined;
  let bounces = 0;

  for (let i = 0; i < 40000; i++) {
    let dt = base;
    let event: "ground" | "wall" | null = null;
    // ground: y + vy t − ½ g t² = 0
    if (y + vy * dt - 0.5 * g * dt * dt <= 0) {
      dt = (vy + Math.sqrt(Math.max(vy * vy + 2 * g * y, 0))) / g;
      event = "ground";
    }
    if (wall > 0 && vx > 0 && x + vx * dt >= wall) {
      const tw = (wall - x) / vx;
      if (tw <= dt) { dt = tw; event = "wall"; }
    }
    x += vx * dt;
    y = Math.max(0, y + vy * dt - 0.5 * g * dt * dt);
    vy -= g * dt;
    t += dt;
    const p = { t, x, y, vx, vy };
    pts.push(p);
    if (!land && y > (apex?.y ?? -1)) apex = p;

    if (event === "wall") {
      wallHit ??= { ...p };
      vx = -e * vx;
    } else if (event === "ground") {
      if (!land) land = { ...p };
      const up = -vy * e;
      bounces++;
      if (e === 0 || up < 0.4 || bounces >= 4) {
        pts[pts.length - 1] = { ...p, vx: 0, vy: 0 };
        return { pts, land, apex, wallHit, end: t };
      }
      vy = up;
      pts[pts.length - 1] = { ...p, vy };
    }
  }
  return { pts, land, apex, wallHit, end: t };
}

/** Position on a path at time t (linear between samples, which are dense). */
function at(path: Path, t: number): Pt {
  const p = path.pts;
  if (t >= path.end) return p[p.length - 1];
  let lo = 0, hi = p.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = p[lo], b = p[hi];
  const k = (t - a.t) / (b.t - a.t || 1);
  return { t, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, vx: a.vx + (b.vx - a.vx) * k, vy: a.vy + (b.vy - a.vy) * k };
}

function bounds(paths: Path[], params: Params): Bounds {
  const b = { minX: 0, maxX: 4, minY: 0, maxY: Math.max(params.h, 3) };
  for (const path of paths) {
    for (let i = 0; i < path.pts.length; i += 4) {
      const p = path.pts[i];
      b.minX = Math.min(b.minX, p.x);
      b.maxX = Math.max(b.maxX, p.x);
      b.maxY = Math.max(b.maxY, p.y);
    }
    const last = path.pts[path.pts.length - 1];
    b.maxX = Math.max(b.maxX, last.x);
  }
  if (params.wall > 0) b.maxX = Math.max(b.maxX, params.wall * 1.08);
  // headroom for labels, and keep a sane minimum size
  const w = b.maxX - b.minX, hgt = b.maxY - b.minY;
  b.maxY += Math.max(hgt * 0.12, 0.6);
  b.maxX += w * 0.04;
  return b;
}

/** A "nice" time step so the predicted path gets ~8–20 equal-time dots. */
function niceDt(T: number) {
  const raw = T / 12;
  const p10 = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1, 2, 5, 10].map((k) => k * p10).find((s) => s >= raw)!;
}

interface Ball { path: Path; t: number; color: string; snap: Params }

function createProjectile(): Scene {
  const cam = new Camera();
  let balls: Ball[] = [];
  let timeScale = 1;
  let colorIdx = 0;
  let predicted: Path | null = null;
  let predictedKey = "";
  let drag: Vec2 | null = null;
  let hover: Vec2 | null = null;
  let landed = 0; // how many balls have touched down (dino hops on each new one)
  let jumpAt = -10;

  const launch = (p: Params) => {
    const path = simulate(p);
    balls.push({ path, t: 0, color: BALL_COLORS[colorIdx++ % BALL_COLORS.length], snap: { ...p } });
    if (balls.length > MAX_BALLS) balls.shift();
    const T = path.land?.t ?? path.end;
    timeScale = Math.max(0.35, T / 3.5); // every flight takes ~3.5 s on screen
  };

  const predict = (p: Params) => {
    const key = JSON.stringify(p);
    if (key !== predictedKey) {
      predicted = simulate(p);
      predictedKey = key;
    }
    return predicted!;
  };

  return {
    status() {
      if (drag) return "aiming";
      const flying = balls.filter((b) => b.t < b.path.end);
      if (flying.length) {
        const b = flying[flying.length - 1];
        if (b.snap.v >= 100) return "fast";
        if (b.path.wallHit && b.t >= b.path.wallHit.t) return "wall";
        return "flying";
      }
      if (balls.length >= 3) return "compare";
      return balls.length ? "landed" : "idle";
    },

    reset() {

      balls = [];
      colorIdx = 0;
      timeScale = 1;
    },

    step(dt) {
      for (const b of balls) if (b.t < b.path.end) b.t = Math.min(b.path.end, b.t + dt * timeScale);
    },

    action(id, p) {
      if (id === "launch") launch(p);
      if (id === "clear") { balls = []; colorIdx = 0; }
    },

    pointer(kind, s, p) {
      const L = cam.toScreen({ x: 0, y: p.h });
      if (kind === "down" && Math.hypot(s.x - L.x, s.y - L.y) < 60) drag = s;
      if (kind === "leave") hover = null;
      else hover = s;
      if (!drag) return;
      if (kind === "move" || kind === "down" || kind === "up") {
        const dx = Math.max(s.x - L.x, 0.001), dy = L.y - s.y;
        const angle = Math.round(Math.max(-90, Math.min(90, Math.atan2(dy, dx) / DEG)));
        const dist = Math.hypot(dx, dy);
        const v = Math.round(Math.min(300, 0.0012 * dist * dist) * 2) / 2; // quadratic: fine control for small speeds, 300 m/s at ~500 px
        drag = s;
        const next = { ...p, angle, v };
        if (kind === "up") {
          drag = null;
          if (v > 0) launch(next);
        }
        return { angle, v };
      }
    },

    draw(ctx, vw, p) {

      const pred = predict(p);
      if (!drag) cam.follow(bounds([pred, ...balls.map((b) => b.path)], p), vw, 0.12, { l: 130, r: 110, t: 70, b: 50 });
      const T = cam.toScreen;

      grid(ctx, vw, cam);
      ground(ctx, cam.oy, 0, vw.width);

      // wall
      if (p.wall > 0) {
        const w0 = T({ x: p.wall, y: 0 });
        const top = Math.min(T({ x: 0, y: Math.max(p.h, pred.apex?.y ?? 0) * 1.1 + 1 }).y, w0.y - 40);
        shape(ctx, [{ x: w0.x, y: top }, { x: w0.x + 14, y: top }, { x: w0.x + 14, y: w0.y }, { x: w0.x, y: w0.y }], COLORS.paperDeep);
        label(ctx, `wall · ${fmt(p.wall, 1)} m`, w0.x + 14, top + 10, COLORS.muted);
      }

      // tower
      const base = T({ x: 0, y: 0 }), top = T({ x: 0, y: p.h });
      if (p.h > 0) {
        const tw = 26; // tower drawn as a doodled brick column
        shape(ctx, [{ x: base.x - tw, y: top.y }, { x: base.x, y: top.y }, { x: base.x, y: base.y }, { x: base.x - tw, y: base.y }], "#e8b48a");
        ctx.strokeStyle = "rgba(36,38,44,0.35)";
        ctx.lineWidth = 1;
        for (let yy = top.y + 12; yy < base.y - 4; yy += 12) {
          ctx.beginPath(); ctx.moveTo(base.x - tw + 3, yy); ctx.lineTo(base.x - 3, yy); ctx.stroke();
        }
        label(ctx, `h = ${fmt(p.h, 1)} m`, base.x - 32, (top.y + base.y) / 2, COLORS.muted, "right");
      }

      // ---- the gang: googly guy watches the action, dino hops when a ball lands ----
      const nowLanded = balls.filter((b) => b.path.land && b.t >= b.path.land.t).length;
      if (nowLanded > landed) jumpAt = clock();
      landed = nowLanded;
      const liveNow = [...balls].reverse().find((b) => b.t < b.path.end);
      const watch = liveNow ? T(at(liveNow.path, liveNow.t)) : drag ?? hover ?? (pred.land ? T(pred.land) : null);
      googlyGuy(ctx, Math.max(36, base.x - 70), cam.oy, 74, watch);
      dinoFriend(ctx, vw.width - 58, cam.oy, 84, jumpAt, true);

      // ---- predicted path (the "what if") ----
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = "rgba(36,38,44,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pred.pts.forEach((q, i) => {
        const s = T(q);
        if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      });
      ctx.stroke();
      ctx.restore();

      // equal-time dots: horizontal gaps are equal because vx never changes
      const Tland = pred.land?.t ?? pred.end;
      if (Tland > 0) {
        const dtDot = niceDt(Tland);
        ctx.fillStyle = "rgba(36,38,44,0.7)";
        for (let t = dtDot; t < Tland - 1e-9; t += dtDot) {
          const s = T(at(pred, t));
          ctx.beginPath();
          ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        const lp = T(pred.land ?? pred.pts[pred.pts.length - 1]);
        label(ctx, `dots every ${+dtDot.toFixed(4)} s`, lp.x, lp.y - 42, "rgba(36,38,44,0.6)", "center");
      }

      // apex + landing markers
      if (pred.apex && pred.apex.t > 0.0001) {
        const a = T(pred.apex);
        ctx.strokeStyle = "rgba(208,143,0,0.5)";
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x, cam.oy);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, `H = ${fmt(pred.apex.y)} m`, a.x, a.y - 16, COLORS.friction, "center");
      }
      if (pred.land) {
        const l = T(pred.land);
        ctx.fillStyle = COLORS.friction;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y - 2);
        ctx.lineTo(l.x - 6, l.y - 12);
        ctx.lineTo(l.x + 6, l.y - 12);
        ctx.fill();
        label(ctx, `R = ${fmt(pred.land.x)} m · T = ${fmt(pred.land.t)} s`, l.x, l.y - 24, COLORS.friction, "center");
      }

      // ---- launched balls: glowing trails ----
      for (const b of balls) {
        const now = at(b.path, b.t);
        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        let started = false;
        for (const q of b.path.pts) {
          if (q.t > b.t) break;
          const s = T(q);
          if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
        }
        const sNow = T(now);
        ctx.lineTo(sNow.x, sNow.y);
        ctx.stroke();
        ctx.restore();

        ballDoodle(ctx, sNow.x, sNow.y, 9, b.color);
      }

      // velocity + components on the newest ball still flying
      const live = [...balls].reverse().find((b) => b.t < b.path.end);
      if (live) {
        const now = at(live.path, live.t);
        const k = 70 / (cam.scale * Math.max(live.snap.v, Math.hypot(now.vx, now.vy), 1));
        arrow(ctx, T, now, { x: now.vx * k, y: now.vy * k }, COLORS.velocity, "v");
        arrow(ctx, T, now, { x: now.vx * k, y: 0 }, "rgba(47,127,216,0.6)", "vx", { dashed: true, width: 1.5 });
        arrow(ctx, T, now, { x: 0, y: now.vy * k }, "rgba(47,127,216,0.6)", "vy", { dashed: true, width: 1.5 });
      }

      // launcher + aim line
      ctx.save();
      ctx.translate(top.x, top.y);
      ctx.rotate(-p.angle * DEG);
      ctx.fillStyle = "#7d7668";
      ctx.strokeStyle = "#24262c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-4, -7, 38, 14, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ballDoodle(ctx, top.x, top.y, 9, "#ff8a3d");
      if (drag) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,138,61,0.8)";
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(drag.x, drag.y);
        ctx.stroke();
        ctx.restore();
        label(ctx, `${fmt(p.v, 1)} m/s @ ${p.angle}°`, drag.x + 12, drag.y - 12, "#d9661a", "left");
      }

      // ---- HUD: legend of launched balls ----
      let y = 16;
      const sp = timeScale >= 1 ? `⏩ ${fmt(timeScale, 1)}× speed` : `🐢 ${fmt(timeScale, 2)}× slow-mo`;
      if (balls.length) { badge(ctx, 14, y, sp, "#e3dccb", COLORS.muted); y += 36; }
      for (const b of balls) {
        const s = b.snap;
        ballDoodle(ctx, 22, y + 6, 6, b.color);
        const R = b.path.land ? `R=${fmt(b.path.land.x, 1)} m  T=${fmt(b.path.land.t, 2)} s` : "";
        label(ctx, `v=${fmt(s.v, 1)} θ=${s.angle}° h=${fmt(s.h, 1)}   ${R}`, 34, y + 6, COLORS.text);
        y += 20;
      }
      if (!balls.length) {
        const narrow = vw.width < 640;
        label(ctx, narrow ? "Drag from the launcher to aim." : "Drag from the launcher to aim and release to fire, or hit Launch.", 16, 24, COLORS.muted, "left", `600 17px ${HAND}`);
        label(ctx, narrow ? "Dotted line = where it WILL go." : "Dotted line = where it WILL go. Change a slider and watch it move.", 16, 44, COLORS.muted, "left", `600 17px ${HAND}`);
      }

      // ---- hover probe: read t, x, y, v at any point on any path ----
      if (hover && !drag) {
        let best: { q: Pt; d: number; c: string } | null = null;
        const paths: [Path, string, number][] = [[pred, "#24262c", Infinity], ...balls.map((b) => [b.path, b.color, b.t] as [Path, string, number])];
        for (const [path, c, tmax] of paths) {
          for (let i = 0; i < path.pts.length; i += 2) {
            const q = path.pts[i];
            if (q.t > tmax) break;
            const s = T(q);
            const d = Math.hypot(s.x - hover.x, s.y - hover.y);
            if (d < 18 && (!best || d < best.d)) best = { q, d, c };
          }
        }
        if (best) {
          const q = best.q, s = T(q);
          ctx.fillStyle = best.c;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
          ctx.fill();
          const lines = [`t = ${fmt(q.t)} s`, `x = ${fmt(q.x)} m   y = ${fmt(q.y)} m`, `vx = ${fmt(q.vx)}   vy = ${fmt(q.vy)} m/s`, `|v| = ${fmt(Math.hypot(q.vx, q.vy))} m/s`];
          const bx = Math.min(s.x + 14, vw.width - 220), by = Math.max(s.y - 90, 8);
          ctx.fillStyle = "rgba(255,253,247,0.96)";
          ctx.strokeStyle = "#24262c";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, 220, 84, 8);
          ctx.fill();
          ctx.stroke();
          lines.forEach((l, i) => label(ctx, l, bx + 10, by + 14 + i * 19, COLORS.text, "left", i ? undefined : `700 16px ${HAND}`));
        }
      }
    },
  };
}

export const projectile: SceneDef = {
  id: "projectile",
  name: "Projectile lab",
  blurb: "Drag to aim. The dotted line updates live, so try the same shot at 5, 3 and 300 m/s and compare.",
  controls: [
    { key: "v", label: "v (launch speed)", unit: "m/s", min: 0, max: 300, step: 0.5, default: 20 },
    { key: "angle", label: "θ (launch angle)", unit: "°", min: -90, max: 90, step: 1, default: 45 },
    { key: "h", label: "h (launch height)", unit: "m", min: 0, max: 200, step: 0.5, default: 0 },
    { key: "g", label: "g", unit: "m/s²", min: 1, max: 25, step: 0.1, default: 9.8 },
    { key: "e", label: "e (bounciness)", min: 0, max: 1, step: 0.05, default: 0 },
    { key: "wall", label: "wall at x (0 = no wall)", unit: "m", min: 0, max: 100, step: 0.5, default: 0 },
  ],
  actions: [
    { id: "launch", label: "🚀 Launch", primary: true },
    { id: "clear", label: "Clear balls" },
  ],
  create: createProjectile,
  solve(p) {
    const ux = p.v * Math.cos(p.angle * DEG), uy = p.v * Math.sin(p.angle * DEG);
    const disc = uy * uy + 2 * p.g * p.h;
    const T = (uy + Math.sqrt(disc)) / p.g;
    const R = ux * T;
    const vyLand = uy - p.g * T;
    const steps: SolutionStep[] = [
      {
        title: "1 · Split the launch velocity",
        lines: [`ux = v cosθ = ${fmt(ux)} m/s (never changes!)`, `uy = v sinθ = ${fmt(uy)} m/s`],
      },
      {
        title: "2 · Time of flight",
        lines: [
          p.h > 0 ? `0 = h + uy·T − ½gT²` : `0 = uy·T − ½gT²`,
          `T = (uy + √(uy² + 2gh)) / g = ${fmt(T)} s`,
        ],
        verdict: T <= 1e-9 ? { text: "Fired into the ground, T = 0", tone: "warn" } : undefined,
      },
      { title: "3 · Range", lines: [`R = ux · T = ${fmt(ux)} × ${fmt(T)} = ${fmt(R)} m`] },
    ];
    if (uy > 0) {
      steps.push({
        title: "4 · Max height",
        lines: [`at top vy = 0 → t = uy/g = ${fmt(uy / p.g)} s`, `H = h + uy²/2g = ${fmt(p.h + (uy * uy) / (2 * p.g))} m`],
      });
    }
    steps.push({
      title: "5 · Impact velocity",
      lines: [
        `vx = ${fmt(ux)}, vy = uy − gT = ${fmt(vyLand)} m/s`,
        `|v| = ${fmt(Math.hypot(ux, vyLand))} m/s at ${fmt(Math.abs(Math.atan2(vyLand, ux) / DEG), 1)}° below horizontal`,
      ],
    });
    if (p.wall > 0 && ux > 0) {
      const tw = p.wall / ux;
      const yw = p.h + uy * tw - 0.5 * p.g * tw * tw;
      steps.push(
        yw > 0
          ? {
              title: "6 · Hitting the wall",
              lines: [
                `reaches wall at t = d/ux = ${fmt(tw)} s, height ${fmt(yw)} m`,
                `after: vx → −e·ux = ${fmt(-p.e * ux)} m/s, vy unchanged`,
                `lands at x = d − e·ux(T − t_wall) = ${fmt(p.wall - p.e * ux * (T - tw))} m`,
              ],
              verdict: { text: "Wall only flips vx; the fall time T is the same", tone: "info" },
            }
          : { title: "6 · The wall", lines: [`lands at ${fmt(R)} m, before the wall at ${fmt(p.wall)} m`], verdict: { text: "Never reaches the wall", tone: "info" } },
      );
    }
    if (p.h === 0 && p.angle > 0) {
      steps.push({
        title: "Shortcut",
        lines: [`R = v² sin2θ / g = ${fmt((p.v * p.v * Math.sin(2 * p.angle * DEG)) / p.g)} m`, `Max range at 45°. θ and 90°−θ give the same R.`],
      });
    }
    return steps;
  },
};
