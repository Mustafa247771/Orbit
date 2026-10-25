import {
  Body,
  GeoVector,
  RotateVector,
  Rotation_EQJ_EQD,
  SiderealTime,
  type Vector,
} from "astronomy-engine";
import { gstime } from "satellite.js";
import { eciAxesToScene } from "./frames";
import type { Vec3 } from "./types";

/** J2000 -> equator of date -> app's GMST-based frame -> Three axes. */
export function equatorialToScene(vector: Vector, date: Date): Vec3 {
  const v = RotateVector(Rotation_EQJ_EQD(date), vector);
  const angle = gstime(date) - (SiderealTime(date) * Math.PI) / 12;
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return eciAxesToScene({
    x: c * v.x - s * v.y,
    y: s * v.x + c * v.y,
    z: v.z,
  });
}

export function sunDirection(date: Date): Vec3 {
  const v = equatorialToScene(GeoVector(Body.Sun, date, true), date);
  const length = Math.hypot(v.x, v.y, v.z);

  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}
