import * as THREE from "three";

type EarthMaps = {
  day: THREE.Texture;
  night: THREE.Texture;
  clouds: THREE.Texture;
};

const vertexShader = `
   varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;

    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uCloudsMap;
  uniform vec3 uSunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

    void main() {

    float sunFacing = dot(normalize(vNormal), uSunDirection);

    float dayMix = smoothstep(-0.1, 0.2, sunFacing);

    vec3 surface = mix(texture2D(uNightMap, vUv).rgb, texture2D(uDayMap, vUv).rgb, dayMix);

    float cloudCover = smoothstep(0.4, 1.0, texture2D(uCloudsMap, vUv).g) * dayMix;

    gl_FragColor = vec4(mix(surface, vec3(1.0), cloudCover), 1.0);
  }
`;

export function createEarthMaterial({ day, night, clouds }: EarthMaps) {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uDayMap: { value: day },
      uNightMap: { value: night },
      uCloudsMap: { value: clouds },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    },
  });

  return { material, sunDirection: material.uniforms.uSunDirection };
}
