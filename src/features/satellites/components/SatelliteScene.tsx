/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame } from "@react-three/fiber/native";
import { MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";

type RotationState = {
  x: number;
  y: number;
};

type SatelliteSceneProps = {
  rotation: MutableRefObject<RotationState>;
  paused: boolean;
};

function Stars() {
  const positions = useMemo(() => {
    const points = new Float32Array(210 * 3);
    let seed = 25544;

    for (let index = 0; index < points.length; index += 3) {
      seed = (seed * 9301 + 49297) % 233280;
      points[index] = (seed / 233280 - 0.5) * 14;
      seed = (seed * 9301 + 49297) % 233280;
      points[index + 1] = (seed / 233280 - 0.5) * 10;
      seed = (seed * 9301 + 49297) % 233280;
      points[index + 2] = -2 - (seed / 233280) * 7;
    }

    return points;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#BEEFFF" size={0.035} transparent opacity={0.72} />
    </points>
  );
}

function Earth() {
  const earth = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (earth.current) earth.current.rotation.y += delta * 0.055;
  });

  return (
    <group ref={earth} position={[0, -2.35, -0.4]} rotation={[0.12, 0, -0.15]}>
      <mesh>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial color="#123D63" roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh rotation={[0.35, 0.15, 0.18]}>
        <sphereGeometry args={[2.515, 48, 48]} />
        <meshStandardMaterial
          color="#35B8A3"
          emissive="#0D584F"
          emissiveIntensity={0.45}
          transparent
          opacity={0.28}
          wireframe
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[2.56, 64, 64]} />
        <meshBasicMaterial
          color="#78E6FF"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2.55, 0.2, 0.4]}>
        <torusGeometry args={[2.72, 0.012, 8, 160]} />
        <meshBasicMaterial color="#78E6FF" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function SolarPanel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.28, 0.46, 0.045]} />
        <meshStandardMaterial
          color="#17689A"
          emissive="#0A3C67"
          emissiveIntensity={0.7}
          metalness={0.65}
          roughness={0.22}
        />
      </mesh>
      {[-0.42, 0, 0.42].map((x) => (
        <mesh key={x} position={[x, 0, 0.027]}>
          <boxGeometry args={[0.018, 0.42, 0.008]} />
          <meshBasicMaterial color="#78E6FF" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function Station({ rotation, paused }: SatelliteSceneProps) {
  const station = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);

  useFrame(({ clock }, delta) => {
    if (!station.current) return;

    station.current.rotation.x +=
      (rotation.current.x - station.current.rotation.x) * 0.09;
    station.current.rotation.y +=
      (rotation.current.y - station.current.rotation.y) * 0.09;
    if (!paused) station.current.rotation.y += delta * 0.18;
    station.current.position.y = 0.25 + Math.sin(clock.elapsedTime * 0.75) * 0.055;
    if (glow.current) glow.current.intensity = 2.1 + Math.sin(clock.elapsedTime * 2) * 0.35;
  });

  return (
    <group ref={station} position={[0, 0.25, 0]} rotation={[0.22, -0.5, -0.08]}>
      <pointLight ref={glow} color="#78E6FF" intensity={2.2} distance={4.5} />

      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 1.38, 20]} />
        <meshStandardMaterial color="#DDE9F5" metalness={0.82} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.28, 20]} />
        <meshStandardMaterial color="#8EA3BA" metalness={0.9} roughness={0.16} />
      </mesh>
      <mesh position={[0, -0.73, 0]}>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color="#DCE9F4" metalness={0.78} roughness={0.18} />
      </mesh>

      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 3.25, 12]} />
          <meshStandardMaterial color="#B9C8D9" metalness={0.85} roughness={0.22} />
        </mesh>
        <SolarPanel position={[0, 1.95, 0]} />
        <SolarPanel position={[0, -1.95, 0]} />
      </group>

      <mesh position={[0.34, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.75, 14]} />
        <meshStandardMaterial color="#99ACC0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.72, 0.22, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.18, 0.035, 12, 30]} />
        <meshStandardMaterial color="#78E6FF" emissive="#1A7DA0" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

export function SatelliteScene({ rotation, paused }: SatelliteSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.25, 7.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#060914"]} />
      <fog attach="fog" args={["#060914", 7, 13]} />
      <ambientLight intensity={0.65} color="#8FA8D7" />
      <directionalLight position={[-4, 5, 5]} intensity={3.3} color="#CDEEFF" />
      <directionalLight position={[4, -1, 2]} intensity={1.8} color="#8B7BFF" />
      <Stars />
      <Earth />
      <Station rotation={rotation} paused={paused} />
    </Canvas>
  );
}
