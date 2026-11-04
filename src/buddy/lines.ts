/**
 * The haathi is a TEACHER. Every line is built from the numbers on screen right now:
 * it says what's happening, why (with the actual maths), and what to try next.
 *
 * LINES[sceneId][status](params) → a few things he might say. Status keys come from each scene's status().
 * TAPS[sceneId](params) → challenges when someone taps him.
 * Rewrite these in your own voice!
 */
import type { Params } from "../engine/types";
import { analyze } from "../scenes/incline";
import { solveSystem } from "../scenes/pulley";
import { bowlPhysics } from "../scenes/bowl";
import { rainPhysics } from "../scenes/rainman";
import { monkeyPhysics } from "../scenes/monkey";

type Say = (p: Params) => string[];
const DEG = Math.PI / 180;
const G = 9.8;
/** tidy numbers: 1 decimal, drop trailing .0 */
const n = (x: number, d = 1) => {
  const s = x.toFixed(d);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
};
const n2 = (x: number) => n(x, 2);
const signed = (a: number) => (a >= 0 ? `+ ${n(a)}` : `− ${n(-a)}`);

/* ---------- projectile maths, straight from the formulas ---------- */
function proj(p: Params) {
  const ux = p.v * Math.cos(p.angle * DEG), uy = p.v * Math.sin(p.angle * DEG);
  const T = (uy + Math.sqrt(uy * uy + 2 * p.g * p.h)) / p.g;
  const H = p.h + (uy > 0 ? (uy * uy) / (2 * p.g) : 0);
  return { ux, uy, T, R: ux * T, H };
}

export const LINES: Record<string, Record<string, Say>> = {
  projectile: {
    idle: (p) => {
      const { ux, uy } = proj(p);
      return [
        `ok before you fire 👀 v = ${n(p.v)} m/s at ${p.angle}° splits into ux = ${n(ux)} and uy = ${n(uy)}. guess the range in your head, THEN hit Launch`,
        `predict first: from h = ${n(p.h)} m at ${p.angle}°, will it land closer or further than ${n(p.v * 2)} m? commit to an answer, then launch`,
      ];
    },
    aiming: (p) => {
      const { ux, uy } = proj(p);
      return [`${n(p.v)} m/s at ${p.angle}° → ux = ${n(ux)} m/s sideways, uy = ${n(uy)} m/s up. those two numbers decide the whole flight`];
    },
    flying: (p) => {
      const { ux, T } = proj(p);
      return [
        `watch the dots: sideways gaps stay equal because vx = ${n(ux)} m/s NEVER changes. only vy changes, losing ${n(p.g)} m/s every second`,
        `it'll be in the air for T = ${n2(T)} s. that comes only from the vertical motion: h + uy·t − ½gt² = 0`,
      ];
    },
    fast: (p) => {
      const { R } = proj(p);
      return [`${n(p.v)} m/s 💀 range ≈ ${R > 1000 ? n(R / 1000, 2) + " km" : n(R) + " m"}. R grows with v², so double the speed = 4× the range. that's why the camera zoomed out`];
    },
    wall: (p) => {
      const { ux, uy, T } = proj(p);
      const tw = p.wall / ux, yw = p.h + uy * tw - 0.5 * p.g * tw * tw;
      return [`it hit the wall ${n(yw)} m up, at t = ${n2(tw)} s. the wall flips vx from ${n(ux)} to −${n(p.e * ux)} (× e), but vy doesn't care, so it still lands at T = ${n2(T)} s`];
    },
    landed: (p) => {
      const { R, T, H } = proj(p);
      const tip = p.h === 0
        ? (p.angle === 45 ? "45° is the max range angle on flat ground. try 30° and 60°: same range! complementary angles" : `now try θ = ${90 - p.angle}°. on flat ground it lands at the SAME spot`)
        : `from a height, the best angle is actually LESS than 45°. try 35° and compare`;
      return [`landed at R = ${n(R)} m after T = ${n2(T)} s, peak H = ${n(H)} m. ${tip}`];
    },
    compare: () => [
      "compare the T values in the list. time of flight depends only on uy and h, never on ux. same uy = same airtime, even if one goes way further",
      "change ONE slider between launches, otherwise you can't tell what caused the difference",
    ],
  },

  incline: {
    rest: (p) => {
      const a = analyze(p);
      return [
        `mg sinθ = ${n(a.along)} N pulls it down. friction CAN give up to μsN = ${n(a.fsMax)} N but only gives ${n(a.along)} N, just enough. it slips past θ = tan⁻¹(${n2(p.mus)}) = ${n(a.repose)}°, so drag θ up and see`,
      ];
    },
    edge: (p) => {
      const a = analyze(p);
      return [`θ = ${n(p.theta)}°, limit is ${n(a.repose)}°. friction is using ${Math.round((a.along / a.fsMax) * 100)}% of its max right now (${n(a.along)} of ${n(a.fsMax)} N). one more degree... 😬`];
    },
    sliding: (p) => {
      const a = analyze(p);
      return [
        `tan ${n(p.theta)}° = ${n2(Math.tan(p.theta * DEG))} > μs = ${n2(p.mus)}, so it slips. now kinetic friction ${n(a.fk)} N fights ${n(a.along)} N → a = g(sinθ − μk cosθ) = ${n2(a.aSlide)} m/s²`,
        `a = ${n2(a.aSlide)} m/s² and the mass cancelled out. change m to ${n(p.m * 3)} kg and run again: SAME acceleration. try it`,
      ];
    },
    up: (p) => {
      const a = analyze(p);
      return [`going up, gravity (${n(a.along)} N) AND friction (${n(a.fk)} N) both point DOWN the slope → it slows at ${n2(a.aUp)} m/s² and stops after ${n2((p.v0 * p.v0) / (2 * a.aUp))} m. will it come back? check tanθ = ${n2(Math.tan(p.theta * DEG))} vs μs = ${n2(p.mus)}`];
    },
    bottom: (p) => {
      const a = analyze(p);
      return [`made it down with a = ${n2(a.aSlide)} m/s². now halve μk to ${n2(p.muk / 2)} and predict the new a before you run it again`];
    },
  },

  pulley: {
    stuck: (p) => {
      const s = solveSystem(p);
      if (p.mode === 2) {
        return [`m₂g = ${n(p.m2 * G)} N pulls up the slope, m₁g sinθ = ${n(s.down ?? 0)} N pulls down. the difference (${n(Math.abs(s.f))} N) is less than f_max = ${n(s.fmax)} N, so friction just holds it`];
      }
      return [
        `m₂g = ${n(p.m2 * G)} N pulls, friction can hold up to μm₁g = ${n(s.fmax)} N. so nothing moves, and friction is only ${n(s.f)} N right now, NOT ${n(s.fmax)}. classic trap!`,
        `to break it free you need m₂g > μm₁g → m₂ > ${n2(p.mu * p.m1)} kg. slide m₂ past that and watch`,
      ];
    },
    balanced: (p) => [`m₁ = m₂ = ${n(p.m1)} kg → net force zero, a = 0, and T = mg = ${n(p.m1 * G)} N. make one side a bit heavier`],
    moving: (p) => {
      const s = solveSystem(p);
      return [
        `a = ${n2(Math.abs(s.a))} m/s². T = ${n(s.T)} N, LESS than m₂g = ${n(p.m2 * G)} N. if T were equal to m₂g, m₂ would just hang still, but it's accelerating down`,
        `both blocks share the same a = ${n2(Math.abs(s.a))} m/s² because the string can't stretch. that's your extra equation in every pulley question`,
      ];
    },
    atwood: (p) => {
      const s = solveSystem(p);
      return [
        `a = (m₂ − m₁)g/(m₁ + m₂) = (${n(p.m2)} − ${n(p.m1)}) × 9.8 / ${n(p.m1 + p.m2)} = ${n2(Math.abs(s.a))} m/s². T = ${n(s.T)} N, always between m₁g = ${n(p.m1 * G)} and m₂g = ${n(p.m2 * G)}`,
        `try doubling BOTH masses. a stays ${n2(Math.abs(s.a))} m/s². only the ratio matters`,
      ];
    },
    hit: (p) => {
      const s = solveSystem(p);
      return [`crash 😭 it was speeding up at ${n2(Math.abs(s.a))} m/s² the whole way. hit Reset and predict what μ would make it just barely move`];
    },
  },

  bowl: {
    climb: (p) => [`climbing... friction has to match mg sinθ, but it can only give μ mg cosθ. so it stops where tanθ = μ = ${n2(p.mu)}. guess the height before it gets there 👀`],
    stuck: (p) => {
      const b = bowlPhysics(p);
      return [
        `stuck at θ = tan⁻¹(${n2(p.mu)}) = ${n(b.thMaxDeg)}°. height = R(1 − cosθ) = ${n(p.R)} × (1 − ${n2(Math.cos(b.thMax))}) = ${n2(b.h)} m. that's the max`,
        `bump μ to ${n2(p.mu + 0.25)} and predict the new height. and notice: ant or beetle, mass never showed up in the maths`,
      ];
    },
  },

  rainman: {
    dry: (p) => {
      const r = rainPhysics(p);
      return [`dry 😎 the rain hits him at ${n(r.relSpeed)} m/s, tilted ${n(Math.abs(r.alphaDeg))}° (tan α = ${n(p.vm - p.wind)}/${n(p.vr)}), exactly where your umbrella points. now walk faster and predict the new angle`];
    },
    wet: (p) => {
      const r = rainPhysics(p);
      const dir = p.tilt < r.alphaDeg ? "more forward" : "back a bit";
      return [
        `he's getting wet 💦 you're at ${p.tilt}°, but relative to him the rain comes in at ${n(r.alphaDeg)}° (tan α = ${n(p.vm - p.wind)}/${n(p.vr)}). tilt it ${dir}`,
        `flip to the man's frame: that's how HE sees the rain. point the umbrella into it`,
      ];
    },
    noUmb: (p) => {
      const r = rainPhysics(p);
      return [`no umbrella. relative to him the rain hits at ${n(r.relSpeed)} m/s from ${n(Math.abs(r.alphaDeg))}° off vertical. add one from the + menu and tilt it to ${n(r.alphaDeg)}°`];
    },
  },

  monkey: {
    up: (p) => {
      const s = monkeyPhysics(p);
      return [`T = m(g + a) = ${n(p.m)} × (9.8 ${signed(p.a)}) = ${n(s.T)} N. the rope takes ${n(p.Tmax)} N, so the fastest it can climb is a = ${n(p.Tmax)}/${n(p.m)} − 9.8 = ${n2(s.aMaxUp)} m/s²`];
    },
    down: (p) => {
      const s = monkeyPhysics(p);
      return [`sliding down at ${n(-p.a)} m/s² → T = ${n(p.m)} × (9.8 − ${n(-p.a)}) = ${n(s.T)} N. the faster it slides down, the less the rope has to hold. at a = −9.8 it's free fall, T = 0`];
    },
    hold: (p) => {
      const s = monkeyPhysics(p);
      return [`hanging still → a = 0, so T = mg = ${n(s.W)} N. ${s.W > p.Tmax ? `that's already MORE than the ${n(p.Tmax)} N limit!` : `the rope takes ${n(p.Tmax)} N, so crank a up and find where it snaps`}`];
    },
    close: (p) => {
      const s = monkeyPhysics(p);
      return [`T = ${n(s.T)} N is ${Math.round((s.T / p.Tmax) * 100)}% of the ${n(p.Tmax)} N limit 😬 the exact edge is a = ${n2(s.aMaxUp)} m/s²`];
    },
    snap: (p) => {
      const s = monkeyPhysics(p);
      const lim = p.Tmax / p.m - G; // largest a that's safe (can be negative)
      const lightest = p.Tmax / Math.max(G + p.a, 0.01);
      const head = `T = m(g + a) = ${n(p.m)} × (9.8 ${signed(p.a)}) = ${n(s.T)} N, but the rope only takes ${n(p.Tmax)} N 💀`;
      if (lim < 0) {
        return [`${head} even hanging still is too much (mg = ${n(s.W)} N), so it has to slide DOWN at least ${n2(-lim)} m/s². set a ≤ −${n2(-lim)}, or use a monkey under ${n(lightest)} kg`];
      }
      return [`${head} the safe limit is a ≤ ${n(p.Tmax)}/${n(p.m)} − 9.8 = ${n2(lim)} m/s². set a to that and climb again, or use a monkey under ${n(lightest)} kg`];
    },
  },
};

/** Tap the haathi → a challenge for whatever's on screen. */
export const TAPS: Record<string, Say> = {
  projectile: (p) => {
    const { R } = proj(p);
    return [
      `challenge: change ONLY the angle and get the range to exactly ${n(R * 0.8)} m. predict which way to move it first`,
      "challenge: drop the launch height to 0 and find the angle with max range. then put h back. does 45° still win?",
      "hover anywhere on a path. I'll tell you t, x, y, vx and vy at that exact point",
    ];
  },
  incline: (p) => [
    `challenge: find the exact angle where it starts slipping without looking at the dashed line. hint: tan⁻¹(μs) with μs = ${n2(p.mus)}`,
    "challenge: give it a push up (v₀) on a slope where it WON'T slide back. what has to be true about tanθ and μs?",
  ],
  pulley: (p) => [
    p.mode === 1 ? "challenge: make the acceleration exactly g/2. what ratio of masses do you need?" : `challenge: find the smallest m₂ that makes it move. predict it first: μm₁ = ${n2(p.mu * p.m1)}... hmm 👀`,
    "every pulley question = one FBD per block + 'same a for both' (the string doesn't stretch). that's it, that's the trick",
  ],
  bowl: () => ["challenge: what μ gets the insect exactly halfway up the bowl (h = R/2)? hint: cosθ = 1/2", "notice the forces: N always points at the centre of the bowl"],
  rainman: () => ["challenge: set wind so that rain falls slanted on the ground but looks VERTICAL to him. what wind speed?", "flip frames and watch the grass. in his frame the ground slides backwards"],
  monkey: (p) => [`challenge: find the exact a where T = T_max. formula: a = T_max/m − g. predict, then slide`, `what if the monkey climbs at constant speed? T = ${n(p.m * G)} N. velocity never shows up!`],
};

export const GENERIC_TAPS = [
  "predict first, THEN hit play. being wrong is how your brain remembers it",
  "every arrow on screen is a real force. count them before you write ΣF = ma",
  "change one slider at a time, otherwise you can't tell what caused what",
];
