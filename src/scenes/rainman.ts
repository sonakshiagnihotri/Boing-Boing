import type { Params, Scene, SceneDef, SolutionStep, Vec2 } from "../engine/types";
import { Camera } from "../engine/camera";
import { COLORS, INK, arrow, badge, ground, label, sketchLine } from "../engine/draw";

const DEG = Math.PI / 180;
const fmt = (x: number, d = 2) => x.toFixed(d);
const HEAD = { y: 1.68, r: 0.15 };
const HAND = { x: 0.2, y: 1.15 };

/** Rain-man: rain velocity relative to the man = v_rain − v_man. Hold the umbrella against that. */
export function rainPhysics({ vr, vm, wind }: Params) {
  const relX = wind - vm; // horizontal velocity of rain as the man sees it (− = coming at him from the front)
  const alpha = Math.atan2(vm - wind, vr); // tilt forward from vertical
  return { relX, alpha, alphaDeg: alpha / DEG, relSpeed: Math.hypot(relX, vr), groundAngle: Math.atan2(wind, vr) / DEG };
}

interface Drop { x: number; y: number }
interface Splash { x: number; y: number; t: number }

/** Does segment p1→p2 cross segment q1→q2? */
function crosses(p1: Vec2, p2: Vec2, q1: Vec2, q2: Vec2) {
  const d = (a: Vec2, b: Vec2, c: Vec2) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(q1, q2, p1), d2 = d(q1, q2, p2), d3 = d(p1, p2, q1), d4 = d(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function canopy(tiltDeg: number) {
  const f = tiltDeg * DEG;
  const a = { x: Math.sin(f), y: Math.cos(f) }; // umbrella axis
  const p = { x: Math.cos(f), y: -Math.sin(f) }; // across the canopy
  const c = { x: a.x * 0.5, y: HEAD.y + a.y * 0.5 };
  return { a, p, c, e1: { x: c.x - p.x * 0.66, y: c.y - p.y * 0.66 }, e2: { x: c.x + p.x * 0.66, y: c.y + p.y * 0.66 } };
}

function createRainman(): Scene {
  const cam = new Camera();
  let xm = 0, t = 0;
  let drops: Drop[] = [];
  let splashes: Splash[] = [];
  let wet = 0; // recent hits, decays over time
  let soaked = 0; // 0..1, how dark the shirt is
  let spawnAcc = 0;

  const restart = () => { xm = 0; t = 0; drops = []; splashes = []; wet = 0; soaked = 0; };

  return {
    reset: restart,
    action(id, p) {
      if (id === "auto") return { tilt: Math.round(rainPhysics(p).alphaDeg) };
      if (id === "dry") { wet = 0; soaked = 0; }
    },
    status(p) {
      if (!p.umb) return "noUmb";
      return wet > 3 ? "wet" : "dry";
    },

    step(dt, p) {
      t += dt;
      const span = 14;
      const xPrev = xm;
      xm += p.vm * dt;
      // spawn rain across a wide band around the man
      spawnAcc += dt * 260;
      while (spawnAcc > 1) {
        spawnAcc -= 1;
        drops.push({ x: xm - span + Math.random() * span * 2, y: 5 + Math.random() * 0.6 });
      }
      const cn = canopy(p.tilt);
      const keep: Drop[] = [];
      for (const d of drops) {
        const relPrev = { x: d.x - xPrev, y: d.y };
        d.x += p.wind * dt;
        d.y -= p.vr * dt;
        const rel = { x: d.x - xm, y: d.y };
        if (p.umb && crosses(relPrev, rel, cn.e1, cn.e2)) {
          splashes.push({ x: d.x, y: d.y, t });
          continue;
        }
        const inBody = Math.abs(rel.x) < 0.22 && rel.y > 0 && rel.y < HEAD.y - HEAD.r;
        const inHead = Math.hypot(rel.x, rel.y - HEAD.y) < HEAD.r;
        if (inBody || inHead) {
          wet += 1;
          splashes.push({ x: d.x, y: d.y, t });
          continue;
        }
        if (d.y <= 0) { splashes.push({ x: d.x, y: 0, t }); continue; }
        if (Math.abs(d.x - xm) < span * 1.3) keep.push(d);
      }
      drops = keep;
      splashes = splashes.filter((s) => t - s.t < 0.3);
      wet *= Math.exp(-dt / 1.2);
      soaked = Math.min(1, Math.max(0, soaked + (wet > 2 ? 0.25 : -0.05) * dt));
    },

    draw(ctx, vw, p) {
      const ph = rainPhysics(p);
      cam.follow({ minX: -3, maxX: 3, minY: 0, maxY: 4.6 }, vw, 0.2, { l: 20, r: 20, t: 60, b: 50 });
      const s = cam.scale;
      const visW = vw.width / s;
      // camera: in the man's frame it rides with him; on the ground it stays put and jumps when he walks off
      const span = visW * 0.8;
      const camX = p.frame === 1 ? xm : Math.floor((xm + span / 2) / span) * span;
      const T = (q: Vec2): Vec2 => ({ x: vw.width / 2 + (q.x - camX) * s, y: cam.oy - q.y * s });
      const x0 = camX - visW / 2 - 1, x1 = camX + visW / 2 + 1;

      // clouds (fixed in the ground frame, so they drift past in the man's frame)
      for (let cx = Math.floor(x0 / 5) * 5; cx < x1; cx += 5) {
        const c = T({ x: cx + 1.3 * Math.sin(cx), y: 4.55 });
        ctx.save();
        ctx.fillStyle = "#e3e8f0";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const [dx, dy, r] of [[-38, 6, 22], [-10, -4, 30], [22, 4, 24], [44, 10, 16]]) ctx.arc(c.x + dx, c.y + dy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ground + grass tufts (so motion is visible in the man's frame)
      ground(ctx, cam.oy, 0, vw.width);
      ctx.save();
      ctx.strokeStyle = "#4f9d69";
      ctx.lineWidth = 2;
      for (let gx = Math.floor(x0 / 0.9) * 0.9; gx < x1; gx += 0.9) {
        const g = T({ x: gx + 0.2 * Math.sin(gx * 7), y: 0 });
        ctx.beginPath();
        ctx.moveTo(g.x - 5, g.y); ctx.lineTo(g.x - 7, g.y - 9);
        ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y - 12);
        ctx.moveTo(g.x + 5, g.y); ctx.lineTo(g.x + 8, g.y - 8);
        ctx.stroke();
      }
      ctx.restore();

      // rain streaks drawn along the rain's velocity IN THIS FRAME
      const vx = p.frame === 1 ? ph.relX : p.wind;
      const len = 0.22 / Math.hypot(vx, p.vr);
      ctx.save();
      ctx.strokeStyle = "rgba(47,127,216,0.75)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (const d of drops) {
        if (d.x < x0 || d.x > x1) continue;
        const a = T(d), b = T({ x: d.x - vx * len, y: d.y + p.vr * len });
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(47,127,216,0.6)";
      ctx.lineWidth = 1.4;
      for (const sp of splashes) {
        const q = T(sp), k = (t - sp.t) / 0.3;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 3 + k * 7, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      ctx.restore();

      // the man
      const M = T({ x: xm, y: 0 });
      const W = (q: Vec2) => ({ x: M.x + q.x * s, y: M.y - q.y * s });
      const swing = p.vm > 0.05 ? Math.sin(xm / 0.32) * 0.45 : 0;
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(4, s * 0.07);
      for (const sg of [swing, -swing]) {
        const hip = W({ x: 0, y: 0.88 });
        const foot = W({ x: Math.sin(sg) * 0.88, y: 0.88 - Math.cos(sg) * 0.88 });
        sketchLine(ctx, hip.x, hip.y, foot.x, foot.y, 1);
      }
      // free arm swings opposite
      const sh = W({ x: -0.05, y: 1.42 });
      const hand2 = W({ x: -0.05 - Math.sin(swing) * 0.5, y: 1.42 - Math.cos(swing) * 0.5 });
      sketchLine(ctx, sh.x, sh.y, hand2.x, hand2.y, 1);
      // shirt (gets darker as he gets wet)
      const shirt = `rgb(${Math.round(110 - 60 * soaked)},${Math.round(180 - 70 * soaked)},${Math.round(230 - 60 * soaked)})`;
      const b0 = W({ x: -0.2, y: 1.52 }), b1 = W({ x: 0.2, y: 0.86 });
      ctx.fillStyle = shirt;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(b0.x, b0.y, b1.x - b0.x, b1.y - b0.y, 10);
      ctx.fill();
      ctx.stroke();
      // head
      const h = W({ x: 0, y: HEAD.y });
      ctx.fillStyle = "#f2d0a7";
      ctx.beginPath();
      ctx.arc(h.x, h.y, HEAD.r * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(h.x + HEAD.r * s * 0.45, h.y - 2, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(h.x + HEAD.r * s * 0.45, h.y + 6, 4, 0.2, Math.PI - 0.6); ctx.stroke();
      ctx.restore();

      // umbrella
      if (p.umb) {
        const cn = canopy(p.tilt);
        const hand = W(HAND), tip = W({ x: cn.c.x + cn.a.x * 0.12, y: cn.c.y + cn.a.y * 0.12 });
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(3, s * 0.035);
        ctx.lineCap = "round";
        sketchLine(ctx, W({ x: 0.1, y: 1.42 }).x, W({ x: 0.1, y: 1.42 }).y, hand.x, hand.y, 1); // arm
        sketchLine(ctx, hand.x, hand.y, tip.x, tip.y, 1); // shaft
        const C = W(cn.c);
        ctx.translate(C.x, C.y);
        ctx.rotate(p.tilt * DEG);
        const rw = 0.66 * s;
        ctx.fillStyle = "#ff8a3d";
        ctx.beginPath();
        ctx.moveTo(-rw, 0);
        ctx.quadraticCurveTo(-rw, -rw * 0.75, 0, -rw * 0.78);
        ctx.quadraticCurveTo(rw, -rw * 0.75, rw, 0);
        for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(rw - (i + 0.5) * rw / 2, -rw * 0.16, rw - (i + 1) * rw / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.restore();
      }

      // relative-velocity triangle: the whole question in one picture
      const bx = 14, by = 58, bw = 190, bh = 170;
      ctx.save();
      ctx.fillStyle = "rgba(255,253,247,0.95)";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.stroke();
      ctx.restore();
      const kk = 95 / Math.max(p.vr, Math.abs(p.wind - p.vm), Math.abs(p.wind), p.vm, 1);
      const I = (q: Vec2) => q;
      const o = { x: bx + bw / 2 + 20, y: by + 34 };
      arrow(ctx, I, o, { x: p.wind * kk, y: p.vr * kk }, COLORS.normal);
      const o2 = { x: o.x + p.wind * kk, y: o.y + p.vr * kk };
      arrow(ctx, I, o2, { x: -p.vm * kk, y: 0 }, COLORS.accel, undefined, { dashed: true, width: 2 });
      arrow(ctx, I, o, { x: (p.wind - p.vm) * kk, y: p.vr * kk }, COLORS.weight);
      label(ctx, "v_rain", o.x + p.wind * kk / 2 + 8, o.y + p.vr * kk / 2, COLORS.normal);
      if (p.vm > 0.2) label(ctx, "−v_man", o2.x - p.vm * kk / 2, o2.y + 12, COLORS.accel, "center");
      label(ctx, "v_rel", o.x + (p.wind - p.vm) * kk / 2 - 8, o.y + p.vr * kk / 2 - 10, COLORS.weight, "right");
      label(ctx, `rain as the man sees it`, bx + 10, by + bh - 14, COLORS.muted);

      const st = !p.umb ? ["no umbrella!", "#ffe1c7"] : wet > 3 ? ["getting wet 💦 tilt it more", "#ffe1c7"] : ["dry 😎", "#d9f5e4"];
      badge(ctx, 14, 14, st[0], st[1]);
      label(ctx, p.frame === 1 ? "man's frame: he's still, the rain comes at him slanted" : "ground frame: rain falls, man walks into it", vw.width / 2, vw.height - 16, COLORS.muted, "center");
    },
  };
}

export const rainman: SceneDef = {
  id: "rainman",
  name: "Rain-man",
  blurb: "Walk through the rain and tilt the umbrella until he stays dry. Flip frames to see why.",
  controls: [
    { key: "frame", label: "frame", min: 0, max: 1, step: 1, default: 0, options: ["🌍 Ground frame", "🚶 Man's frame"] },
    { key: "vr", label: "rain speed", unit: "m/s", min: 1, max: 20, step: 0.5, default: 6 },
    { key: "vm", label: "man's speed", unit: "m/s", min: 0, max: 10, step: 0.1, default: 3 },
    { key: "wind", label: "wind (+ pushes rain forward)", unit: "m/s", min: -8, max: 8, step: 0.1, default: 0 },
    { key: "tilt", label: "umbrella tilt (+ forward)", unit: "°", min: -70, max: 70, step: 1, default: 0, showIf: { key: "umb", in: [1] } },
    { key: "umb", label: "umbrella", min: 0, max: 1, step: 1, default: 1, hidden: true },
  ],
  actions: [
    { id: "auto", label: "☂️ Auto-tilt", primary: true },
    { id: "dry", label: "Dry him off" },
  ],
  create: createRainman,
  solve(p) {
    const ph = rainPhysics(p);
    const steps: SolutionStep[] = [
      { title: "1 · Velocities on the ground", lines: [`rain: (${fmt(p.wind, 1)}, −${fmt(p.vr, 1)}) m/s`, `man: (${fmt(p.vm, 1)}, 0) m/s`] },
      { title: "2 · Rain relative to the man", lines: ["v_rel = v_rain − v_man", `= (${fmt(ph.relX, 1)}, −${fmt(p.vr, 1)}) m/s`, `speed he feels = ${fmt(ph.relSpeed)} m/s`] },
      {
        title: "3 · Umbrella angle",
        lines: [`tan α = (v_man − v_wind) / v_rain = ${fmt(p.vm - p.wind, 1)} / ${fmt(p.vr, 1)}`, `α = ${fmt(Math.abs(ph.alphaDeg), 1)}° ${ph.alphaDeg >= 0 ? "forward" : "backward"} from vertical`],
        verdict: p.umb ? (Math.abs(p.tilt - ph.alphaDeg) < 4 ? { text: "your tilt is right ✓", tone: "good" } : { text: `you're at ${p.tilt}°, need ${fmt(ph.alphaDeg, 0)}°`, tone: "warn" }) : undefined,
      },
      { title: "Notice", lines: [p.wind === 0 ? "To someone on the ground the rain falls straight down. It only looks slanted because he's moving." : `On the ground the rain already falls at ${fmt(Math.abs(ph.groundAngle), 1)}° because of the wind.`, "Walk faster → hold the umbrella lower in front."] },
    ];
    return steps;
  },
};
