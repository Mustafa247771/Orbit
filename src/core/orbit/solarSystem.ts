import {
    Body,
    GeoVector,
    HelioVector,
    RotationAxis,
    Vector,
} from "astronomy-engine";
import { equatorialToScene, sunDirection } from "./sun";

export const SKY_BODIES = [
  Body.Sun,
  Body.Mercury,
  Body.Venus,
  Body.Mars,
  Body.Jupiter,
  Body.Saturn,
  Body.Uranus,
  Body.Neptune,
] as const;

export type SkyBody = (typeof SKY_BODIES)[number];

/** Physical directions and rotation; display sizes belong to the renderer. */
export function solarBodyState(body: SkyBody, date: Date) {
  const geo = GeoVector(body, date, true);
  const distanceAu = geo.Length();
  const direction = equatorialToScene(geo, date);

  direction.x /= distanceAu;
  direction.y /= distanceAu;
  direction.z /= distanceAu;

  // Orient the body at the time its visible light left it.
  const emitted = geo.t.AddDays(-distanceAu / 173.1446326846693);
  const axis = RotationAxis(body, emitted);
  const ra = (axis.ra * Math.PI) / 12;
  const node = new Vector(-Math.sin(ra), Math.cos(ra), 0, emitted);

  const helio = HelioVector(body, emitted);
  const toSun = equatorialToScene(helio, date);
  const length = Math.hypot(toSun.x, toSun.y, toSun.z) || 1;

  toSun.x /= -length;
  toSun.y /= -length;
  toSun.z /= -length;

  return {
    direction: body === Body.Sun ? sunDirection(date) : direction,
    distanceAu,
    north: equatorialToScene(axis.north, date),
    node: equatorialToScene(node, date),
    spin: ((axis.spin % 360) * Math.PI) / 180,
    toSun,
  };
}
