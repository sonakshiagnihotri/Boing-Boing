/**
 * Everything the elephant says lives here. Rewrite these in your own voice!
 *
 * LINES[sceneId][status] = things it might say when that scene is in that state.
 * Status keys come from each scene's status() method.
 * TAPS = random hints when someone taps the elephant.
 */
export const LINES: Record<string, Record<string, string[]>> = {
  projectile: {
    idle: [
      "drag from the launcher and yeet it 🚀",
      "psst. move the v slider and watch the dotted line. that's the future, bestie",
    ],
    aiming: ["pull back further = more speed. physics said so"],
    flying: [
      "see the dots? the sideways gaps stay the SAME. vx is literally unbothered",
      "vy is doing all the drama. vx is just vibing",
    ],
    fast: [
      "bro that ball is in another district now 💀",
      "the camera had to zoom out to Nagpur for this one",
    ],
    wall: ["wall only flips vx. gravity doesn't care about walls, so the fall time stays the same"],
    landed: [
      "now change ONE thing and launch again. that's how it actually clicks",
      "hover on the path. I'll tell you exactly where it was at any time",
    ],
    compare: [
      "same angle, different speeds. see how range blows up with speed? it goes like v²",
      "the slower ones land first only if... hmm, does it? check the T values 👀",
    ],
  },
  incline: {
    rest: [
      "it's chilling. friction only pushes as hard as it needs to, zero extra effort",
      "crank θ up slowly and find the exact angle where it gives up",
    ],
    edge: ["ooh we're close... it's holding on for dear life rn"],
    sliding: [
      "and it's GONE. tanθ > μs, block said bye 👋",
      "kinetic friction is smaller than max static, that's why it speeds up once it breaks free",
    ],
    up: ["going up, gravity AND friction are both ganging up on it"],
    bottom: ["touchdown. hit Run again and try a different μ"],
  },
  pulley: {
    stuck: [
      "m₂ is pulling, but friction said 'not today'",
      "add a little more m₂... find the exact mass where it starts moving",
    ],
    balanced: ["equal masses = tug of war nobody wins. a = 0"],
    moving: [
      "T is LESS than m₂g here. the hanging block is accelerating, so the string doesn't hold its full weight",
      "watch the pulley spin. string length never changes, so both blocks share the same a",
    ],
    atwood: ["heavier side wins, but T always sits between m₁g and m₂g. always."],
    hit: ["crash 😭 hit Reset and change a mass"],
  },
};

export const TAPS = [
  "stuck? change one slider at a time and watch what moves",
  "the step-by-step panel updates live. wiggle a slider and read along",
  "predict first, THEN hit play. being wrong is how your brain remembers it",
  "every arrow on screen is a real force. count them before you write ΣF",
];
