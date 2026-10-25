import { useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Vec3 } from "../viewmodels/useEarthViewModel";

// Not to scale: the real Moon is 60 Earth radii away.
const ORBIT_RADIUS = 2.4;
const MOON_RADIUS = 0.2;
const ORBIT_SECONDS = 90;
const ORBIT_TILT = 0.35;
const TILT_AXIS = new THREE.Vector3(1, 0, 0);

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vSurface;

  void main() {
    vSurface = position;
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  varying vec3 vNormal;
  varying vec3 vSurface;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  // Smooth 3D noise, so the dark lunar seas get soft edges.
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec2 e = vec2(1.0, 0.0);
    return mix(
      mix(mix(hash(i), hash(i + e.xyy), f.x), mix(hash(i + e.yxy), hash(i + e.xxy), f.x), f.y),
      mix(mix(hash(i + e.yyx), hash(i + e.xyx), f.x), mix(hash(i + e.yxx), hash(i + e.xxx), f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 p = normalize(vSurface) * 2.5;
    float seas = noise(p) * 0.65 + noise(p * 3.0) * 0.25 + noise(p * 9.0) * 0.1;
    vec3 rock = mix(vec3(0.36, 0.36, 0.38), vec3(0.8, 0.79, 0.76), smoothstep(0.38, 0.62, seas));
    float light = smoothstep(-0.05, 0.25, dot(normalize(vNormal), uSunDirection));
    gl_FragColor = vec4(rock * (0.03 + light), 1.0);
  }
`;

type MoonProps = {
  getSunDirection: () => Vec3;
};

/** A small moon circling the globe, lit by the real Sun, so its phase changes as it goes round. */
export function Moon({ getSunDirection }: MoonProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uSunDirection: { value: new THREE.Vector3(1, 0, 0) } },
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  const moon = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!moon.current) return;
    const angle = (clock.getElapsedTime() / ORBIT_SECONDS) * Math.PI * 2;
    moon.current.position
      .set(Math.cos(angle), 0, -Math.sin(angle))
      .multiplyScalar(ORBIT_RADIUS)
      .applyAxisAngle(TILT_AXIS, ORBIT_TILT);
    // Like the real Moon, always shows the same face to the Earth.
    moon.current.rotation.y = angle;

    const sun = getSunDirection();
    material.uniforms.uSunDirection.value.set(sun.x, sun.y, sun.z);
  });

  return (
    <mesh ref={moon} material={material}>
      <sphereGeometry args={[MOON_RADIUS, 32, 32]} />
    </mesh>
  );
}
