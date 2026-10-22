export type SatelliteFamily = "iss" | "starlink" | "generic";

const RULES: { family: SatelliteFamily; pattern: RegExp }[] = [
  { family: "iss", pattern: /^ISS \(ZARYA\)/ },
  { family: "starlink", pattern: /^STARLINK/ },
];

export function satelliteFamily(name: string): SatelliteFamily {
  return RULES.find((rule) => rule.pattern.test(name))?.family ?? "generic";
}
