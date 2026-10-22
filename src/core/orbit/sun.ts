import { jday, sunPos } from "satellite.js";

import { eciAxesToScene } from "./frames";
import type { Vec3 } from "./types";

export function sunDirection(date: Date): Vec3 {
  const [x, y, z] = sunPos(jday(date)).rsun;
  const length = Math.hypot(x, y, z);
  return eciAxesToScene({ x: x / length, y: y / length, z: z / length });
}
