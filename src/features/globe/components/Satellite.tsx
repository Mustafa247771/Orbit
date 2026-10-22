import colors from "@/theme/colors";
import { useTexture } from "@react-three/drei/native";
import { useFrame, type ThreeEvent } from "@react-three/fiber/native";
import { useRef } from "react";
import { SATELLITE_SPRITES } from "./satelliteModels";

import type * as THREE from "three";
import type { SatelliteFamily, Vec3 } from "../viewmodels/useEarthViewModel";

type SatelliteProps = {
  id: number;
  family: SatelliteFamily;
  selected: boolean;
  getPosition: (id: number) => Vec3 | null;
  onSelect: (id: number) => void;
};

export function Satellite({
  id,
  family,
  selected,
  getPosition,
  onSelect,
}: SatelliteProps) {
  const group = useRef<THREE.Group>(null);
  const icon = useTexture(SATELLITE_SPRITES[family] as unknown as string);

  useFrame(() => {
    if (!group.current) return;

    const position = getPosition(id);
    group.current.visible = position !== null;
    if (position)
      group.current.position.set(position.x, position.y, position.z);
  });

  const handleTap = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };

  return (
    <group ref={group}>
      <sprite visible={!selected} scale={[0.06, 0.06, 1]}>
        <spriteMaterial
          map={icon}
          color={colors.accent}
          transparent
          depthWrite={false}
        />
      </sprite>

      <mesh onClick={handleTap}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
