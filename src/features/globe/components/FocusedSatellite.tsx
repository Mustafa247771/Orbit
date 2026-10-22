import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { SatelliteFamily, Vec3 } from "../viewmodels/useEarthViewModel";
import { SATELLITE_MODELS } from "./satelliteModels";

const MODEL_SIZE = 0.05;
const MAX_METALNESS = 0.4;
const SUN_INTENSITY = 2.5;
const SHADOW_INTENSITY = 0.05;

const ahead = new THREE.Vector3();

type FocusedSatelliteProps = {
  id: number;
  family: SatelliteFamily;
  getPosition: (id: number) => Vec3 | null;
  getVelocity: (id: number) => Vec3 | null;
  getSunDirection: () => Vec3;
};

export function FocusedSatellite({
  id,
  family,
  getPosition,
  getVelocity,
  getSunDirection,
}: FocusedSatelliteProps) {
  const file = SATELLITE_MODELS[family] as unknown as string;
  const { scene } = useGLTF(file, false, false);
  const model = useMemo(() => prepareModel(scene), [scene]);

  const holder = useRef<THREE.Group>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const object = holder.current;
    const light = sun.current;
    if (!object || !light) return;

    const position = getPosition(id);
    object.visible = position !== null;
    if (!position) return;

    object.position.set(position.x, position.y, position.z);

    object.up.set(position.x, position.y, position.z).normalize();
    const velocity = getVelocity(id);
    if (velocity) {
      ahead
        .set(velocity.x, velocity.y, velocity.z)
        .normalize()
        .add(object.position);
      object.lookAt(ahead);
    }

    const s = getSunDirection();
    light.position.set(s.x, s.y, s.z).multiplyScalar(10);

    const along = position.x * s.x + position.y * s.y + position.z * s.z;
    const fromSunLine =
      position.x ** 2 + position.y ** 2 + position.z ** 2 - along ** 2;
    light.intensity =
      along < 0 && fromSunLine < 1 ? SHADOW_INTENSITY : SUN_INTENSITY;
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight ref={sun} intensity={SUN_INTENSITY} />
      <group ref={holder}>
        <primitive object={model} />
      </group>
    </>
  );
}

function prepareModel(scene: THREE.Group) {
  const inner = new THREE.Group();
  inner.add(scene.clone(true));

  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = MODEL_SIZE / Math.max(size.x, size.y, size.z);
  inner.scale.setScalar(scale);
  inner.position.copy(center).multiplyScalar(-scale);

  inner.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.metalness = Math.min(material.metalness, MAX_METALNESS);
      }
    }
  });

  return inner;
}
