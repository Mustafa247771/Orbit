import { useEffect, useMemo } from "react";
import * as THREE from "three";

import type { Vec3 } from "../viewmodels/useEarthViewModel";

type OrbitPathProps = {
  points: Vec3[];
  color?: string;
  opacity?: number;
};

export function OrbitPath({
  points,
  color = "#7CFFB2",
  opacity = 0.25,
}: OrbitPathProps) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(({ x, y, z }) => new THREE.Vector3(x, y, z)),
    );

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
    return new THREE.LineLoop(geometry, material);
  }, [points, color, opacity]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  return <primitive object={line} />;
}
