/* eslint-disable react/no-unknown-property */
import { useGLTF } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { DeviceMotion } from "expo-sensors";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import helmetModel from "@/assets/models/astronaut_helmet.glb";
import { quietPixelStorei } from "@/components/three/expoGl";
import colors from "@/theme/colors";

const MODEL_SIZE = 1.6;
const SWAY = 0.35;
const SWAY_SPEED = 0.5;
const TILT_GAIN = { yaw: 0.6, pitch: 0.4 };
const TILT_LIMIT = 0.6;
const EASE = 0.08;

// The model's glass is see-through and shows the empty inside of the helmet,
// so the visor is swapped for dark gold metal that only catches the lights.
const VISOR = new THREE.MeshStandardMaterial({
  color: colors.gold,
  metalness: 1,
  roughness: 0.25,
});

type Tilt = { yaw: number; pitch: number };

type HelmetAvatarProps = {
  size: number;
  still: boolean;
  onReady: () => void;
};

export function HelmetAvatar({ size, still, onReady }: HelmetAvatarProps) {
  return (
    <Canvas
      style={{ width: size, height: size }}
      camera={{ position: [0, 0.1, 3.2], fov: 35 }}
      onCreated={quietPixelStorei}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2.4} />
      <directionalLight
        position={[-3, 1, -2]}
        intensity={1.2}
        color={colors.cyan}
      />
      <Suspense fallback={null}>
        <Helmet still={still} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

function Helmet({ still, onReady }: Omit<HelmetAvatarProps, "size">) {
  const { scene } = useGLTF(helmetModel as unknown as string, false, false);
  const model = useMemo(() => prepareHelmet(scene), [scene]);
  const holder = useRef<THREE.Group>(null);
  const tilt = useRef<Tilt>({ yaw: 0, pitch: 0 });

  useEffect(() => {
    onReady();
  }, [onReady]);

  // Tilting the phone turns the helmet, measured from how it was held at first.
  useEffect(() => {
    if (still) return;
    let rest: Tilt | null = null;
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      rest ??= { yaw: rotation.gamma, pitch: rotation.beta };
      tilt.current = {
        yaw: clamp(rotation.gamma - rest.yaw) * TILT_GAIN.yaw,
        pitch: clamp(rotation.beta - rest.pitch) * TILT_GAIN.pitch,
      };
    });
    return () => subscription.remove();
  }, [still]);

  useFrame(({ clock }) => {
    const object = holder.current;
    if (!object) return;
    const sway = still
      ? 0
      : Math.sin(clock.getElapsedTime() * SWAY_SPEED) * SWAY;
    const target = still ? { yaw: 0, pitch: 0 } : tilt.current;
    object.rotation.y += (sway + target.yaw - object.rotation.y) * EASE;
    object.rotation.x += (target.pitch - object.rotation.x) * EASE;
  });

  return (
    <group ref={holder}>
      <primitive object={model} />
    </group>
  );
}

const clamp = (value: number) =>
  Math.max(-TILT_LIMIT, Math.min(TILT_LIMIT, value));

function prepareHelmet(scene: THREE.Group) {
  const inner = new THREE.Group();
  inner.add(scene.clone(true));

  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = MODEL_SIZE / Math.max(size.x, size.y, size.z);
  inner.scale.setScalar(scale);
  inner.position.copy(center).multiplyScalar(-scale);

  inner.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.Material &&
      child.material.name === "helmet_glass"
    ) {
      child.material = VISOR;
    }
  });

  return inner;
}
