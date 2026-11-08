/* eslint-disable react/no-unknown-property */
import { useTexture } from "@react-three/drei/native";
import { useFrame, type ThreeEvent } from "@react-three/fiber/native";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import type { SatelliteFamily } from "@/core/satellites/family";
import colors from "@/theme/colors";
import { CAMERA_FOV } from "./cameraSettings";
import { SATELLITE_SPRITES } from "./satelliteModels";

import type { ObjectKind } from "@/core/satellites/CatalogueRepository";
import type { SceneState } from "@/core/satellites/OrbitCatalogue";

const COLORS: Record<ObjectKind, string> = {
  payload: "#7CFFB2",
  rocket: "#FFD370",
  debris: "#FB7185",
  unknown: "#8A93B5",
};

type Item = {
  id: number;
  kind: ObjectKind;
  family: SatelliteFamily;
};

type Props = {
  satellites: Item[];
  hiddenId: number | null;
  getDate: () => Date;
  getState: (id: number, date: Date) => SceneState | null;
  onSelect: (id: number) => void;
};

export function SatelliteCloud({
  satellites,
  hiddenId,
  getDate,
  getState,
  onSelect,
}: Props) {
  const data = useMemo(() => {
    const positions = new Float32Array(satellites.length * 3);
    const colorValues = new Float32Array(positions.length);

    const dotIndices: number[] = [];
    const payloadIndices: Record<SatelliteFamily, number[]> = {
      iss: [],
      starlink: [],
      generic: [],
    };

    satellites.forEach((item, index) => {
      new THREE.Color(COLORS[item.kind]).toArray(colorValues, index * 3);

      if (item.kind === "payload") {
        payloadIndices[item.family].push(index);
      } else {
        dotIndices.push(index);
      }
    });

    const position = new THREE.BufferAttribute(positions, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const color = new THREE.BufferAttribute(colorValues, 3);

    function geometryFor(indices: number[]) {
      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute("position", position);
      geometry.setAttribute("color", color);
      geometry.setIndex(indices);
      geometry.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(),
        1_000_000,
      );

      return geometry;
    }

    const payloads = (Object.keys(payloadIndices) as SatelliteFamily[])
      .filter((family) => payloadIndices[family].length > 0)
      .map((family) => ({
        family,
        geometry: geometryFor(payloadIndices[family]),
      }));

    return {
      geometry: geometryFor(dotIndices),
      payloads,
      positions,
      base: new Float64Array(positions.length),
      velocity: new Float64Array(positions.length),
      sampledAt: new Float64Array(satellites.length).fill(NaN),
      cursor: 0,
      lastFrameAt: 0,
      earth: new THREE.Sphere(new THREE.Vector3(), 1),
      hit: new THREE.Vector3(),
    };
  }, [satellites]);

  useEffect(
    () => () => {
      data.geometry.dispose();
      data.payloads.forEach((batch) => batch.geometry.dispose());
    },
    [data],
  );

  useFrame(() => {
    if (!satellites.length) return;

    const date = getDate();
    const time = date.getTime();
    const started = performance.now();

    if (data.lastFrameAt && started - data.lastFrameAt > 2000) {
      data.sampledAt.fill(NaN);
    }

    data.lastFrameAt = started;
    let sampled = 0;

    // Bound orbital calculations; smooth markers using sampled velocity.
    do {
      const index = data.cursor;
      const state = getState(satellites[index].id, date);
      const offset = index * 3;

      data.sampledAt[index] = state ? time : NaN;

      if (state) {
        data.base.set(
          [state.position.x, state.position.y, state.position.z],
          offset,
        );
        data.velocity.set(
          [state.velocity.x, state.velocity.y, state.velocity.z],
          offset,
        );
      }

      data.cursor = (index + 1) % satellites.length;
      sampled++;
    } while (
      sampled < Math.min(512, satellites.length) &&
      performance.now() - started < 3
    );

    for (let index = 0; index < satellites.length; index++) {
      const offset = index * 3;
      const available =
        Number.isFinite(data.sampledAt[index]) &&
        satellites[index].id !== hiddenId;

      const elapsed = (time - data.sampledAt[index]) / 1000;

      for (let axis = 0; axis < 3; axis++) {
        data.positions[offset + axis] = available
          ? data.base[offset + axis] + data.velocity[offset + axis] * elapsed
          : 0;
      }
    }

    data.geometry.attributes.position.needsUpdate = true;
  });

  function raycast(
    this: THREE.Points,
    raycaster: THREE.Raycaster,
    intersections: THREE.Intersection[],
  ) {
    const hits: THREE.Intersection[] = [];

    THREE.Points.prototype.raycast.call(this, raycaster, hits);

    for (const hit of hits) {
      const index = hit.index;

      if (
        index === undefined ||
        !Number.isFinite(data.sampledAt[index]) ||
        satellites[index].id === hiddenId
      ) {
        continue;
      }

      const blocked = raycaster.ray.intersectSphere(data.earth, data.hit);

      if (
        blocked &&
        raycaster.ray.origin.distanceToSquared(blocked) <
          raycaster.ray.origin.distanceToSquared(hit.point) - 0.001
      ) {
        continue;
      }

      intersections.push(hit);
    }
  }

  const select = (event: ThreeEvent<MouseEvent>) => {
    if (event.index === undefined) return;

    event.stopPropagation();
    onSelect(satellites[event.index].id);
  };

  return (
    <>
      <points
        raycast={raycast}
        geometry={data.geometry}
        onClick={select}
        frustumCulled={false}
      >
        <pointsMaterial
          size={0.025}
          vertexColors
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {data.payloads.map((batch) => (
        <SatelliteMarkers
          key={batch.family}
          family={batch.family}
          geometry={batch.geometry}
          raycast={raycast}
          onClick={select}
        />
      ))}
    </>
  );
}

function SatelliteMarkers({
  family,
  geometry,
  raycast,
  onClick,
}: {
  family: SatelliteFamily;
  geometry: THREE.BufferGeometry;
  raycast: THREE.Points["raycast"];
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const icon = useTexture(SATELLITE_SPRITES[family] as unknown as string);

  // Match the existing 0.06-world-unit satellite sprites at the globe's FOV.
  const size = 0.06 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

  return (
    <points
      geometry={geometry}
      raycast={raycast}
      onClick={onClick}
      frustumCulled={false}
    >
      <pointsMaterial
        map={icon}
        color={colors.accent}
        size={size}
        sizeAttenuation
        transparent
        alphaTest={0.1}
        depthWrite={false}
      />
    </points>
  );
}
