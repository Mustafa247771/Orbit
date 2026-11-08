import * as THREE from "three";

import {
  gatewayFragmentShader,
  gatewayParticleFragmentShader,
  gatewayParticleVertexShader,
  gatewayVertexShader,
} from "./gatewayShaders";

export type GatewayPointer = {
  x: number;
  y: number;
  dragging: boolean;
  pulse: number;
};

const PARTICLE_COUNT = 1800;

export function createGatewayScene() {
  const root = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uCenter: { value: new THREE.Vector2(0.5, 0.59) },
    uPointer: { value: new THREE.Vector2() },
    uPixelRatio: { value: 1 },
    uPulseAge: { value: 2 },
    uInteraction: { value: 0 },
  };

  const backgroundGeometry = new THREE.PlaneGeometry(2, 2);
  const backgroundMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: gatewayVertexShader,
    fragmentShader: gatewayFragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  background.frustumCulled = false;
  background.renderOrder = -1;
  root.add(background);

  // Store angle, radial phase and depth; animate each particle on the GPU.
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const brightness = new Float32Array(PARTICLE_COUNT);
  const random = (seed: number) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  for (let index = 0; index < PARTICLE_COUNT; index++) {
    positions.set(
      [
        random(index * 5) * Math.PI * 2,
        random(index * 5 + 1),
        random(index * 5 + 2),
      ],
      index * 3,
    );
    const prominent = random(index * 5 + 3) > 0.96;
    sizes[index] = prominent ? 5 + random(index) * 4 : 1 + random(index) * 2.3;
    brightness[index] = prominent ? 0.9 : 0.2 + random(index * 5 + 4) * 0.55;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  particleGeometry.setAttribute(
    "aBrightness",
    new THREE.BufferAttribute(brightness, 1),
  );
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: gatewayParticleVertexShader,
    fragmentShader: gatewayParticleFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  root.add(particles);

  return {
    root,
    uniforms,
    time: 0,
    lastPulse: 0,
    pulseAge: 2,
    dispose() {
      backgroundGeometry.dispose();
      backgroundMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    },
  };
}

export type GatewayScene = ReturnType<typeof createGatewayScene>;

export function resizeGatewayScene(
  scene: GatewayScene,
  width: number,
  height: number,
  pixelRatio: number,
) {
  scene.uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height));
  scene.uniforms.uPixelRatio.value = Math.max(1, pixelRatio);
}

export function advanceGatewayScene(
  scene: GatewayScene,
  pointer: GatewayPointer,
  delta: number,
  still: boolean,
) {
  const step = Math.min(Math.max(delta, 0), 0.05);
  if (!still) scene.time += step;

  const ease = still ? 1 : 1 - Math.exp(-step * 6);
  const targetX = pointer.dragging ? pointer.x : 0;
  const targetY = pointer.dragging ? -pointer.y : 0;
  const offset = scene.uniforms.uPointer.value;
  offset.x += (targetX - offset.x) * ease;
  offset.y += (targetY - offset.y) * ease;
  scene.uniforms.uCenter.value.set(
    0.5 + offset.x * 0.08,
    0.59 + offset.y * 0.05,
  );
  scene.uniforms.uInteraction.value +=
    ((pointer.dragging ? 1 : 0) - scene.uniforms.uInteraction.value) * ease;

  if (pointer.pulse !== scene.lastPulse) {
    scene.lastPulse = pointer.pulse;
    scene.pulseAge = 0;
  }
  scene.pulseAge = still ? 2 : Math.min(2, scene.pulseAge + step);
  scene.uniforms.uTime.value = scene.time;
  scene.uniforms.uPulseAge.value = scene.pulseAge;
}
