/**
 * The little gang that lives in the scenes. Original doodles in the same hand-drawn style as the elephant.
 * Each critter is an SVG turned into an <img> once, then drawn onto the canvas, so it moves with the physics.
 */
import type { Vec2 } from "../engine/types";

const INK = "#17191f";

/** Wraps doodle parts with the wobbly-ink + crayon filters. */
const doodle = (fills: string, ink: string, extra = "") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <defs>
    <filter id="w" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="c" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.05" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in" result="s"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="s" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <g filter="url(#st)">
    <g filter="url(#c)">${fills}</g>
    <g filter="url(#w)" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ink}</g>
    ${extra}
  </g>
</svg>`.replace(
  "</defs>",
  // sticker border: a cream outline around the whole doodle so dark ink stays visible on the dark canvas
  `<filter id="st" x="-15%" y="-15%" width="130%" height="130%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d"/>
      <feFlood flood-color="#f4f1ea"/>
      <feComposite in2="d" operator="in" result="o"/>
      <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`,
);

const BLUSH = (x: number, y: number, r = 3.2) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#ff9fb4"/>`;
const EYE = (x: number, y: number, r = 3) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.35}" fill="#fff" stroke="none"/>`;

/* ---------- googly guy: pupils are drawn live so they can follow things ---------- */
const GOOGLY_EYES = [
  { x: 36, y: 34, r: 18 },
  { x: 64, y: 30, r: 20 },
];
const googly = doodle(
  `<path d="M50 50 C34 52 30 70 32 82 C34 92 44 94 50 94 C58 94 66 90 66 80 C66 66 62 52 50 50 Z" fill="#8fb996"/>`,
  `<path d="M44 92 L44 98 M56 92 L56 98" stroke-width="5"/>
   <path d="M50 50 C34 52 30 70 32 82 C34 92 44 94 50 94 C58 94 66 90 66 80 C66 66 62 52 50 50 Z"/>
   <path d="M33 74 q-6 2 -9 -2 M66 72 q6 1 9 -3"/>
   ${GOOGLY_EYES.map((e) => `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="#fff"/>`).join("")}`,
);

/* ---------- dino ---------- */
const dino = doodle(
  `<path d="M30 52 L34 41 L38 51 Z M40 49 L45 38 L49 48 Z M51 47 L56 37 L60 47 Z" fill="#ff8a3d"/>
   <path d="M8 64 C20 58 30 50 44 48 C58 46 64 50 66 58 C68 74 60 82 46 82 C32 82 22 74 8 64 Z" fill="#9ed9a0"/>
   <ellipse cx="72" cy="40" rx="20" ry="16" fill="#9ed9a0"/>
   <rect x="34" y="76" width="9" height="16" rx="3" fill="#9ed9a0"/><rect x="52" y="76" width="9" height="16" rx="3" fill="#9ed9a0"/>
   ${BLUSH(70, 47)}`,
  `<path d="M30 52 L34 41 L38 51 M40 49 L45 38 L49 48 M51 47 L56 37 L60 47"/>
   <path d="M8 64 C20 58 30 50 44 48 C52 47 56 48 58 50 M62 54 C66 62 66 74 60 79 M52 82 C40 83 22 74 8 64"/>
   <path d="M58 50 C56 38 62 24 74 24 C86 24 92 32 92 40 C92 50 84 56 72 56 C68 56 64 55 62 54"/>
   <rect x="34" y="76" width="9" height="16" rx="3"/><rect x="52" y="76" width="9" height="16" rx="3"/>
   <path d="M64 62 q6 1 8 6"/>
   <path d="M82 46 q-4 4 -9 2" stroke-width="2"/>
   ${EYE(78, 36, 3.4)}<circle cx="89" cy="37" r="0.9" fill="${INK}"/>`,
);

/* ---------- crab ---------- */
const crab = doodle(
  `<ellipse cx="50" cy="62" rx="26" ry="17" fill="#ff8f6b"/>
   <path d="M10 36 C8 26 20 22 24 30 L17 33 L24 36 C20 42 12 42 10 36 Z" fill="#ff8f6b"/>
   <path d="M90 36 C92 26 80 22 76 30 L83 33 L76 36 C80 42 88 42 90 36 Z" fill="#ff8f6b"/>
   ${BLUSH(38, 66)}${BLUSH(62, 66)}`,
  `<ellipse cx="50" cy="62" rx="26" ry="17"/>
   <path d="M10 36 C8 26 20 22 24 30 L17 33 L24 36 C20 42 12 42 10 36 Z"/>
   <path d="M90 36 C92 26 80 22 76 30 L83 33 L76 36 C80 42 88 42 90 36 Z"/>
   <path d="M27 56 C20 52 16 46 16 41 M73 56 C80 52 84 46 84 41"/>
   <path d="M28 68 l-12 5 M30 73 l-10 9 M35 77 l-6 11 M72 68 l12 5 M70 73 l10 9 M65 77 l6 11"/>
   <path d="M43 47 L41 34 M57 47 L59 34"/>
   <circle cx="41" cy="31" r="5" fill="#fff"/><circle cx="59" cy="31" r="5" fill="#fff"/>
   <path d="M44 64 q6 5 12 0" stroke-width="2"/>
   ${EYE(41, 31, 2.4)}${EYE(59, 31, 2.4)}`,
);

/* ---------- fish (two colours) ---------- */
const fish = (c: string) =>
  doodle(
    `<path d="M26 50 L8 37 L10 63 Z" fill="${c}"/><ellipse cx="52" cy="50" rx="27" ry="19" fill="${c}"/>${BLUSH(66, 57)}`,
    `<path d="M26 50 L8 37 L10 63 Z"/><ellipse cx="52" cy="50" rx="27" ry="19"/>
     <path d="M46 32 q8 -12 16 -1"/><path d="M38 44 q4 6 0 12 M46 42 q4 8 0 16" stroke-width="1.6"/>
     <path d="M74 56 q-4 3 -8 1" stroke-width="2"/>
     ${EYE(66, 45, 3.6)}`,
  );

/* ---------- dragonfly body (wings are drawn live so they can flutter) ---------- */
const dragonfly = doodle(
  `<path d="M12 50 L60 47 L60 54 L12 52 Z" fill="#5ad1ff"/><ellipse cx="66" cy="50" rx="8" ry="6" fill="#5ad1ff"/><circle cx="78" cy="50" r="7" fill="#5ad1ff"/>`,
  `<path d="M12 50 L60 47 M12 52 L60 54 M12 50 L12 52"/><path d="M24 49 v4 M34 48.5 v5 M44 48 v6 M52 47.5 v6.5" stroke-width="1.4"/>
   <ellipse cx="66" cy="50" rx="8" ry="6"/><circle cx="78" cy="50" r="7"/>
   <circle cx="80" cy="45" r="4.5" fill="#fff"/><circle cx="80" cy="55" r="4.5" fill="#fff"/>
   ${EYE(81, 45, 2.2)}${EYE(81, 55, 2.2)}`,
);

/* ---------- loading ---------- */
const SOURCES = { googly, dino, crab, fishY: fish("#ffd166"), fishP: fish("#ff9fb4"), dragonfly };
export type CritterName = keyof typeof SOURCES;
const images: Partial<Record<CritterName, HTMLImageElement>> = {};

function img(name: CritterName) {
  if (typeof Image === "undefined") return null;
  let i = images[name];
  if (!i) {
    i = new Image();
    i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SOURCES[name]);
    images[name] = i;
  }
  return i.complete && i.naturalWidth ? i : null;
}

const now = () => performance.now() / 1000;

/** Draws a critter with its feet at (x, y) in screen px. `flip` mirrors it horizontally. */
export function critter(ctx: CanvasRenderingContext2D, name: CritterName, x: number, y: number, size: number, opts: { flip?: boolean; bob?: number; tilt?: number } = {}) {
  const i = img(name);
  if (!i) return;
  ctx.save();
  ctx.translate(x, y - (opts.bob ?? 0));
  if (opts.tilt) ctx.rotate(opts.tilt);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.drawImage(i, -size / 2, -size, size, size);
  ctx.restore();
}

/** Googly guy whose pupils look at `target` (screen px). Feet at (x, y). */
export function googlyGuy(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, target: Vec2 | null) {
  const t = now();
  const bob = Math.abs(Math.sin(t * 2.2)) * size * 0.03;
  critter(ctx, "googly", x, y, size, { bob });
  if (!img("googly")) return;
  const k = size / 100;
  const blink = (t % 4.2) < 0.12; // blinks every few seconds
  for (const e of GOOGLY_EYES) {
    const cx = x - size / 2 + e.x * k, cy = y - size - bob + e.y * k, r = e.r * k;
    let dx = 0, dy = 0;
    if (target) {
      const d = Math.hypot(target.x - cx, target.y - cy) || 1;
      const m = Math.min(r * 0.48, d);
      dx = ((target.x - cx) / d) * m;
      dy = ((target.y - cy) / d) * m;
    } else {
      dx = Math.sin(t * 0.7) * r * 0.3; // idle look-around
    }
    ctx.fillStyle = INK;
    if (blink) {
      ctx.fillRect(cx - r * 0.7, cy - 1, r * 1.4, 2.5);
      continue;
    }
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx + dx + r * 0.12, cy + dy - r * 0.12, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Dino that does a happy hop for 0.6 s after `jumpAt` (seconds, performance clock). */
export function dinoFriend(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, jumpAt: number, flip = false) {
  const dt = now() - jumpAt;
  const hop = dt >= 0 && dt < 0.6 ? Math.sin((dt / 0.6) * Math.PI) * size * 0.45 : 0;
  const idle = Math.sin(now() * 1.6) * 0.03;
  critter(ctx, "dino", x, y, size, { bob: hop, tilt: hop ? -0.12 : idle, flip });
}
export const clock = now;

/** Crab scuttling sideways between x0 and x1 on the line y. */
export function crabWalk(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, size: number) {
  const t = now();
  const span = Math.max(0, x1 - x0);
  const x = x0 + span * (0.5 + 0.5 * Math.sin(t * 0.45));
  const wiggle = Math.sin(t * 14) * 0.06; // tiny legs going brrr
  critter(ctx, "crab", x, y, size, { tilt: wiggle, bob: Math.abs(Math.sin(t * 14)) * 1.5 });
}

/** Dragonfly hovering around (cx, cy) on a figure-of-eight, with fluttering wings. */
export function dragonflyHover(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, seed = 0, range = 60) {
  const t = now() + seed * 7.3;
  const x = cx + Math.sin(t * 0.6) * range;
  const y = cy + Math.sin(t * 1.2) * range * 0.35;
  const vx = Math.cos(t * 0.6); // facing the way it's flying
  const flip = vx < 0;
  const k = size / 100;
  const flap = 0.5 + 0.5 * Math.abs(Math.sin(t * 38));
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  // wings
  ctx.fillStyle = "rgba(225,245,255,0.8)";
  ctx.strokeStyle = "#f4f1ea";
  ctx.lineWidth = 1.5;
  // two pairs of wings sticking out above and below the thorax, flapping by squashing toward the body
  for (const [wx, side, len, lean] of [[14, -1, 30, -0.35], [2, -1, 26, 0.35], [14, 1, 30, 0.35], [2, 1, 26, -0.35]] as const) {
    ctx.save();
    ctx.translate(wx * k, 0);
    ctx.scale(1, flap);
    ctx.rotate(lean);
    ctx.beginPath();
    ctx.ellipse(0, side * len * k * 0.62, 7 * k, len * k * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  critter(ctx, "dragonfly", x, y + size * 0.5, size, { flip });
}

/** Little fishbowl on the floor with two fish swimming around. Bottom of the bowl at (x, y). */
export function fishbowl(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const t = now();
  const cy = y - r;
  ctx.save();
  // water
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(90,209,255,0.16)";
  ctx.fillRect(x - r, cy - r * 0.45 + Math.sin(t * 2) * 2, r * 2, r * 2);
  // bubbles
  ctx.strokeStyle = "rgba(232,234,240,0.6)";
  for (let i = 0; i < 4; i++) {
    const by = cy + r - (((t * 18 + i * 23) % (r * 1.4)));
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 2.1 + t) * r * 0.4, by, 2 + (i % 2), 0, Math.PI * 2);
    ctx.stroke();
  }
  // fish
  const f1 = Math.sin(t * 0.8), f2 = Math.sin(t * 0.6 + 2);
  critter(ctx, "fishY", x + f1 * r * 0.4, cy + r * 0.05 + Math.sin(t * 2.3) * 3, r * 0.8, { flip: Math.cos(t * 0.8) < 0 });
  critter(ctx, "fishP", x + f2 * r * 0.35, cy + r * 0.55 + Math.sin(t * 1.9) * 3, r * 0.65, { flip: Math.cos(t * 0.6 + 2) < 0 });
  ctx.restore();
  // glass
  ctx.save();
  ctx.strokeStyle = "#cfd6e3";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, cy, r, -Math.PI * 0.32, Math.PI * 1.32);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(x, cy, r * 0.78, Math.PI * 1.05, Math.PI * 1.35);
  ctx.stroke();
  ctx.restore();
}
