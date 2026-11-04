import { useState } from "react";
import { QUESTIONS, TOPICS, isRight, type Question } from "./bank";
import { itemSrc } from "../builder/items";
import { recognize } from "../builder/recognize";
import { defaults, type PlayerApi } from "../components/ScenePlayer";
import { sceneById } from "../scenes";
import type { Params } from "../engine/types";

/** Full parameter set a question runs with (scene defaults ← page setup ← question values). */
export function questionParams(q: Question): Params {
  const setup = recognize(q.items)!;
  return { ...defaults(sceneById(setup.sceneId)), ...setup.params, ...q.params } as Params;
}
export const correctAnswer = (q: Question) => q.answer(questionParams(q));
const show = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(2));

/** The sticky note at the top of the panel: question, your prediction, check. */
export function QuestionCard({ q, api, onDone, onExit }: { q: Question; api: PlayerApi; onDone: () => void; onExit: () => void }) {
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; truth: number }>(null);
  const truth = correctAnswer(q);

  const check = (gaveUp = false) => {
    const g = parseFloat(guess);
    setResult({ ok: !gaveUp && Number.isFinite(g) && isRight(g, truth), truth });
    onDone();
    if (q.playAction) api.act(q.playAction);
    else api.play();
  };

  return (
    <div className="question">
      <div className="buttons" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="tag" style={{ font: "15px var(--hand)", color: "var(--muted)", flex: "none" }}>📝 {q.topic}</span>
        <button className="ghost" style={{ flex: "none", padding: "2px 8px" }} onClick={onExit}>✕ exit</button>
      </div>
      <div className="q">{q.text}</div>
      <div className="ask">{q.ask}</div>
      {!result ? (
        <>
          <div className="answer-row">
            <input
              inputMode="decimal"
              placeholder="your prediction"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && guess && check()}
            />
            <span className="unit">{q.unit}</span>
          </div>
          <div className="buttons">
            <button className="primary" disabled={!guess} onClick={() => check()}>Lock it in 🔒</button>
            <button onClick={() => check(true)}>Just show me</button>
          </div>
        </>
      ) : (
        <div className={`result ${result.ok ? "right" : "wrong"}`}>
          {result.ok ? `✅ yesss, it's ${show(truth)} ${q.unit}` : `${guess ? `you said ${guess}, ` : ""}it's ${show(truth)} ${q.unit}. watch it happen 👇`}
        </div>
      )}
    </div>
  );
}

/** The question picker, grouped by topic. */
export function QuestionList({ onPick }: { onPick: (q: Question) => void }) {
  return (
    <main className="solo">
      <div className="stage-wrap">
        <div className="qlist">
          <h2>Pick a question 📝</h2>
          <p>Predict the answer first, then watch it happen. The page builds itself, so you can mess with it after.</p>
          {TOPICS.map((t) => (
            <section key={t} className="qgroup">
              <h3>{t}</h3>
              <div className="qcards">
                {QUESTIONS.filter((q) => q.topic === t).map((q) => (
                  <button key={q.id} className="qcard" onClick={() => onPick(q)}>
                    <span className="tag" style={{ display: "flex", gap: 2 }}>
                      {q.items.map((k, i) => <img key={i} src={itemSrc(k)} alt="" width={26} height={26} />)}
                    </span>
                    <span className="txt">{q.text}</span>
                    <b className="txt">{q.ask}</b>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
