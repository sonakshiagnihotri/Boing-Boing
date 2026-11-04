import type { SceneDef } from "../engine/types";
import { projectile } from "./projectile";
import { incline } from "./incline";
import { pulley } from "./pulley";

/** Add new scenes here (rain-man goes next). */
export const scenes: SceneDef[] = [projectile, incline, pulley];
