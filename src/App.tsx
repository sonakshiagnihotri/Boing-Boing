import { useMemo, useState } from "react";
import { CanvasStage } from "./components/CanvasStage";
import { scenes } from "./scenes";
import type { Control, Params, SceneDef } from "./engine/types";

const defaults = (def: SceneDef): Params =>
  Object.fromEntries(def.controls.map((c) => [c.key, c.default]));

export default function App() {
  const [sceneId, setSceneId] = useState(scenes[0].id);
  const def = scenes.find((s) => s.id === sceneId)!;

  return (
    <div className="app">
      <header>
        <h1>
          Boing Boing<span className="dot" />
        </h1>
        <nav className="tabs">
          {scenes.map((s) => (
            <button key={s.id} className={s.id === sceneId ? "active" : ""} onClick={() => setSceneId(s.id)}>
              {s.name}
            </button>
          ))}
        </nav>
      </header>
      {/* key = fresh sim + fresh sliders when switching scenes */}
      <ScenePlayer key={def.id} def={def} />
    </div>
  );
}

function ScenePlayer({ def }: { def: SceneDef }) {
  const scene = useMemo(() => def.create(), [def]);
  const [params, setParams] = useState<Params>(() => defaults(def));
  const [running, setRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const steps = def.solve?.(params) ?? [];
  const set = (k: string, v: number) => setParams((p) => ({ ...p, [k]: v }));
  const visible = (c: Control) => !c.showIf || c.showIf.in.includes(params[c.showIf.key]);

  return (
    <main>
      <CanvasStage
        scene={scene}
        params={params}
        running={running}
        resetKey={resetKey}
        onParams={(next) => setParams((p) => ({ ...p, ...next }) as Params)}
      />

      <aside className="panel">
        <p className="blurb">{def.blurb}</p>

        {def.controls.filter(visible).map((c) =>
          c.options ? (
            <div key={c.key} className="segmented">
              {c.options.map((o, i) => (
                <button key={o} className={params[c.key] === i ? "active" : ""} onClick={() => { set(c.key, i); setResetKey((k) => k + 1); }}>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <label key={c.key} className="slider">
              <span>
                {c.label} = <b>{params[c.key].toFixed(c.step < 0.1 ? 2 : c.step < 1 ? 1 : 0)}</b> {c.unit}
              </span>
              <input
                type="range" min={c.min} max={c.max} step={c.step} value={params[c.key]}
                onChange={(e) => set(c.key, Number(e.target.value))}
              />
            </label>
          ),
        )}

        <div className="buttons">
          {def.actions?.map((a) => (
            <button key={a.id} className={a.primary ? "primary" : ""} onClick={() => scene.action?.(a.id, params)}>
              {a.label}
            </button>
          ))}
        </div>
        <div className="buttons">
          <button onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Play"}</button>
          <button onClick={() => setResetKey((k) => k + 1)}>↺ Reset</button>
          <button onClick={() => { setParams(defaults(def)); setResetKey((k) => k + 1); }}>Defaults</button>
        </div>

        {steps.length > 0 && (
          <section className="solution">
            <h2>Step-by-step · updates live</h2>
            {steps.map((st) => (
              <div key={st.title} className="step">
                <h3>{st.title}</h3>
                {st.lines.map((l) => <p key={l}>{l}</p>)}
                {st.verdict && <div className={`verdict ${st.verdict.tone}`}>{st.verdict.text}</div>}
              </div>
            ))}
          </section>
        )}
      </aside>
    </main>
  );
}
