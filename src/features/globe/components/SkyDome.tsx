import { useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const STAR_COUNT = 100000;
const SKY_RADIUS = 40;

// A share of the stars sits in a thin tilted band, a hint of the Milky Way.
const BAND_SHARE = 0.35;
const BAND_TILT = new THREE.Euler(1.1, 0, 0.5);
const TINTS = [
  [1, 1, 1],
  [0.82, 0.89, 1],
  [1, 0.89, 0.74],
];

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 0.7 + 0.3 * sin(uTime * (1.2 + aPhase) + aPhase * 6.2831);
    gl_PointSize = aSize * (0.85 + vTwinkle * 0.3);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.5, d);
    float halo = (1.0 - smoothstep(0.0, 1.0, d)) * 0.35;
    float alpha = (core + halo) * vTwinkle;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createSky() {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const phases = new Float32Array(STAR_COUNT);
  const star = new THREE.Vector3();

  for (let i = 0; i < STAR_COUNT; i += 1) {
    const angle = seeded(i, 1) * Math.PI * 2;
    if (seeded(i, 2) < BAND_SHARE) {
      const spread = (seeded(i, 3) + seeded(i, 4) - 1) * 0.18;
      star
        .set(Math.cos(angle), spread, Math.sin(angle))
        .normalize()
        .applyEuler(BAND_TILT);
    } else {
      const y = seeded(i, 3) * 2 - 1;
      const ring = Math.sqrt(1 - y * y);
      star.set(ring * Math.cos(angle), y, ring * Math.sin(angle));
    }
    star.multiplyScalar(SKY_RADIUS).toArray(positions, i * 3);

    const tint = seeded(i, 5);
    colors.set(TINTS[tint < 0.12 ? 2 : tint < 0.3 ? 1 : 0], i * 3);

    const bright = seeded(i, 6) > 0.96;
    sizes[i] = bright ? 6 + seeded(i, 7) * 5 : 1.6 + seeded(i, 7) * 2.6;
    phases[i] = seeded(i, 8);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sky = new THREE.Points(geometry, material);
  sky.renderOrder = -1; // draw before everything else that is see-through
  return sky;
}

/** Fixed stars around the whole scene. Like real stars they don't turn with the Earth. */
export function SkyDome() {
  const sky = useMemo(() => createSky(), []);
  const points = useRef<ReturnType<typeof createSky>>(null);

  useEffect(
    () => () => {
      sky.geometry.dispose();
      sky.material.dispose();
    },
    [sky],
  );

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return <primitive ref={points} object={sky} />;
}
