import type { OrbitControls } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import { useRef, type ComponentRef } from "react";
import * as THREE from "three";
import { HOME_DISTANCE } from "./cameraSettings";
import { MENU_TURN, MENU_TURN_MS, turnEasing } from "./menuTurn";

import type { Vec3 } from "../viewmodels/useEarthViewModel";

type OrbitControlsObject = ComponentRef<typeof OrbitControls>;

const FOCUS_DISTANCE = 0.15;
const EASE = 0.08;
const FOCUS_ZOOM = { min: 0.05, max: 1.5 };
const HOME_ZOOM = { min: 1.3, max: 8 };

const goal = new THREE.Vector3();
const cameraGoal = new THREE.Vector3();
const step = new THREE.Vector3();
const fromDirection = new THREE.Vector3();
const toDirection = new THREE.Vector3();
const fullTurn = new THREE.Quaternion();
const stepTurn = new THREE.Quaternion();
const homeView = new THREE.Quaternion();
const turnFrom = new THREE.Quaternion();
const turnTo = new THREE.Quaternion();
const lookRight = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  -MENU_TURN,
);

type CameraRigProps = {
  selectedId: number | null;
  getSatellitePosition: (id: number) => Vec3 | null;
  menuOpen: boolean;
};

export function CameraRig({
  selectedId,
  getSatellitePosition,
  menuOpen,
}: CameraRigProps) {
  const flying = useRef(false);
  const flightFor = useRef<number | null | undefined>(undefined);
  const turning = useRef(false);
  const turnFor = useRef<boolean | null>(null);
  const turnStart = useRef(0);
  const turnDistance = useRef(HOME_DISTANCE);

  useFrame(({ camera, controls, clock }) => {
    const orbit = controls as OrbitControlsObject | null;
    if (!orbit) return;

    if (flightFor.current !== selectedId) {
      flightFor.current = selectedId;
      flying.current = true;
      orbit.enabled = false;
      orbit.minDistance = 0;
      orbit.maxDistance = Infinity;
    }

    // First frame after mounting. expo-gl swaps its GL context while another screen covers
    // this one, which rebuilds the scene with a fresh camera. If the menu is still open when
    // you come back, face the star chart straight away instead of flying home.
    if (turnFor.current === null) {
      turnFor.current = menuOpen;
      if (menuOpen) {
        flying.current = false;
        camera.position.setLength(HOME_DISTANCE);
        homeView.copy(camera.quaternion);
        camera.quaternion.multiply(lookRight);
        orbit.minDistance = HOME_ZOOM.min;
        orbit.maxDistance = HOME_ZOOM.max;
      }
    }
    // Menu: turn right to face the star chart (backing out to home distance), or turn back.
    // Waits for a satellite flight to land so the two never move the camera at once.
    if (!flying.current && turnFor.current !== menuOpen) {
      if (menuOpen && !turning.current) homeView.copy(camera.quaternion);
      turnFor.current = menuOpen;
      turnFrom.copy(camera.quaternion);
      turnTo.copy(homeView);
      if (menuOpen) turnTo.multiply(lookRight);
      turnDistance.current = camera.position.length();
      turnStart.current = clock.getElapsedTime();
      turning.current = true;
      orbit.enabled = false;
    }

    if (turning.current) {
      const elapsedMs = (clock.getElapsedTime() - turnStart.current) * 1000;
      const t = Math.min(1, elapsedMs / MENU_TURN_MS);
      const eased = turnEasing(t);
      camera.quaternion.slerpQuaternions(turnFrom, turnTo, eased);
      camera.position.setLength(
        THREE.MathUtils.lerp(turnDistance.current, HOME_DISTANCE, eased),
      );
      if (t === 1) {
        turning.current = false;
        orbit.enabled = !menuOpen;
      }
      return;
    }
    if (menuOpen) return;

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
