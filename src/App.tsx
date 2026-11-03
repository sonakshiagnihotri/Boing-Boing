import { useMemo, useState } from "react";
import { CanvasStage } from "./components/CanvasStage";
import { createBouncingBall, type BallParams } from "./scenes/bouncingBall";

export default function App() {
  const scene = useMemo(() => createBouncingBall(), []);
  const [params, setParams] = useState<BallParams>({ g: 9.8, restitution: 0.8 });
  const [running, setRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="app">
      <header>
        <h1>Physics Playground</h1>
        <span className="tag">Bouncing ball · starter</span>
      </header>

      <main>
        <CanvasStage scene={scene} params={params} running={running} resetKey={resetKey} />

        <aside className="panel">
          <Slider label="g" unit="m/s²" min={1} max={20} step={0.1}
            value={params.g} onChange={(g) => setParams((p) => ({ ...p, g }))} />
          <Slider label="e (restitution)" min={0} max={1} step={0.01}
            value={params.restitution} onChange={(restitution) => setParams((p) => ({ ...p, restitution }))} />
          <div className="buttons">
            <button onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Play"}</button>
            <button onClick={() => setResetKey((k) => k + 1)}>Reset</button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Slider(props: {
  label: string; unit?: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="slider">
      <span>{props.label} = <b>{props.value.toFixed(2)}</b> {props.unit}</span>
      <input type="range" min={props.min} max={props.max} step={props.step}
        value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} />
    </label>
  );
}
