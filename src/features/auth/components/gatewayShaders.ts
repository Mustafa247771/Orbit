export const gatewayVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const gatewayFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform float uPulseAge;
  uniform float uInteraction;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec2 blend = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), blend.x),
      blend.y
    );
  }

  float orbitMarks(float radius, float target, float angle, float count) {
    float line = 1.0 - smoothstep(0.0007, 0.0019, abs(radius - target));
    float dotMask = smoothstep(0.94, 0.995, cos(angle * count));
    return line * dotMask;
  }

  void main() {
    float shortSide = min(uResolution.x, uResolution.y);
    vec2 p = (vUv - uCenter) * uResolution / shortSide;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    float time = uTime * 0.12;

    // Cloud light extends beyond the core, including on a tall phone.
    vec2 cloudPosition = p * 2.4 + vec2(time * 0.13, -time * 0.08);
    float cloud = noise(cloudPosition) * 0.66
      + noise(cloudPosition * 2.1 + 4.7) * 0.34;
    float haze = exp(-radius * 1.6) * (0.35 + cloud * 0.65);
    float violetSide = smoothstep(-0.5, 0.6, p.x - p.y * 0.5);
    vec3 light = vec3(0.002, 0.003, 0.013);
    light += mix(vec3(0.025, 0.075, 0.24), vec3(0.12, 0.025, 0.22), violetSide)
      * haze;

    // Curved filaments give the corona depth without a model or bloom pass.
    float twist = angle + 0.15 * log(1.0 + radius * 5.0) - time * 0.04;
    float filament = pow(max(0.0, sin(twist * 97.0 + sin(twist * 19.0) * 4.0)), 18.0);
    float fineFilament = pow(max(0.0, sin(twist * 173.0 - sin(twist * 31.0) * 3.0)), 30.0);
    float stream = 0.45 + 0.55 * sin(radius * 29.0 - time * 3.0 + angle * 7.0);
    float rays = (filament * 0.65 + fineFilament * 0.3) * (0.65 + stream * 0.35);
    rays *= exp(-max(0.0, radius - 0.15) * 3.2) * smoothstep(0.12, 0.2, radius);
    light += mix(vec3(0.12, 0.4, 1.1), vec3(0.5, 0.15, 0.85), violetSide) * rays;

    float halo = exp(-radius * radius * 9.0);
    float innerHalo = exp(-radius * radius * 37.0);
    light += vec3(0.04, 0.19, 0.68) * halo;
    light += vec3(0.38, 0.34, 0.8) * innerHalo;

    float edgeNoise = noise(vec2(cos(angle), sin(angle)) * 14.0 + time * 0.25);
    float edge = 0.143 + (edgeNoise - 0.5) * 0.009;
    float rim = exp(-abs(radius - edge) * 140.0);
    float core = 1.0 - smoothstep(edge - 0.018, edge + 0.009, radius);
    light += vec3(1.3, 0.6, 1.1) * rim;
    light += vec3(8.0, 8.7, 10.0) * core;

    float marks = orbitMarks(radius, 0.32, angle + time * 0.03, 120.0)
      + orbitMarks(radius, 0.49, angle - time * 0.02, 160.0)
      + orbitMarks(radius, 0.69, angle + time * 0.01, 200.0) * 0.45;
    light += vec3(0.12, 0.3, 0.46) * marks;

    float pulseRadius = 0.15 + uPulseAge * 0.63;
    float pulse = exp(-abs(radius - pulseRadius) * 35.0)
      * max(0.0, 1.0 - uPulseAge / 1.6);
    light += vec3(0.35, 0.7, 1.0) * pulse;
    light *= 1.0 + uInteraction * 0.24;

    float vignette = 1.0 - smoothstep(0.4, 1.4, radius) * 0.55;
    vec3 color = (1.0 - exp(-light)) * vignette;
    color += (hash(vUv * uResolution) - 0.5) * 0.004;
    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
    #include <colorspace_fragment>
  }
`;

export const gatewayParticleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  varying float vTint;

  void main() {
    float depth = position.z;
    float travel = fract(position.y + uTime * (0.004 + depth * 0.006));
    float radius = 0.18 + travel * 1.35;
    float angle = position.x + uTime * 0.008 + log(1.0 + radius * 4.0) * 0.13;
    vec2 p = vec2(cos(angle), sin(angle)) * radius;
    p += uPointer * (0.012 + depth * 0.045);
    vec2 uv = uCenter + p * min(uResolution.x, uResolution.y) / uResolution;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    float fade = smoothstep(0.0, 0.04, travel) * (1.0 - smoothstep(0.85, 1.0, travel));
    vBrightness = aBrightness * fade * (0.85 + 0.15 * sin(uTime * 0.7 + position.x));
    vTint = depth;
  }
`;

export const gatewayParticleFragmentShader = /* glsl */ `
  varying float vBrightness;
  varying float vTint;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float glow = exp(-dot(p, p) * 24.0);
    float spark = exp(-abs(p.x) * 45.0) * exp(-abs(p.y) * 8.0)
      + exp(-abs(p.y) * 45.0) * exp(-abs(p.x) * 8.0);
    float alpha = (glow * 0.65 + spark * 0.22) * vBrightness;
    vec3 color = mix(vec3(0.4, 0.65, 1.0), vec3(0.9, 0.7, 1.0), vTint);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;
