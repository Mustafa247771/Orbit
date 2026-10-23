/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { View, type GestureResponderEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import * as THREE from "three";

import { quietPixelStorei } from "@/components/three/expoGl";
import colors from "@/theme/colors";
import type { BadgeTier } from "../model/Achievement";

const HEIGHT = 220;
const IDLE_SPEED = 0.6;
const DRAG_PER_PIXEL = 0.012;
const FLING = 8;
const SETTLE = 0.04;

const TIER_COLORS: Record<BadgeTier, string> = {
  gold: colors.gold,
  silver: colors.ink,
};

type Spin = {
  dragging: boolean;
  pending: number;
  velocity: number;
  lastX: number;
  lastTime: number;
  speed: number;
};

type MedalCanvasProps = {
  tier: BadgeTier;
  locked: boolean;
};

/** A metal medal you can spin with a finger; it keeps turning slowly on its own. */
export function MedalCanvas({ tier, locked }: MedalCanvasProps) {
  const reduceMotion = useReducedMotion();
  const spinRef = useRef<Spin>({
    dragging: false,
    pending: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    speed: 0,
  });

  const grab = ({ nativeEvent }: GestureResponderEvent) => {
    const spin = spinRef.current;
    spin.dragging = true;
    spin.lastX = nativeEvent.pageX;
    spin.lastTime = nativeEvent.timestamp;
    spin.speed = 0;
  };
  const drag = ({ nativeEvent }: GestureResponderEvent) => {
    const spin = spinRef.current;
    const dx = nativeEvent.pageX - spin.lastX;
    spin.pending += dx * DRAG_PER_PIXEL;
    spin.speed = dx / Math.max(1, nativeEvent.timestamp - spin.lastTime);
    spin.lastX = nativeEvent.pageX;
    spin.lastTime = nativeEvent.timestamp;
  };
  // Letting go keeps the spin going in the direction of the swipe.
  const release = () => {
    const spin = spinRef.current;
    spin.dragging = false;
    spin.velocity = spin.speed * FLING;
  };

  return (
    <View
      onTouchStart={grab}
      onTouchMove={drag}
      onTouchEnd={release}
      onTouchCancel={release}
      accessibilityRole="image"
      accessibilityLabel="3D medal. Drag to spin it."
      style={{ height: HEIGHT }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 35 }}
        onCreated={quietPixelStorei}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={2.6} />
        <directionalLight
          position={[-3, -1, 2]}
          intensity={1}
          color={colors.cyan}
        />
        <Medal
          color={locked ? colors.muted : TIER_COLORS[tier]}
          idleSpeed={reduceMotion ? 0 : IDLE_SPEED}
          spinRef={spinRef}
        />
      </Canvas>
    </View>
  );
}

type MedalProps = {
  color: string;
  idleSpeed: number;
  spinRef: RefObject<Spin>;
};

function Medal({ color, idleSpeed, spinRef }: MedalProps) {
  const holder = useRef<THREE.Group>(null);
  const medal = useMemo(() => buildMedal(color), [color]);

  useEffect(() => () => medal.dispose(), [medal]);

  useFrame((_, delta) => {
    const object = holder.current;
    if (!object) return;
    const spin = spinRef.current;
    if (!spin.dragging) {
      spin.velocity += (idleSpeed - spin.velocity) * SETTLE;
      object.rotation.y += spin.velocity * delta;
    }
    object.rotation.y += spin.pending;
    spin.pending = 0;
  });

  return (
    <group ref={holder}>
      <primitive object={medal.group} />
    </group>
  );
}

// Built from plain shapes until a medal model is added: a disc, a rim and a raised star on each face.
function buildMedal(color: string) {
  const metal = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.85,
    roughness: 0.3,
  });
  const face = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.7,
    roughness: 0.45,
  });
  const disc = new THREE.CylinderGeometry(1, 1, 0.14, 64);
  const rim = new THREE.TorusGeometry(1, 0.08, 16, 64);
  const star = new THREE.ExtrudeGeometry(starShape(0.55, 0.24), {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });

  const discMesh = new THREE.Mesh(disc, face);
  discMesh.rotation.x = Math.PI / 2;
  const frontStar = new THREE.Mesh(star, metal);
  frontStar.position.z = 0.07;
  const backStar = new THREE.Mesh(star, metal);
  backStar.position.z = -0.07;
  backStar.rotation.y = Math.PI;

  const group = new THREE.Group();
  group.add(discMesh, new THREE.Mesh(rim, metal), frontStar, backStar);

  return {
    group,
    dispose: () => {
      disc.dispose();
      rim.dispose();
      star.dispose();
      metal.dispose();
      face.dispose();
    },
  };
}

function starShape(outer: number, inner: number) {
  const shape = new THREE.Shape();
  for (let point = 0; point < 10; point++) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = Math.PI / 2 + (point * Math.PI) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
