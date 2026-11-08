import { eciToScene } from "@/core/orbit/frames";
import {
    fromSatelliteElements,
    stateEci,
    type TrackedSatellite,
} from "@/core/orbit/propagate";
import type { Vec3 } from "@/core/orbit/types";
import type { CatalogueObject } from "./CatalogueRepository";

export type SceneState = {
  position: Vec3;
  velocity: Vec3;
};

export class OrbitCatalogue {
  readonly objects: Map<number, CatalogueObject>;
  private orbits = new Map<number, TrackedSatellite>();

  constructor(objects: CatalogueObject[]) {
    this.objects = new Map(objects.map((item) => [item.id, item]));
  }

  get(id: number): TrackedSatellite | null {
    const existing = this.orbits.get(id);
    if (existing) return existing;

    const item = this.objects.get(id);
    if (!item) return null;

    const orbit = fromSatelliteElements(item.elements);
    this.orbits.set(id, orbit);

    return orbit;
  }

  sceneState(id: number, date: Date): SceneState | null {
    const orbit = this.get(id);
    const state = orbit ? stateEci(orbit.satrec, date) : null;

    if (
      !state ||
      ![
        ...Object.values(state.position),
        ...Object.values(state.velocity),
      ].every(Number.isFinite)
    )
      return null;

    return {
      position: eciToScene(state.position),
      velocity: eciToScene(state.velocity),
    };
  }
}
