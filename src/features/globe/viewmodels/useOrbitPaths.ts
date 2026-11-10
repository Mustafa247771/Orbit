import { eciToScene } from "@/core/orbit/frames";
import { orbitPathEci } from "@/core/orbit/propagate";
import type { Vec3 } from "@/core/orbit/types";
import type { CatalogueMode } from "@/core/satellites/catalogueFilters";
import type { CatalogueObject } from "@/core/satellites/catalogueTypes";
import type { OrbitCatalogue } from "@/core/satellites/OrbitCatalogue";
import { useEffect, useMemo, useState } from "react";

const PATH_REFRESH_MS = 10 * 60 * 1000;
const PATH_STEPS = 180;

export function useOrbitPaths(
  catalogue: OrbitCatalogue,
  visibleObjects: CatalogueObject[],
  mode: CatalogueMode | null,
  selectedId: number | null,
) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setTick((value) => value + 1),
      PATH_REFRESH_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const start = new Date();
    const paths: Record<number, Vec3[]> = {};
    const ids = new Set<number>();
    if (mode === "bright" || mode === "tracked") {
      visibleObjects.forEach((item) => ids.add(item.id));
    }
    if (selectedId !== null) ids.add(selectedId);

    for (const id of ids) {
      const satellite = catalogue.get(id);
      if (satellite)
        paths[id] = orbitPathEci(satellite, start, PATH_STEPS).map(eciToScene);
    }
    return paths;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- The tick rebuilds paths as time advances.
  }, [catalogue, visibleObjects, mode, selectedId, tick]);
}
