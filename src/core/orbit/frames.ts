import { gstime } from "satellite.js";
import type { Vec3 } from "./types";

export const EARTH_RADIUS_KM = 6371;

export function eciAxesToScene({ x, y, z }: Vec3): Vec3 {
  return { x, y: z, z: -y };
}

export function eciToScene(positionKm: Vec3): Vec3 {
  const { x, y, z } = eciAxesToScene(positionKm);
  return {
    x: x / EARTH_RADIUS_KM,
    y: y / EARTH_RADIUS_KM,
    z: z / EARTH_RADIUS_KM,
  };
}

export function earthRotation(date: Date): number {
  return gstime(date);
}
