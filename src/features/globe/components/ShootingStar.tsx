import { useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const DISTANCE = 30;
const LENGTH = 4;
const WIDTH = 0.06;
const SPEED = 22;
const LIFE = 0.9;
const GAP = { min: 3, max: 9 };

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// uv.x runs tail (0) to head (1), uv.y across the streak.
const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float tail = vUv.x * vUv.x;
    float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
    gl_FragColor = vec4(0.85, 0.95, 1.0, tail * edge * uOpacity);
  }
`;

const right = new THREE.Vector3();
const up = new THREE.Vector3();
const spin = new THREE.Quaternion();
const VIEW_AXIS = new THREE.Vector3(0, 0, 1);

function createStreak() {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  streak.scale.set(LENGTH, WIDTH, 1);
  streak.visible = false;
  streak.renderOrder = -1;
  return streak;
}

type ShootingStarProps = {
  firstDelay: number;
};

/** Every few seconds, streaks across whatever part of the sky the camera is looking at. */
export function ShootingStar({ firstDelay }: ShootingStarProps) {
  const mesh = useMemo(() => createStreak(), []);
  const streak = useRef<ReturnType<typeof createStreak>>(null);
  const startsAt = useRef(firstDelay);
  const origin = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    },
    [mesh],
  );

  useFrame(({ camera, clock }) => {
    const star = streak.current;
    if (!star) return;
    const now = clock.getElapsedTime();
    const age = now - startsAt.current;
    if (age < 0) return;

    if (!star.visible) {
      // Start near the top of the view, heading down to one side.
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camera
        .getWorldDirection(origin.current)
        .multiplyScalar(DISTANCE)
        .addScaledVector(right, (Math.random() - 0.5) * 0.3 * DISTANCE)
        .addScaledVector(up, (0.1 + Math.random() * 0.3) * DISTANCE)
        .add(camera.position);

      const tilt = 0.3 + Math.random() * 0.5;
      const angle = Math.random() < 0.5 ? -tilt : Math.PI + tilt;
      velocity.current
        .copy(right)
        .multiplyScalar(Math.cos(angle) * SPEED)
        .addScaledVector(up, Math.sin(angle) * SPEED);
      star.quaternion
        .copy(camera.quaternion)
        .multiply(spin.setFromAxisAngle(VIEW_AXIS, angle));
      star.visible = true;
    }

    if (age > LIFE) {
      star.visible = false;
      startsAt.current = now + GAP.min + Math.random() * (GAP.max - GAP.min);
      return;
    }

    star.position.copy(origin.current).addScaledVector(velocity.current, age);
    star.material.uniforms.uOpacity.value = Math.sin((Math.PI * age) / LIFE);
  });

  return <primitive ref={streak} object={mesh} />;
}
