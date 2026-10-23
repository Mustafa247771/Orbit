/* eslint-disable react/no-unknown-property */
import { quietPixelStorei } from "@/components/three/expoGl";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { MutableRefObject, useMemo, useRef } from "react";
import { Points, ShaderMaterial } from "three";

export type StarPointer = {
  active: boolean;
  x: number;
  y: number;
};

type InteractiveStarFieldProps = {
  pointer: MutableRefObject<StarPointer>;
};

const STAR_COUNT = 1650;

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aGlint;
  attribute float aInfluence;
  attribute vec3 color;
  uniform float uTime;
  varying vec3 vColor;
  varying float vGlint;
  varying float vSparkle;
  varying float vInfluence;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float flicker = 0.66 + 0.34 * sin(uTime * (1.85 + aPhase * 0.16) + aPhase);
    vColor = color;
    vGlint = aGlint;
    vSparkle = flicker;
    vInfluence = aInfluence;
    gl_PointSize = aSize * (0.88 + flicker * 0.42) * (1.0 + aInfluence * 0.9);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vGlint;
  varying float vSparkle;
  varying float vInfluence;

  void main() {
    vec2 point = (gl_PointCoord - 0.5) * 2.0;
    float distanceFromCenter = length(point);
    float dotStar = 1.0 - smoothstep(0.28, 0.64, distanceFromCenter);
    float horizontal = (1.0 - smoothstep(0.05, 0.22, abs(point.y)))
      * (1.0 - smoothstep(0.15, 1.0, abs(point.x)));
    float vertical = (1.0 - smoothstep(0.05, 0.22, abs(point.x)))
      * (1.0 - smoothstep(0.15, 1.0, abs(point.y)));
    float glintCore = 1.0 - smoothstep(0.0, 0.34, distanceFromCenter);
    float glintStar = max(glintCore, max(horizontal, vertical) * 0.9);
    float softHalo = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
    float starShape = mix(dotStar, glintStar, vGlint);
    float haloStrength = mix(0.2, 0.46, vGlint) + vInfluence * 0.48;
    float alpha = max(starShape, softHalo * haloStrength)
      * (0.9 + vSparkle * 0.62)
      * (1.0 + vInfluence * 1.25);
    if (alpha < 0.025) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function Stars({ pointer }: InteractiveStarFieldProps) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();

  const stars = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const bases = new Float32Array(STAR_COUNT * 2);
    const phases = new Float32Array(STAR_COUNT);
    const sizes = new Float32Array(STAR_COUNT);
    const glints = new Float32Array(STAR_COUNT);
    const influences = new Float32Array(STAR_COUNT);
    const speeds = new Float32Array(STAR_COUNT);

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const positionOffset = index * 3;
      const baseOffset = index * 2;
      const isGlint = seededValue(index, 5) > 0.9;
      bases[baseOffset] = seededValue(index, 1) - 0.5;
      bases[baseOffset + 1] = seededValue(index, 2) - 0.5;
      phases[index] = seededValue(index, 3) * Math.PI * 2;
      sizes[index] = isGlint
        ? 10 + seededValue(index, 6) * 10
        : 1.8 + seededValue(index, 6) * 3.1;
      glints[index] = isGlint ? 1 : 0;
      speeds[index] = 0.002 + seededValue(index, 7) * 0.004;
      positions[positionOffset] = bases[baseOffset] * viewport.width;
      positions[positionOffset + 1] = bases[baseOffset + 1] * viewport.height;
      positions[positionOffset + 2] = -seededValue(index, 4) * 0.4;
      colors[positionOffset] = 1;
      colors[positionOffset + 1] = 1;
      colors[positionOffset + 2] = 1;
    }

    return {
      bases,
      colors,
      glints,
      influences,
      phases,
      positions,
      sizes,
      speeds,
    };
  }, [viewport.height, viewport.width]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }, delta) => {
    if (!points.current || !material.current) return;
    const positionAttribute = points.current.geometry.attributes.position;
    const colorAttribute = points.current.geometry.attributes.color;
    const influenceAttribute = points.current.geometry.attributes.aInfluence;
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Float32Array;
    const influences = influenceAttribute.array as Float32Array;
    const pointerX = (pointer.current.x - 0.5) * viewport.width;
    const pointerY = (0.5 - pointer.current.y) * viewport.height;
    const influenceRadius = Math.min(viewport.width, viewport.height) * 0.27;
    const elapsed = clock.getElapsedTime();
    const easing = Math.min(1, delta * 9);
    material.current.uniforms.uTime.value = elapsed;

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const positionOffset = index * 3;
      const baseOffset = index * 2;
      const baseX = stars.bases[baseOffset] * viewport.width;
      const wrappedY =
        ((stars.bases[baseOffset + 1] - elapsed * stars.speeds[index] + 0.5) %
          1) -
        0.5;
      const baseY = wrappedY * viewport.height;
      const dx = pointerX - baseX;
      const dy = pointerY - baseY;
      const distance = Math.hypot(dx, dy);
      const influence = pointer.current.active
        ? Math.max(0, 1 - distance / influenceRadius) ** 2
        : 0;
      const targetX = baseX + dx * influence * 0.72;
      const targetY = baseY + dy * influence * 0.72;
      positions[positionOffset] +=
        (targetX - positions[positionOffset]) * easing;
      positions[positionOffset + 1] +=
        (targetY - positions[positionOffset + 1]) * easing;
      colors[positionOffset] = 1 - influence * 0.98;
      colors[positionOffset + 1] = 1 - influence * 0.72;
      colors[positionOffset + 2] = 1;
      influences[index] = influence;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    influenceAttribute.needsUpdate = true;
  });

  return (
    <points frustumCulled={false} ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[stars.sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[stars.phases, 1]} />
        <bufferAttribute attach="attributes-aGlint" args={[stars.glints, 1]} />
        <bufferAttribute
          attach="attributes-aInfluence"
          args={[stars.influences, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        blending={2}
        depthTest={false}
        depthWrite={false}
        fragmentShader={fragmentShader}
        ref={material}
        transparent
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </points>
  );
}

export function InteractiveStarField({ pointer }: InteractiveStarFieldProps) {
  return (
    <Canvas
      camera={{ far: 20, fov: 45, near: 0.01, position: [0, 0, 5] }}
      gl={{ alpha: false, antialias: false }}
      onCreated={(state) => {
        quietPixelStorei(state);
        state.gl.setClearColor("#000000", 1);
      }}
    >
      <Stars pointer={pointer} />
    </Canvas>
  );
}
