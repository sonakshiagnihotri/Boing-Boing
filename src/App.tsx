import { useState } from "react";
import { Builder, makeStickers, type Sticker } from "./builder/Builder";
import { recognize } from "./builder/recognize";
import { QuestionCard, QuestionList } from "./questions/QuestionUI";
import type { Question } from "./questions/bank";

type Mode = "build" | "questions";

export default function App() {
  const [mode, setMode] = useState<Mode>("build");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(false);

  // if the page no longer matches the question's setup (they removed something), drop the question
  const setup = recognize(stickers.map((s) => s.kind));
  const active = question && setup && setup.sceneId === recognize(question.items)?.sceneId ? question : null;

  const pick = (q: Question) => {
    setQuestion(q);
    setAnswered(false);
    setStickers(makeStickers(q.items));
    setMode("build");
  };

  return (
    <div className="app">
      <header>
        <h1>
          Boing Boing<span className="dot" />
        </h1>
        <span className="tagline">the physics lab you never got</span>
        <nav className="modes">
          <button className={mode === "build" ? "active" : ""} onClick={() => setMode("build")}>✏️ Build</button>
          <button className={mode === "questions" ? "active" : ""} onClick={() => setMode("questions")}>📝 Questions</button>
        </nav>
      </header>

      {mode === "questions" ? (
        <QuestionList onPick={pick} />
      ) : (
        <Builder
          stickers={stickers}
          setStickers={setStickers}
          override={active?.params}
          overrideKey={active?.id}
          hideSolution={!!active && !answered}
          startPaused={!!active && !answered}
          top={active ? (api) => (
            <QuestionCard key={active.id} q={active} api={api} onDone={() => setAnswered(true)} onExit={() => { setQuestion(null); }} />
          ) : undefined}
        />
      )}
    </div>
  );
}
