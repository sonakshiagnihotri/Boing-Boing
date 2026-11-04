/**
 * Everything you can drop onto the page from the + menu, drawn as doodle stickers.
 */
import { EYE, critterSvg, doodle, doodleSrc } from "../buddy/critters";

export type ItemKind =
  | "ball" | "block" | "incline" | "table" | "pulley" | "wall" | "tower" | "building"
  | "bowl" | "insect" | "man" | "umbrella" | "rain" | "monkey" | "rope";

const WOOD = "#d9a066";

const SVG: Record<ItemKind, string> = {
  ball: doodle(`<circle cx="50" cy="52" r="30" fill="#ff8a3d"/>`, `<circle cx="50" cy="52" r="30"/><path d="M34 40 q6 -10 16 -10" stroke="#fff" stroke-width="4"/>`),
  block: doodle(
    `<rect x="20" y="24" width="60" height="56" rx="3" fill="#6ec3ee"/>`,
    `<rect x="20" y="24" width="60" height="56" rx="3"/><path d="M20 24 L80 80 M80 24 L20 80" stroke-width="1.6"/><text x="50" y="59" font-family="Patrick Hand, sans-serif" font-size="20" text-anchor="middle" fill="#24262c" stroke="none">m</text>`,
  ),
  incline: doodle(`<path d="M12 82 L88 82 L88 26 Z" fill="${WOOD}"/>`, `<path d="M12 82 L88 82 L88 26 Z"/><path d="M28 82 a16 16 0 0 0 -2 -10" stroke-width="2"/>`),
  table: doodle(
    `<rect x="10" y="38" width="80" height="10" fill="${WOOD}"/><rect x="18" y="48" width="8" height="38" fill="${WOOD}"/><rect x="74" y="48" width="8" height="38" fill="${WOOD}"/>`,
    `<rect x="10" y="38" width="80" height="10"/><rect x="18" y="48" width="8" height="38"/><rect x="74" y="48" width="8" height="38"/>`,
  ),
  pulley: doodle(
    `<circle cx="50" cy="52" r="24" fill="#cfd8e6"/><rect x="44" y="10" width="12" height="20" fill="${WOOD}"/>`,
    `<path d="M50 10 L50 30"/><circle cx="50" cy="52" r="24"/><circle cx="50" cy="52" r="4" fill="#24262c"/><path d="M50 52 L50 30 M50 52 L69 63 M50 52 L31 63" stroke-width="2"/><path d="M26 52 L26 92 M74 52 L74 92" stroke-width="1.8"/>`,
  ),
  wall: doodle(
    `<rect x="30" y="12" width="40" height="78" fill="#e8b48a"/>`,
    `<rect x="30" y="12" width="40" height="78"/><path d="M30 28 H70 M30 44 H70 M30 60 H70 M30 76 H70 M50 12 V28 M42 28 V44 M58 44 V60 M44 60 V76 M56 76 V90" stroke-width="1.4"/>`,
  ),
  tower: doodle(
    `<rect x="36" y="20" width="28" height="70" fill="#e8b48a"/><path d="M32 20 h8 v-8 h6 v8 h8 v-8 h6 v8 h8 v6 h-36 Z" fill="#e8b48a"/>`,
    `<rect x="36" y="26" width="28" height="64"/><path d="M32 26 V12 h8 v8 h6 v-8 h8 v8 h6 v-8 h8 v14 Z"/><path d="M36 40 H64 M36 54 H64 M36 68 H64 M36 82 H64" stroke-width="1.3"/>`,
  ),
  building: doodle(
    `<rect x="26" y="8" width="48" height="84" fill="#b9c4d6"/>`,
    `<rect x="26" y="8" width="48" height="84"/>
     ${[18, 32, 46, 60].map((y) => `<rect x="33" y="${y}" width="10" height="8" fill="#ffd166"/><rect x="57" y="${y}" width="10" height="8" fill="#ffd166"/>`).join("")}
     <rect x="44" y="76" width="12" height="16" fill="${WOOD}"/>`,
  ),
  bowl: doodle(`<path d="M12 38 A38 38 0 0 0 88 38 L80 38 A30 30 0 0 1 20 38 Z" fill="#9fd0e8"/>`, `<path d="M12 38 A38 38 0 0 0 88 38 L80 38 A30 30 0 0 1 20 38 Z"/><path d="M8 84 H92" stroke-width="2"/>`),
  insect: critterSvg("ladybug"),
  man: doodle(
    `<circle cx="50" cy="22" r="12" fill="#f2d0a7"/><rect x="38" y="36" width="24" height="30" rx="6" fill="#6ec3ee"/>`,
    `<circle cx="50" cy="22" r="12"/><rect x="38" y="36" width="24" height="30" rx="6"/><path d="M44 66 L38 92 M56 66 L64 92 M38 42 L28 60 M62 42 L72 58" stroke-width="4"/>${EYE(54, 21, 1.8)}<path d="M50 27 q3 2 6 0" stroke-width="1.6"/>`,
  ),
  umbrella: doodle(
    `<path d="M12 46 Q12 14 50 12 Q88 14 88 46 Q81 40 75 46 Q69 40 63 46 Q56 40 50 46 Q44 40 37 46 Q31 40 25 46 Q19 40 12 46 Z" fill="#ff8a3d"/>`,
    `<path d="M12 46 Q12 14 50 12 Q88 14 88 46 Q81 40 75 46 Q69 40 63 46 Q56 40 50 46 Q44 40 37 46 Q31 40 25 46 Q19 40 12 46 Z"/><path d="M50 46 V84 q0 8 -8 8 q-6 0 -6 -6" stroke-width="3.4"/>`,
  ),
  rain: doodle(
    `<path d="M22 46 a14 14 0 0 1 8 -24 a18 18 0 0 1 34 -4 a14 14 0 0 1 14 28 Z" fill="#e3e8f0"/>`,
    `<path d="M22 46 a14 14 0 0 1 8 -24 a18 18 0 0 1 34 -4 a14 14 0 0 1 14 28 Z"/><path d="M30 58 l-4 10 M48 58 l-4 10 M66 58 l-4 10 M38 76 l-4 10 M58 76 l-4 10" stroke="#2f7fd8" stroke-width="3.4"/>`,
  ),
  monkey: critterSvg("monkey"),
  rope: doodle(
    `<rect x="40" y="6" width="20" height="8" fill="${WOOD}"/>`,
    `<rect x="40" y="6" width="20" height="8"/><path d="M50 14 C46 30 54 46 50 62 C46 76 58 84 50 92" stroke="#8a5a2b" stroke-width="5"/>`,
  ),
};

export const ITEMS: { kind: ItemKind; label: string; group: string }[] = [
  { kind: "ball", label: "ball", group: "Throw & launch" },
  { kind: "tower", label: "tower", group: "Throw & launch" },
  { kind: "building", label: "building", group: "Throw & launch" },
  { kind: "wall", label: "wall", group: "Throw & launch" },
  { kind: "block", label: "block", group: "Blocks & strings" },
  { kind: "incline", label: "incline", group: "Blocks & strings" },
  { kind: "table", label: "table", group: "Blocks & strings" },
  { kind: "pulley", label: "pulley", group: "Blocks & strings" },
  { kind: "monkey", label: "monkey", group: "Blocks & strings" },
  { kind: "rope", label: "rope", group: "Blocks & strings" },
  { kind: "bowl", label: "bowl", group: "Friction & curves" },
  { kind: "insect", label: "insect", group: "Friction & curves" },
  { kind: "man", label: "man", group: "Relative motion" },
  { kind: "umbrella", label: "umbrella", group: "Relative motion" },
  { kind: "rain", label: "rain", group: "Relative motion" },
];

const cache: Partial<Record<ItemKind, string>> = {};
/** <img> src for an item's doodle. */
export const itemSrc = (k: ItemKind) => (cache[k] ??= doodleSrc(SVG[k]));
export const itemLabel = (k: ItemKind) => ITEMS.find((i) => i.kind === k)!.label;
