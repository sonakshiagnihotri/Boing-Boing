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

/**
 * Every scene (bouncing ball, incline, rain-man) implements this.
 * The engine owns the clock; scenes only step physics and draw.
 */
export interface Scene<P = Record<string, number>> {
  reset(view: Viewport, params: P): void;
  step(dt: number, params: P): void; // fixed dt, physics only
  draw(ctx: CanvasRenderingContext2D, view: Viewport, params: P): void;
}
