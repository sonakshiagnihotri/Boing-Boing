import { useMemo, useState, type ReactNode } from "react";
import { CanvasStage } from "./CanvasStage";
import { Buddy } from "../buddy/Buddy";
import type { Control, Params, SceneDef } from "../engine/types";

export const defaults = (def: SceneDef): Params => Object.fromEntries(def.controls.map((c) => [c.key, c.default]));

export interface PlayerApi {
  play: () => void; // restart the run and let it go
  pause: () => void;
  act: (id: string) => void; // press one of the scene's action buttons
}

interface Props {
  def: SceneDef;
  title?: string;
  initial?: Partial<Params>;
  startPaused?: boolean;
  /** Toolbar above the canvas (+ button, chips). */
  toolbar?: ReactNode;
  /** Something at the top of the side panel (e.g. a question card). */
  top?: (api: PlayerApi) => ReactNode;
  /** Question mode: keep the worked solution hidden until they answer. */
  hideSolution?: boolean;
}

/** One live setup: the canvas, its sliders and buttons, and the step-by-step solution. */
export function ScenePlayer({ def, title, initial, startPaused, toolbar, top, hideSolution }: Props) {
  const scene = useMemo(() => def.create(), [def]);
  const start = () => ({ ...defaults(def), ...initial }) as Params;
  const [params, setParams] = useState<Params>(start);
  const [running, setRunning] = useState(!startPaused);
  const [resetKey, setResetKey] = useState(0);
  const steps = def.solve?.(params) ?? [];
  const set = (k: string, v: number) => setParams((p) => ({ ...p, [k]: v }));
  const visible = (c: Control) => !c.hidden && (!c.showIf || c.showIf.in.includes(params[c.showIf.key]));
  const api: PlayerApi = {
    play: () => { setResetKey((k) => k + 1); setRunning(true); },
    pause: () => setRunning(false),
    act: (id) => {
      setRunning(true);
      const next = scene.action?.(id, params);
      if (next) setParams((q) => ({ ...q, ...next }) as Params);
    },
  };

  return (
    <main className={top ? "has-q" : ""}>
      {top && <div className="qslot">{top(api)}</div>}
      <div className={`stage-wrap ${toolbar ? "with-toolbar" : ""}`}>
        {toolbar && <div className="toolbar">{toolbar}</div>}
        <div className="page">
        <CanvasStage
          scene={scene}
          params={params}
          running={running}
          resetKey={resetKey}
          onParams={(next) => setParams((p) => ({ ...p, ...next }) as Params)}
        />
        <Buddy sceneId={def.id} scene={scene} params={params} />
        </div>
      </div>

      <aside className="panel">
        <div>
          <h2 className="setup-name">{title ?? def.name}</h2>
          <p className="blurb">{def.blurb}</p>
        </div>

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
              <input type="range" min={c.min} max={c.max} step={c.step} value={params[c.key]} onChange={(e) => set(c.key, Number(e.target.value))} />
            </label>
          ),
        )}

        {def.actions?.length ? (
          <div className="buttons">
            {def.actions.map((a) => (
              <button
                key={a.id}
                className={a.primary ? "primary" : ""}
                onClick={() => {
                  const next = scene.action?.(a.id, params);
                  if (next) setParams((q) => ({ ...q, ...next }) as Params);
                  setRunning(true);
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="buttons">
          <button onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Play"}</button>
          <button onClick={() => setResetKey((k) => k + 1)}>↺ Reset</button>
          <button onClick={() => { setParams(start()); setResetKey((k) => k + 1); }}>Defaults</button>
        </div>

        {hideSolution && steps.length > 0 && <p className="blurb">🔒 The step-by-step solution unlocks once you answer.</p>}
        {!hideSolution && steps.length > 0 && (
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
