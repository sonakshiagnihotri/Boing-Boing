/**
 * The little gang that lives in the scenes. Original doodles in the same hand-drawn style as the elephant.
 * Each critter is an SVG turned into an <img> once, then drawn onto the canvas, so it moves with the physics.
 */
import type { Vec2 } from "../engine/types";

const INK = "#17191f";

/** Wraps doodle parts with the wobbly-ink + crayon filters. */
export const doodle = (fills: string, ink: string, extra = "") => `
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

export const BLUSH = (x: number, y: number, r = 3.2) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#ff9fb4"/>`;
export const EYE = (x: number, y: number, r = 3) =>
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

/* ---------- ladybug (side view, walks right) ---------- */
const ladybug = doodle(
  `<path d="M22 70 C22 46 40 34 56 34 C72 34 84 48 84 70 Z" fill="#e2483d"/>
   <circle cx="88" cy="62" r="11" fill="#2b2d33"/>`,
  `<path d="M22 70 C22 46 40 34 56 34 C72 34 84 48 84 70 Z"/>
   <path d="M53 35 C52 48 52 60 53 70"/>
   <circle cx="88" cy="62" r="11"/>
   <path d="M86 52 q2 -10 8 -12 M91 53 q5 -8 11 -8" stroke-width="2"/>
   <path d="M34 70 l-4 10 M52 70 l0 11 M70 70 l4 10" stroke-width="3"/>
   <circle cx="38" cy="54" r="5" fill="${INK}"/><circle cx="66" cy="50" r="5" fill="${INK}"/><circle cx="46" cy="64" r="3.5" fill="${INK}"/><circle cx="72" cy="63" r="3.5" fill="${INK}"/>
   <circle cx="92" cy="60" r="2.6" fill="#fff" stroke="none"/><circle cx="92.6" cy="60.4" r="1.2" fill="${INK}" stroke="none"/>`,
);

/* ---------- monkey: arms up, hands at x=50 so a rope can pass straight through ---------- */
const monkey = doodle(
  `<path d="M38 14 C40 30 42 40 44 46 M62 14 C60 30 58 40 56 46" stroke="#b97a4a" stroke-width="9" fill="none" stroke-linecap="round"/>
   <ellipse cx="50" cy="70" rx="17" ry="20" fill="#b97a4a"/>
   <circle cx="31" cy="44" r="7" fill="#b97a4a"/><circle cx="69" cy="44" r="7" fill="#b97a4a"/>
   <circle cx="50" cy="46" r="17" fill="#b97a4a"/>
   <ellipse cx="50" cy="50" rx="12" ry="10" fill="#f2d0a7"/><ellipse cx="50" cy="74" rx="10" ry="12" fill="#e8c193"/>
   <circle cx="42" cy="12" r="5" fill="#b97a4a"/><circle cx="58" cy="12" r="5" fill="#b97a4a"/>
   ${BLUSH(40, 54, 2.6)}${BLUSH(60, 54, 2.6)}`,
  `<path d="M38 14 C40 30 42 40 44 46 M62 14 C60 30 58 40 56 46" stroke-width="2"/>
   <circle cx="42" cy="12" r="5"/><circle cx="58" cy="12" r="5"/>
   <ellipse cx="50" cy="70" rx="17" ry="20"/>
   <circle cx="31" cy="44" r="7"/><circle cx="69" cy="44" r="7"/>
   <circle cx="50" cy="46" r="17"/>
   <ellipse cx="50" cy="50" rx="12" ry="10" stroke-width="1.8"/>
   <path d="M44 88 l-2 8 M56 88 l2 8" stroke-width="5"/>
   <path d="M66 80 C80 82 84 70 76 66 C72 64 70 68 73 70" stroke-width="2.4"/>
   <path d="M46 55 q4 3 8 0" stroke-width="1.8"/>
   ${EYE(44, 45, 2.4)}${EYE(56, 45, 2.4)}`,
);

/* ---------- loading ---------- */
const SOURCES = { googly, dino, ladybug, monkey };
export const critterSvg = (name: keyof typeof SOURCES) => SOURCES[name];
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

/** Data-URI for using a doodle as an <img> (menu icons, stickers). */
export const doodleSrc = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

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
