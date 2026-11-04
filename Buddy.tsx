import { useEffect, useRef, useState } from "react";
import type { Params, Scene } from "../engine/types";
import { LINES, TAPS } from "./lines";

const pick = <T,>(arr: T[], not?: T) => {
  const pool = arr.length > 1 ? arr.filter((x) => x !== not) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * The elephant friend. Watches the scene's status() and says something when it changes.
 */
export function Buddy({ sceneId, scene, params }: { sceneId: string; scene: Scene; params: Params }) {
  const [line, setLine] = useState("");
  const [hop, setHop] = useState(0); // bump to replay the hop animation
  const [open, setOpen] = useState(true);
  const lastKey = useRef("");
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const say = (text: string) => {
    setLine(text);
    setHop((h) => h + 1);
    setOpen(true);
  };

  useEffect(() => {
    lastKey.current = "";
    const id = setInterval(() => {
      const key = scene.status?.(paramsRef.current) ?? "";
      if (key === lastKey.current) return;
      lastKey.current = key;
      const options = LINES[sceneId]?.[key];
      if (options?.length) say(pick(options));
    }, 250);
    return () => clearInterval(id);
  }, [scene, sceneId]);

  return (
    <div className="buddy">
      {open && line && (
        <div className="bubble" key={hop} onClick={() => setOpen(false)} title="tap to hide">
          {line}
        </div>
      )}
      <button className="buddy-btn" aria-label="Ask the elephant for a hint" onClick={() => say(pick(TAPS, line))}>
        <Elephant hopKey={hop} />
      </button>
    </div>
  );
}

/** Doodled elephant holding the Boing Boing ball. Original art, plain SVG with a "hand-drawn" filter. */
function Elephant({ hopKey }: { hopKey: number }) {
  return (
    <svg key={hopKey} className="elephant" viewBox="0 0 150 150" width="100" height="100" aria-hidden="true">
      <defs>
      {/* wobbly ink: nudges every line a little so it looks hand-drawn */}
      <filter id="wobble" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* crayon fill: speckled coverage */}
      <filter id="crayon" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" result="grain" />
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.05" result="mask" />
      <feComposite in="SourceGraphic" in2="mask" operator="in" result="speck" />
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="speck" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      </defs>

      {/* FILLS (crayon) */}
      <g filter="url(#crayon)">
      {/* ears */}
      <path d="M47 40 C26 30 12 48 16 66 C19 80 32 86 46 78 Z" fill="#9fb0ea" />
      <path d="M103 40 C124 30 138 48 134 66 C131 80 118 86 104 78 Z" fill="#9fb0ea" />
      {/* body */}
      <path d="M44 92 C40 118 50 134 75 134 C100 134 110 118 106 92 C100 80 50 80 44 92 Z" fill="#a9b8f0" />
      {/* head */}
      <path d="M75 22 C98 22 108 38 107 56 C106 74 92 84 75 84 C58 84 44 74 43 56 C42 38 52 22 75 22 Z" fill="#a9b8f0" />
      {/* feet */}
      <ellipse cx="57" cy="132" rx="14" ry="10" fill="#a9b8f0" />
      <ellipse cx="93" cy="132" rx="14" ry="10" fill="#a9b8f0" />
      {/* trunk */}
      <path d="M69 64 C67 80 70 92 82 94 C95 96 104 86 106 76" fill="none" stroke="#a9b8f0" strokeWidth="12" strokeLinecap="round" />
      {/* blush */}
      <circle cx="55" cy="62" r="6.5" fill="#ff9fb4" />
      <circle cx="95" cy="62" r="6.5" fill="#ff9fb4" />
      {/* ball */}
      <circle cx="112" cy="64" r="11" fill="#ff8a3d" />
      </g>

      {/* INK (wobbly) */}
      <g filter="url(#wobble)" fill="none" stroke="#17191f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      {/* ears */}
      <path d="M47 40 C26 30 12 48 16 66 C19 80 32 86 46 78" />
      <path d="M103 40 C124 30 138 48 134 66 C131 80 118 86 104 78" />
      <path d="M30 52 C26 58 27 66 32 70" strokeWidth="1.6" />
      <path d="M120 52 C124 58 123 66 118 70" strokeWidth="1.6" />
      {/* body */}
      <path d="M47 86 C40 104 42 124 54 130" />
      <path d="M103 86 C110 104 108 124 96 130" />
      {/* little arms */}
      <path d="M58 98 C60 108 62 112 66 114" strokeWidth="2.2" />
      <path d="M92 98 C90 108 88 112 84 114" strokeWidth="2.2" />
      {/* feet */}
      <ellipse cx="57" cy="132" rx="14" ry="10" />
      <ellipse cx="93" cy="132" rx="14" ry="10" />
      <path d="M51 138 v-3 M57 139 v-3 M63 138 v-3 M87 138 v-3 M93 139 v-3 M99 138 v-3" strokeWidth="1.8" />
      {/* head */}
      <path d="M75 22 C98 22 108 38 107 56 C106 70 98 79 88 82" />
      <path d="M62 82 C52 79 44 70 43 56 C42 38 52 22 75 22" />
      {/* trunk: two outlines + tip */}
      <path d="M63 66 C61 84 66 98 82 100 C98 102 109 90 111 78" />
      <path d="M75 66 C74 80 76 87 83 88 C92 89 98 83 100 76" />
      <path d="M100 76 C102 74 109 74 111 78" />
      <path d="M70 92 q3 1 4 4 M78 96 q2 1 3 3" strokeWidth="1.4" />
      {/* hair tuft */}
      <path d="M72 22 C70 15 73 11 75 10 M76 22 C77 15 81 12 84 13 M70 23 C66 18 63 18 62 19" strokeWidth="2.2" />
      {/* smile */}
      <path d="M68 74 q-3 3 -6 1" strokeWidth="2" />
      <path d="M82 74 q3 3 6 1" strokeWidth="2" />
      {/* ball */}
      <circle cx="112" cy="64" r="11" />
      </g>

      {/* eyes + shine (crisp) */}
      <g filter="url(#wobble)">
      <ellipse cx="62" cy="50" rx="4" ry="5" fill="#17191f" />
      <ellipse cx="88" cy="50" rx="4" ry="5" fill="#17191f" />
      <circle cx="63.4" cy="48" r="1.5" fill="#fff" />
      <circle cx="89.4" cy="48" r="1.5" fill="#fff" />
      <path d="M106 60 q3 -4 7 -3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}
