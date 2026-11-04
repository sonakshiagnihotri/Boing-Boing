import { useEffect, useRef, useState, type ReactNode } from "react";
import { ITEMS, itemLabel, itemSrc, type ItemKind } from "./items";
import { CLASSICS, hint, recognize } from "./recognize";
import { ScenePlayer, type PlayerApi } from "../components/ScenePlayer";
import { Elephant } from "../buddy/Buddy";
import { sceneById } from "../scenes";
import type { Params } from "../engine/types";

export interface Sticker { id: number; kind: ItemKind; x: number; y: number } // x, y in % of the page

let nextId = 1;
export const makeStickers = (kinds: ItemKind[]): Sticker[] =>
  kinds.map((kind, i) => ({ id: nextId++, kind, x: 22 + ((i * 23) % 56), y: 30 + ((i * 17) % 40) }));

interface Props {
  stickers: Sticker[];
  setStickers: (s: Sticker[] | ((s: Sticker[]) => Sticker[])) => void;
  /** Extra starting values (from a question). */
  override?: Partial<Params>;
  overrideKey?: string;
  top?: (api: PlayerApi) => ReactNode;
  hideSolution?: boolean;
  startPaused?: boolean;
}

/** The page: drop items with +, and when they make a classic setup it snaps into a live simulation. */
export function Builder({ stickers, setStickers, override, overrideKey, top, hideSolution, startPaused }: Props) {
  const [menu, setMenu] = useState(false);
  const kinds = stickers.map((s) => s.kind);
  const setup = recognize(kinds);
  const setupKey = setup ? `${setup.sceneId}|${JSON.stringify(setup.params)}|${overrideKey ?? ""}` : null;

  // little "snap!" moment the first time the items click together
  const [snapping, setSnapping] = useState(false);
  const prevKey = useRef<string | null>(null);
  useEffect(() => {
    if (setupKey && !prevKey.current && !overrideKey) {
      setSnapping(true);
      const id = setTimeout(() => setSnapping(false), 800);
      prevKey.current = setupKey;
      return () => clearTimeout(id);
    }
    prevKey.current = setupKey;
  }, [setupKey, overrideKey]);

  const add = (kind: ItemKind) => {
    setStickers((s) => [...s, { id: nextId++, kind, x: 18 + Math.random() * 60, y: 22 + Math.random() * 50 }]);
    setMenu(false);
  };
  const remove = (id: number) => setStickers((s) => s.filter((x) => x.id !== id));

  const fab = (
    <>
      <button className={`fab ${menu ? "open" : ""}`} aria-label="Add something" onClick={() => setMenu((m) => !m)}>+</button>
      {menu && <AddMenu onAdd={add} />}
    </>
  );

  if (setup && !snapping) {
    const used = [...setup.used];
    const chips = (
      <div className="chips">
        {stickers.map((s) => {
          const i = used.indexOf(s.kind);
          const inSetup = i >= 0;
          if (inSetup) used.splice(i, 1);
          return (
            <button key={s.id} className={`chip ${inSetup ? "" : "extra"}`} title={inSetup ? "remove" : "not part of this setup"} onClick={() => remove(s.id)}>
              <img src={itemSrc(s.kind)} alt="" width={22} height={22} /> {itemLabel(s.kind)} <span className="x">×</span>
            </button>
          );
        })}
        <button className="chip ghost" onClick={() => setStickers([])}>clear page</button>
      </div>
    );
    return (
      <ScenePlayer
        key={setupKey}
        def={sceneById(setup.sceneId)}
        title={setup.title}
        initial={{ ...setup.params, ...override }}
        toolbar={<>{fab}{chips}</>}
        top={top}
        hideSolution={hideSolution}
        startPaused={startPaused}
      />
    );
  }

  return (
    <main>
      <div className="stage-wrap with-toolbar">
        <div className="toolbar">
          {fab}
          <span className="toolbar-hint">{stickers.length ? `${stickers.length} thing${stickers.length > 1 ? "s" : ""} on the page` : "add stuff to your page →"}</span>
          {stickers.length > 0 && <button className="chip ghost" onClick={() => setStickers([])}>clear page</button>}
        </div>
        <div className="page">
        <Board stickers={stickers} setStickers={setStickers} onRemove={remove} gather={snapping} />
        {!stickers.length && (
          <div className="board-hint">
            <big>your page is empty ✏️</big>
            <span>tap the + and build a physics question</span>
          </div>
        )}
        {snapping && setup && <div className="snap-flash">snap! ✨ {setup.title}</div>}
        <div className="buddy">
          <div className="bubble">{hint(kinds)}</div>
          <div className="buddy-btn"><Elephant hopKey={stickers.length} /></div>
        </div>
        </div>
      </div>
      <aside className="panel">
        <div>
          <h2 className="setup-name">Build a question</h2>
          <p className="blurb">Drop items on the page. When they make a classic JEE setup, it comes alive and you can play with it.</p>
        </div>
        <div className="classics">
          <h2 className="setup-name" style={{ fontSize: 20 }}>or start from a classic</h2>
          {CLASSICS.map((c) => (
            <button key={c.title} onClick={() => setStickers(makeStickers(c.items))}>
              <img src={itemSrc(c.items[c.items.length - 1])} alt="" width={36} height={36} />
              {c.title}
            </button>
          ))}
        </div>
      </aside>
    </main>
  );
}

function AddMenu({ onAdd }: { onAdd: (k: ItemKind) => void }) {
  const groups = [...new Set(ITEMS.map((i) => i.group))];
  return (
    <div className="menu" role="menu">
      {groups.map((g) => (
        <div key={g}>
          <h3>{g}</h3>
          <div className="menu-grid">
            {ITEMS.filter((i) => i.group === g).map((i) => (
              <button key={i.kind} className="menu-item" onClick={() => onAdd(i.kind)}>
                <img src={itemSrc(i.kind)} alt="" width={54} height={54} />
                {i.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty notebook page with draggable stickers. */
function Board({ stickers, setStickers, onRemove, gather }: { stickers: Sticker[]; setStickers: Props["setStickers"]; onRemove: (id: number) => void; gather: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);

  const move = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const { id, dx, dy } = drag.current;
    const x = Math.max(4, Math.min(96, ((e.clientX - r.left - dx) / r.width) * 100));
    const y = Math.max(6, Math.min(94, ((e.clientY - r.top - dy) / r.height) * 100));
    setStickers((s) => s.map((st) => (st.id === id ? { ...st, x, y } : st)));
  };

  return (
    <div className="board" ref={ref} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
      {stickers.map((s) => (
        <div
          key={s.id}
          className="sticker"
          style={{
            left: gather ? "50%" : `${s.x}%`,
            top: gather ? "50%" : `${s.y}%`,
            transform: "translate(-50%, -50%)",
            transition: gather ? "left .6s cubic-bezier(.5,0,.3,1.3), top .6s cubic-bezier(.5,0,.3,1.3)" : undefined,
          }}
          onPointerDown={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            drag.current = { id: s.id, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
        >
          <img src={itemSrc(s.kind)} alt={itemLabel(s.kind)} draggable={false} style={{ width: "100%", height: "100%" }} />
          <button className="rm" aria-label="remove" onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(s.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
