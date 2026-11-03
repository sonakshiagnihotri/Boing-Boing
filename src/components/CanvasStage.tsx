import { useEffect, useRef } from "react";
import type { Scene, Viewport } from "../engine/types";

interface Props<P> {
  scene: Scene<P>;
  params: P;
  running: boolean;
  resetKey: number; // bump to reset the scene
  pxPerMeter?: number;
}

const FIXED_DT = 1 / 120; // physics step (s)
const MAX_FRAME = 0.25; // avoid spiral-of-death after tab switch

/**
 * Owns the <canvas>: HiDPI sizing, resize handling, and a fixed-timestep loop.
 * Params live in a ref so slider changes don't restart the loop.
 */
export function CanvasStage<P>({ scene, params, running, resetKey, pxPerMeter = 50 }: Props<P>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  const runningRef = useRef(running);
  const viewRef = useRef<Viewport>({ width: 0, height: 0, pxPerMeter });

  paramsRef.current = params;
  runningRef.current = running;

  // Resize + DPR handling
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewRef.current = { width, height, pxPerMeter };
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [pxPerMeter]);

  // Reset when the scene or resetKey changes
  useEffect(() => {
    // measure directly — the ResizeObserver may not have fired yet on first mount
    const canvas = canvasRef.current!;
    const view = { width: canvas.clientWidth, height: canvas.clientHeight, pxPerMeter };
    viewRef.current = view;
    scene.reset(view, paramsRef.current);
  }, [scene, resetKey, pxPerMeter]);

  // Main loop
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    let last = performance.now();
    let acc = 0;
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
      last = now;
      if (runningRef.current) {
        acc += elapsed;
        while (acc >= FIXED_DT) {
          scene.step(FIXED_DT, paramsRef.current);
          acc -= FIXED_DT;
        }
      }
      const view = viewRef.current;
      ctx.clearRect(0, 0, view.width, view.height);
      scene.draw(ctx, view, paramsRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  return <canvas ref={canvasRef} className="stage" />;
}
