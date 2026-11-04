/**
 * JEE-style questions. Each one builds a page (items), sets the sliders (params),
 * and computes its answer from the same physics the simulation runs on.
 */
import type { Params } from "../engine/types";
import type { ItemKind } from "../builder/items";
import { analyze } from "../scenes/incline";
import { solveSystem } from "../scenes/pulley";
import { bowlPhysics } from "../scenes/bowl";
import { rainPhysics } from "../scenes/rainman";
import { monkeyPhysics } from "../scenes/monkey";

export interface Question {
  id: string;
  topic: string;
  items: ItemKind[];
  params: Partial<Params>;
  text: string;
  ask: string;
  unit: string;
  answer: (p: Params) => number;
  /** what to do when they press Check (e.g. fire the ball) */
  playAction?: string;
}

const DEG = Math.PI / 180;
const G = 9.8;

const flightTime = (p: Params) => {
  const uy = p.v * Math.sin(p.angle * DEG);
  return (uy + Math.sqrt(uy * uy + 2 * p.g * p.h)) / p.g;
};

export const QUESTIONS: Question[] = [
  // ---------- projectiles ----------
  {
    id: "p1", topic: "Projectiles", items: ["tower", "ball"], params: { h: 20, v: 10, angle: 0 }, playAction: "launch",
    text: "A ball is thrown horizontally at 10 m/s from the top of a 20 m tall tower.",
    ask: "How far from the base of the tower does it land?", unit: "m",
    answer: (p) => p.v * Math.cos(p.angle * DEG) * flightTime(p),
  },
  {
    id: "p2", topic: "Projectiles", items: ["ball"], params: { h: 0, v: 20, angle: 30 }, playAction: "launch",
    text: "A ball is thrown from the ground at 20 m/s, 30° above the horizontal.",
    ask: "What maximum height does it reach?", unit: "m",
    answer: (p) => (p.v * Math.sin(p.angle * DEG)) ** 2 / (2 * p.g),
  },
  {
    id: "p3", topic: "Projectiles", items: ["ball"], params: { h: 0, v: 25, angle: 37 }, playAction: "launch",
    text: "A football is kicked at 25 m/s at 37° to the ground.",
    ask: "What is its horizontal range?", unit: "m",
    answer: (p) => (p.v * p.v * Math.sin(2 * p.angle * DEG)) / p.g,
  },
  {
    id: "p4", topic: "Projectiles", items: ["building", "ball"], params: { h: 30, v: 15, angle: 30 }, playAction: "launch",
    text: "From the roof of a 30 m building, a ball is thrown at 15 m/s, 30° above the horizontal.",
    ask: "How long is it in the air?", unit: "s",
    answer: flightTime,
  },
  {
    id: "p5", topic: "Projectiles", items: ["tower", "ball", "wall"], params: { h: 5, v: 18, angle: 30, e: 0.6, wall: 15 }, playAction: "launch",
    text: "From a 5 m tower, a ball is thrown at 18 m/s, 30° up, towards a wall 15 m away. The collision has e = 0.6.",
    ask: "How far from the tower does it finally land?", unit: "m",
    answer: (p) => {
      const ux = p.v * Math.cos(p.angle * DEG);
      return p.wall - p.e * ux * (flightTime(p) - p.wall / ux);
    },
  },

  // ---------- friction on an incline ----------
  {
    id: "i1", topic: "Friction", items: ["incline", "block"], params: { theta: 30, mus: 0.5, muk: 0.3, v0: 0 }, playAction: "reset",
    text: "A block rests on a 30° incline. μs = 0.5 and μk = 0.3.",
    ask: "What is the block's acceleration down the slope?", unit: "m/s²",
    answer: (p) => (analyze(p).holds ? 0 : analyze(p).aSlide),
  },
  {
    id: "i2", topic: "Friction", items: ["incline", "block"], params: { theta: 15, mus: 0.6, muk: 0.4, v0: 0 },
    text: "The coefficient of static friction between a block and an incline is 0.6.",
    ask: "Above what angle does the block start sliding? (then drag θ to check!)", unit: "°",
    answer: (p) => Math.atan(p.mus) / DEG,
  },
  {
    id: "i3", topic: "Friction", items: ["incline", "block"], params: { theta: 30, mus: 0.5, muk: 0.3, v0: 8 }, playAction: "reset",
    text: "A block is pushed up a 30° incline with speed 8 m/s. μk = 0.3.",
    ask: "How far up the slope does it travel before stopping?", unit: "m",
    answer: (p) => (p.v0 * p.v0) / (2 * analyze(p).aUp),
  },

  // ---------- strings & pulleys ----------
  {
    id: "s1", topic: "Strings & pulleys", items: ["pulley", "block", "block"], params: { mode: 1, m1: 3, m2: 5 },
    text: "Two blocks of 3 kg and 5 kg hang over a light frictionless pulley (Atwood machine).",
    ask: "What is the acceleration of the blocks?", unit: "m/s²",
    answer: (p) => Math.abs(solveSystem(p).a),
  },
  {
    id: "s2", topic: "Strings & pulleys", items: ["pulley", "block", "block"], params: { mode: 1, m1: 3, m2: 5 },
    text: "Same Atwood machine: 3 kg and 5 kg over a light pulley.",
    ask: "What is the tension in the string?", unit: "N",
    answer: (p) => solveSystem(p).T,
  },
  {
    id: "s3", topic: "Strings & pulleys", items: ["table", "pulley", "block", "block"], params: { mode: 0, m1: 4, m2: 2, mu: 0.25 },
    text: "A 4 kg block on a table (μ = 0.25) is tied over a pulley to a hanging 2 kg block.",
    ask: "What is the acceleration of the system?", unit: "m/s²",
    answer: (p) => solveSystem(p).a,
  },
  {
    id: "s4", topic: "Strings & pulleys", items: ["table", "pulley", "block", "block"], params: { mode: 0, m1: 10, m2: 2, mu: 0.3 },
    text: "A 10 kg block on a table (μ = 0.3) is tied over a pulley to a hanging 2 kg block.",
    ask: "What friction force acts on the 10 kg block? (careful 👀)", unit: "N",
    answer: (p) => solveSystem(p).f,
  },
  {
    id: "s5", topic: "Strings & pulleys", items: ["incline", "pulley", "block", "block"], params: { mode: 2, m1: 4, m2: 3, mu: 0.2, theta: 30 },
    text: "A 4 kg block on a 30° incline (μ = 0.2) is tied over a pulley at the top to a hanging 3 kg block.",
    ask: "What is the acceleration of the system?", unit: "m/s²",
    answer: (p) => Math.abs(solveSystem(p).a),
  },
  {
    id: "m1", topic: "Strings & pulleys", items: ["monkey", "rope"], params: { m: 20, Tmax: 300, a: 0 }, playAction: "reset",
    text: "A 20 kg monkey climbs a rope that can take at most 300 N.",
    ask: "What's the maximum acceleration it can climb up with? (then set a and test it!)", unit: "m/s²",
    answer: (p) => monkeyPhysics(p).aMaxUp,
  },
  {
    id: "m2", topic: "Strings & pulleys", items: ["monkey", "rope"], params: { m: 25, Tmax: 200, a: -2 }, playAction: "reset",
    text: "A 25 kg monkey hangs on a rope that breaks above 200 N. It can't even hang still!",
    ask: "With what minimum acceleration must it slide down to stay safe?", unit: "m/s²",
    answer: (p) => G - p.Tmax / p.m,
  },

  // ---------- curves ----------
  {
    id: "b1", topic: "Friction", items: ["bowl", "insect"], params: { R: 1.5, mu: 0.75 }, playAction: "reset",
    text: "An insect crawls up the inside of a hemispherical bowl of radius 1.5 m. μ = 0.75.",
    ask: "How high above the bottom can it get?", unit: "m",
    answer: (p) => bowlPhysics(p).h,
  },
  {
    id: "b2", topic: "Friction", items: ["bowl", "insect"], params: { R: 2, mu: 0.58 }, playAction: "reset",
    text: "An insect is in a bowl of radius 2 m. The coefficient of friction is 0.58 (≈ 1/√3).",
    ask: "Up to what height can it climb?", unit: "m",
    answer: (p) => bowlPhysics(p).h,
  },

  // ---------- relative motion ----------
  {
    id: "r1", topic: "Relative motion", items: ["man", "umbrella", "rain"], params: { vr: 6, vm: 3, wind: 0, tilt: 0, frame: 0 },
    text: "Rain falls vertically at 6 m/s. A man walks at 3 m/s.",
    ask: "At what angle from vertical should he hold his umbrella? (then tilt it and see if he stays dry)", unit: "°",
    answer: (p) => Math.abs(rainPhysics(p).alphaDeg),
  },
  {
    id: "r2", topic: "Relative motion", items: ["man", "umbrella", "rain"], params: { vr: 10, vm: 10, wind: 0, tilt: 0, frame: 1 },
    text: "Rain falls vertically at 10 m/s and a cyclist rides at 10 m/s.",
    ask: "How fast does the rain hit the cyclist (speed relative to him)?", unit: "m/s",
    answer: (p) => rainPhysics(p).relSpeed,
  },
];

export const TOPICS = [...new Set(QUESTIONS.map((q) => q.topic))];

/** Close enough? 2% or 0.05, whichever is bigger. */
export const isRight = (guess: number, truth: number) => Math.abs(guess - truth) <= Math.max(0.05, Math.abs(truth) * 0.02);
