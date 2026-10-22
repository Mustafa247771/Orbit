import { useTexture } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import { createEarthMaterial } from "./earthMaterial";

import type * as THREE from "three";
import type { Vec3 } from "../viewmodels/useEarthViewModel";

const MAPS = {
  day: require("@/assets/textures/earth_day.jpg"),
  night: require("@/assets/textures/earth_night.jpg"),
  clouds: require("@/assets/textures/earth_specular_clouds.jpg"),
};

type EarthProps = {
  getSunDirection: () => Vec3;
  getEarthRotation: () => number;
};

export function Earth({ getSunDirection, getEarthRotation }: EarthProps) {
  const { day, night, clouds } = useTexture(MAPS);

  const earth = useMemo(
    () => createEarthMaterial({ day, night, clouds }),
    [day, night, clouds],
  );

  useEffect(() => () => earth.material.dispose(), [earth]);

  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = getEarthRotation();
    const sun = getSunDirection();
    earth.sunDirection.value.set(sun.x, sun.y, sun.z);
  });

  return (
    <group ref={group}>
      <mesh material={earth.material}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </group>
  );
}
