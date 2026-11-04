/**
 * Looks at what's on the page and decides which classic JEE setup it adds up to.
 * Order matters: more specific setups are checked first.
 */
import type { Params } from "../engine/types";
import type { ItemKind } from "./items";

export interface Setup {
  sceneId: string;
  params: Partial<Params>;
  used: ItemKind[]; // which items take part (the rest are just decoration)
  title: string;
}

type Counts = Partial<Record<ItemKind, number>>;
const count = (kinds: ItemKind[]) => kinds.reduce<Counts>((c, k) => ((c[k] = (c[k] ?? 0) + 1), c), {});

export function recognize(kinds: ItemKind[]): Setup | null {
  const c = count(kinds);
  const has = (k: ItemKind, n = 1) => (c[k] ?? 0) >= n;

  if (has("man") && has("rain")) {
    return { sceneId: "rainman", params: { umb: has("umbrella") ? 1 : 0 }, used: ["man", "rain", ...(has("umbrella") ? ["umbrella" as const] : [])], title: "Rain-man" };
  }
  if (has("bowl") && has("insect")) return { sceneId: "bowl", params: {}, used: ["bowl", "insect"], title: "Insect in a bowl" };
  if (has("monkey") && has("rope")) return { sceneId: "monkey", params: {}, used: ["monkey", "rope"], title: "Monkey on a rope" };
  if (has("pulley") && has("block", 2)) {
    const mode = has("incline") ? 2 : has("table") ? 0 : 1;
    const extra: ItemKind[] = mode === 2 ? ["incline"] : mode === 0 ? ["table"] : [];
    return { sceneId: "pulley", params: { mode }, used: ["pulley", "block", "block", ...extra], title: ["Table + hanging block", "Atwood machine", "Incline + hanging block"][mode] };
  }
  if (has("incline") && has("block")) return { sceneId: "incline", params: {}, used: ["incline", "block"], title: "Block on an incline" };
  if (has("ball")) {
    const base: ItemKind[] = has("building") ? ["building"] : has("tower") ? ["tower"] : [];
    return {
      sceneId: "projectile",
      params: { h: has("building") ? 30 : has("tower") ? 15 : 0, wall: has("wall") ? 15 : 0, angle: has("building") || has("tower") ? 30 : 45 },
      used: ["ball", ...base, ...(has("wall") ? ["wall" as const] : [])],
      title: has("wall") ? "Projectile + wall" : has("building") ? "Throw off a building" : has("tower") ? "Launch off a tower" : "Projectile",
    };
  }
  return null;
}

/** What the elephant says when the page doesn't add up to anything yet. */
export function hint(kinds: ItemKind[]): string {
  const c = count(kinds);
  const has = (k: ItemKind, n = 1) => (c[k] ?? 0) >= n;
  if (!kinds.length) return "tap the + and drop some stuff in. try a tower and a ball 👀";
  if (has("pulley") && has("block")) return "a pulley needs a block on EACH side. add one more block";
  if (has("pulley")) return "pulleys need two blocks. add a table or incline too for the fancy versions";
  if (has("block") && has("table")) return "table + block... now add a pulley and a second block to hang off the edge";
  if (has("block")) return "put that block on an incline 📐, or hang two blocks over a pulley";
  if (has("incline")) return "nice ramp. drop a block on it";
  if (has("table")) return "table + pulley + two blocks = the classic string question";
  if (has("tower") || has("building") || has("wall")) return "now add a ball to throw ⚾";
  if (has("insect")) return "the insect wants a bowl to climb in";
  if (has("bowl")) return "add an insect and see how high it can crawl";
  if (has("man") || has("umbrella")) return "make it rain 🌧️";
  if (has("rain")) return "rain needs someone to rain on. add a man";
  if (has("monkey")) return "give the monkey a rope to climb";
  if (has("rope")) return "add a monkey to climb that rope";
  return "hmm, these don't make a setup yet. try a classic from the list";
}

/** One-tap starter pages. */
export const CLASSICS: { title: string; items: ItemKind[] }[] = [
  { title: "Ball off a tower", items: ["tower", "ball"] },
  { title: "Block on an incline", items: ["incline", "block"] },
  { title: "Table + pulley + blocks", items: ["table", "pulley", "block", "block"] },
  { title: "Atwood machine", items: ["pulley", "block", "block"] },
  { title: "Insect in a bowl", items: ["bowl", "insect"] },
  { title: "Rain-man", items: ["man", "umbrella", "rain"] },
  { title: "Monkey on a rope", items: ["monkey", "rope"] },
  { title: "Ball + wall", items: ["building", "ball", "wall"] },
];
