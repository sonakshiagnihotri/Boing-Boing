import type { SceneDef } from "../engine/types";
import { projectile } from "./projectile";
import { incline } from "./incline";
import { pulley } from "./pulley";
import { bowl } from "./bowl";
import { rainman } from "./rainman";
import { monkey } from "./monkey";

export const scenes: SceneDef[] = [projectile, incline, pulley, bowl, rainman, monkey];
export const sceneById = (id: string) => scenes.find((s) => s.id === id)!;
