import type { OrbitControls } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import { useRef, type ComponentRef } from "react";
import * as THREE from "three";

import type { Vec3 } from "../viewmodels/useEarthViewModel";

type OrbitControlsObject = ComponentRef<typeof OrbitControls>;

const FOCUS_DISTANCE = 0.15;
const HOME_DISTANCE = 3.5;
const EASE = 0.08;
const FOCUS_ZOOM = { min: 0.01, max: 1.5 };
const HOME_ZOOM = { min: 1.3, max: 8 };

const goal = new THREE.Vector3();
const cameraGoal = new THREE.Vector3();
const step = new THREE.Vector3();
const fromDirection = new THREE.Vector3();
const toDirection = new THREE.Vector3();
const fullTurn = new THREE.Quaternion();
const stepTurn = new THREE.Quaternion();

type CameraRigProps = {
  selectedId: number | null;
  getSatellitePosition: (id: number) => Vec3 | null;
};

export function CameraRig({
  selectedId,
  getSatellitePosition,
}: CameraRigProps) {
  const flying = useRef(false);
  const flightFor = useRef<number | null | undefined>(undefined);

  useFrame(({ camera, controls }) => {
    const orbit = controls as OrbitControlsObject | null;
    if (!orbit) return;

    if (flightFor.current !== selectedId) {
      flightFor.current = selectedId;
      flying.current = true;
      orbit.enabled = false;
      orbit.minDistance = 0;
      orbit.maxDistance = Infinity;
    }

    const satellite =
      selectedId === null ? null : getSatellitePosition(selectedId);
    if (satellite) goal.set(satellite.x, satellite.y, satellite.z);
    else goal.set(0, 0, 0);

    if (flying.current) {
      if (satellite)
        cameraGoal.copy(goal).setLength(goal.length() + FOCUS_DISTANCE);
      else cameraGoal.copy(camera.position).setLength(HOME_DISTANCE);

      orbit.target.lerp(goal, EASE);
      fromDirection.copy(camera.position).normalize();
      fullTurn.setFromUnitVectors(
        fromDirection,
        toDirection.copy(cameraGoal).normalize(),
      );
      stepTurn.identity().slerp(fullTurn, EASE);
      const distance = THREE.MathUtils.lerp(
        camera.position.length(),
        cameraGoal.length(),
        EASE,
      );
      camera.position
        .copy(fromDirection.applyQuaternion(stepTurn))
        .multiplyScalar(distance);

      camera.lookAt(orbit.target);

      const landed =
        orbit.target.distanceTo(goal) < 0.001 &&
        camera.position.distanceTo(cameraGoal) < 0.005;
      if (landed) {
        flying.current = false;
        const zoom = satellite ? FOCUS_ZOOM : HOME_ZOOM;
        orbit.minDistance = zoom.min;
        orbit.maxDistance = zoom.max;
        orbit.enabled = true;
      }
    } else if (satellite) {
      step.subVectors(goal, orbit.target);
      orbit.target.add(step);
      camera.position.add(step);
    }
  });

  return null;
}
