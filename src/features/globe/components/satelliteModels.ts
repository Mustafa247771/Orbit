import genericModel from "@/assets/models/generic.glb";
import issModel from "@/assets/models/iss.glb";
import starlinkModel from "@/assets/models/starlink.glb";

import type { SatelliteFamily } from "../viewmodels/useEarthViewModel";

export const SATELLITE_SPRITES: Record<SatelliteFamily, number> = {
  iss: require("@/assets/sprites/iss.png"),
  starlink: require("@/assets/sprites/starlink.png"),
  generic: require("@/assets/sprites/generic.png"),
};

export const SATELLITE_MODELS: Record<SatelliteFamily, number> = {
  iss: issModel,
  starlink: starlinkModel,
  generic: genericModel,
};
