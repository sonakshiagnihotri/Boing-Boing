/** World units are metres and seconds. y points UP in world space. */
export interface Vec2 {
  x: number;
  y: number;
}

export interface Viewport {
  width: number; // CSS pixels
  height: number; // CSS pixels
  pxPerMeter: number;
}

/** Slider values, keyed by control id. */
export type Params = Record<string, number>;

export type PointerKind = "down" | "move" | "up" | "leave";

/**
 * The live simulation. The engine owns the clock; scenes only step physics and draw.
 */
export interface Scene {
  reset(view: Viewport, params: Params): void;
  step(dt: number, params: Params): void; // fixed dt, physics only
  draw(ctx: CanvasRenderingContext2D, view: Viewport, params: Params): void;
  /** Buttons declared in SceneDef.actions land here. */
  action?(id: string, params: Params): void;
  /** Mouse/touch on the canvas (CSS px). Return params to push them back into the sliders. */
  pointer?(kind: PointerKind, p: Vec2, params: Params): Partial<Params> | void;
}

export interface Control {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  default: number;
  /** If set, rendered as a segmented picker; value is the option index. */
  options?: string[];
  /** Hide this control unless another control has one of these values. */
  showIf?: { key: string; in: number[] };
}

/** One row of the step-by-step solution panel. */
export interface SolutionStep {
  title: string;
  lines: string[];
  verdict?: { text: string; tone: "good" | "warn" | "info" };
}

/** Everything the app needs to show a scene: metadata, sliders, the sim, and the worked solution. */
export interface SceneDef {
  id: string;
  name: string;
  blurb: string;
  controls: Control[];
  actions?: { id: string; label: string; primary?: boolean }[];
  create(): Scene;
  solve?(params: Params): SolutionStep[];
}
