import {
    SKY_BODIES,
    solarBodyState,
    type SkyBody,
} from "@/core/orbit/solarSystem";
import { useTexture } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const MAPS: Record<SkyBody, number> = {
  Sun: require("@/assets/textures/sun.jpg"),
  Mercury: require("@/assets/textures/mercury.jpg"),
  Venus: require("@/assets/textures/venus.jpg"),
  Mars: require("@/assets/textures/mars.jpg"),
  Jupiter: require("@/assets/textures/jupiter.jpg"),
  Saturn: require("@/assets/textures/saturn.jpg"),
  Uranus: require("@/assets/textures/uranus.jpg"),
  Neptune: require("@/assets/textures/neptune.jpg"),
};

// Angular display radii in radians. Enlarged, not physical scale.
const SIZE: Record<SkyBody, number> = {
  Sun: 0.022,
  Mercury: 0.007,
  Venus: 0.01,
  Mars: 0.008,
  Jupiter: 0.016,
  Saturn: 0.013,
  Uranus: 0.01,
  Neptune: 0.01,
};

// Optional cosmetic animation. False uses calculated axial rotation.
const PREVIEW_SPIN = false;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vLocal;

  void main() {
    vUv = uv;
    vLocal = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSunDirection;
  uniform float uEmissive;
  uniform float uRing;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vLocal;

  void main() {
    float facing = dot(normalize(vNormal), uSunDirection);
    vec3 color = texture2D(uMap, vUv).rgb;
    float light = 0.025 + 0.975 * max(facing, 0.0);

    if (uRing > 0.5) {
      float r = length(vLocal.xz);
      if (r > 1.93 && r < 2.02) discard;

      float bands = 0.5 + 0.5 * sin(r * 160.0);
      color = mix(
        vec3(0.35, 0.29, 0.20),
        vec3(0.78, 0.71, 0.55),
        bands
      );
      light = 0.2 + 0.8 * abs(facing);
    }

    gl_FragColor = vec4(color * mix(light, 1.0, uEmissive), 1.0);
  }
`;

function buildBody(body: SkyBody, texture: THREE.Texture) {
  const group = new THREE.Group();

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uMap: { value: texture },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uEmissive: { value: body === "Sun" ? 1 : 0 },
      uRing: { value: 0 },
    },
  });

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), material);
  group.add(sphere);

  if (body === "Saturn") {
    const ringMaterial = material.clone();
    ringMaterial.uniforms.uRing.value = 1;
    ringMaterial.side = THREE.DoubleSide;

    const geometry = new THREE.RingGeometry(1.25, 2.3, 96);
    geometry.rotateX(-Math.PI / 2);

    sphere.add(new THREE.Mesh(geometry, ringMaterial));
  }

  if (body === "Sun") {
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: `
          varying vec2 vUv;

          void main() {
            float r = length(vUv - 0.5) * 2.0;
            float glow = pow(max(0.0, 1.0 - r), 3.0);
            gl_FragColor = vec4(1.0, 0.58, 0.16, glow * 0.65);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    group.add(halo);
  }

  return group;
}

type Props = {
  getDate: () => Date;
};

function SkyPlanet({ body, getDate }: Props & { body: SkyBody }) {
  const texture = useTexture(MAPS[body] as unknown as string);
  const model = useMemo(() => buildBody(body, texture), [body, texture]);

  const root = useRef<THREE.Group>(null);
  const cached = useRef<ReturnType<typeof solarBodyState> | null>(null);
  const sampledAt = useRef(-Infinity);

  const x = useRef(new THREE.Vector3());
  const y = useRef(new THREE.Vector3());
  const z = useRef(new THREE.Vector3());
  const basis = useRef(new THREE.Matrix4());

  useEffect(
    () => () => {
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });

      // useTexture owns the shared texture; don't dispose it here.
    },
    [model],
  );

  useFrame(({ camera, clock }) => {
    const group = root.current;
    if (!group) return;

    const date = getDate();

    if (
      !cached.current ||
      Math.abs(date.getTime() - sampledAt.current) >= 1000
    ) {
      cached.current = solarBodyState(body, date);
      sampledAt.current = date.getTime();
    }

    const state = cached.current;

    // Compress distances, preserving their ordering between bodies.
    const distance = 70 + 20 * Math.log1p(state.distanceAu);
    const d = state.direction;

    group.position
      .set(d.x, d.y, d.z)
      .multiplyScalar(distance)
      .add(camera.position);

    group.scale.setScalar(distance * Math.tan(SIZE[body]));

    const north = state.north;
    const node = state.node;
    y.current.set(north.x, north.y, north.z).normalize();

    let spin = state.spin;
    if (PREVIEW_SPIN) {
      const sign = body === "Venus" || body === "Uranus" ? -1 : 1;
      spin += sign * clock.getElapsedTime() * 0.08;
    }

    x.current
      .set(node.x, node.y, node.z)
      .normalize()
      .applyAxisAngle(y.current, spin);

    z.current.crossVectors(x.current, y.current).normalize();

    const sphere = group.children[0] as THREE.Mesh<
      THREE.SphereGeometry,
      THREE.ShaderMaterial
    >;

    sphere.quaternion.setFromRotationMatrix(
      basis.current.makeBasis(x.current, y.current, z.current),
    );

    const light = state.toSun;
    sphere.material.uniforms.uSunDirection.value.set(light.x, light.y, light.z);

    if (body === "Saturn") {
      const ring = sphere.children[0] as THREE.Mesh<
        THREE.RingGeometry,
        THREE.ShaderMaterial
      >;

      ring.material.uniforms.uSunDirection.value.copy(
        sphere.material.uniforms.uSunDirection.value,
      );
    }

    if (body === "Sun") {
      group.children[1].quaternion.copy(camera.quaternion);
    }
  });

  return <primitive ref={root} object={model} />;
}

export function SolarSystem({ getDate }: Props) {
  return (
    <>
      {SKY_BODIES.map((body) => (
        <SkyPlanet key={body} body={body} getDate={getDate} />
      ))}
    </>
  );
}
