# Boing Boing ●

*the physics lab you never got*

A notebook-doodle physics playground for JEE students. Build a setup from the **+** menu, or pick a question, predict the answer, and watch it happen with every force drawn and a step-by-step solution that updates live.

## What's inside
- **Build mode:** drop items (ball, tower, building, wall, block, incline, table, pulley, bowl, insect, man, umbrella, rain, monkey, rope) on an empty page. When they make a classic setup, it snaps into a live simulation.
- **Question mode:** 19 JEE-style questions. Lock in a prediction, then watch. Answers are computed from the same physics the simulation runs.
- **Setups:** projectiles (+ wall, bounces), block on incline (static vs kinetic, push up the slope), strings & pulleys (table, Atwood, incline + hanging), insect in a bowl, rain-man (ground/man frame, tilt the umbrella), monkey on a rope (tension limit).
- An elephant friend who reacts to what's happening, and a googly-eyed guy who watches the action.

## Run
```
npm install
npm run dev
```

## Structure
```
src/engine/     camera, drawing kit (sketchy ink, crayon fills), types
src/scenes/     one file per setup: physics + drawing + solution
src/builder/    + menu items, setup recognition, the page
src/questions/  question bank + question card/list
src/buddy/      elephant, critters, the elephant's lines (edit lines.ts!)
```

## Next
- Paste-any-question AI parser
- More setups: circular motion, springs, collisions
