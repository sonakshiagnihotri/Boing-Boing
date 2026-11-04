import type { Vec2, Viewport } from "./types";

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * World (m, y-up) -> screen (px, y-down) with a uniform scale.
 * `follow()` eases toward a target so zooming out for a 300 m/s shot feels smooth, not jumpy.
 */
export class Camera {
  scale = 50; // px per metre
  ox = 0; // screen x of world x=0
  oy = 0; // screen y of world y=0
  private ready = false;

  static target(b: Bounds, view: Viewport, pad = { l: 60, r: 40, t: 70, b: 50 }) {
    const w = Math.max(b.maxX - b.minX, 1e-3);
    const h = Math.max(b.maxY - b.minY, 1e-3);
    const scale = Math.min((view.width - pad.l - pad.r) / w, (view.height - pad.t - pad.b) / h);
    // centre the content horizontally in the leftover space, sit it on the bottom pad
    const usedW = w * scale;
    const ox = pad.l + (view.width - pad.l - pad.r - usedW) / 2 - b.minX * scale;
    const oy = view.height - pad.b + b.minY * scale;
    return { scale, ox, oy };
  }

  follow(b: Bounds, view: Viewport, ease = 0.12, pad?: { l: number; r: number; t: number; b: number }) {
    const t = Camera.target(b, view, pad);
    if (!this.ready) {
      Object.assign(this, t);
      this.ready = true;
      return;
    }
    this.scale += (t.scale - this.scale) * ease;
    this.ox += (t.ox - this.ox) * ease;
    this.oy += (t.oy - this.oy) * ease;
  }

  snap(b: Bounds, view: Viewport, pad?: { l: number; r: number; t: number; b: number }) {
    Object.assign(this, Camera.target(b, view, pad));
    this.ready = true;
  }

  toScreen = (p: Vec2): Vec2 => ({ x: this.ox + p.x * this.scale, y: this.oy - p.y * this.scale });
  toWorld = (p: Vec2): Vec2 => ({ x: (p.x - this.ox) / this.scale, y: (this.oy - p.y) / this.scale });
}
