import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { DeviceMotion, Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

const TARGET_AZIMUTH = 312;
const TARGET_ELEVATION = 48;
const AZIMUTH_TOLERANCE = 6;
const ELEVATION_TOLERANCE = 7;

type SensorState = "checking" | "active" | "unavailable" | "denied";

export type SkyTarget = {
  azimuth: string;
  elevation: string;
  visible: string;
};

const TARGET: SkyTarget = {
  azimuth: `${TARGET_AZIMUTH}° NW`,
  elevation: `${TARGET_ELEVATION}°`,
  visible: "6 min",
};

function normalizeAngle(value: number) {
  return ((value % 360) + 360) % 360;
}

function shortestAngle(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function cardinalDirection(heading: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(heading / 45) % directions.length];
}

function guidanceFor(
  sensorState: SensorState,
  aligned: boolean,
  azimuthDifference: number,
  elevationDifference: number,
) {
  if (sensorState === "checking") return "Calibrating your sky view…";
  if (sensorState === "denied")
    return "Sensor access is off — use the numeric bearings below";
  if (sensorState === "unavailable")
    return "Sensors unavailable — follow the numeric bearings";
  if (aligned) return "Target aligned — look up now";

  const turn =
    Math.abs(azimuthDifference) < AZIMUTH_TOLERANCE
      ? "Hold this direction"
      : azimuthDifference > 0
        ? "Turn slowly right"
        : "Turn slowly left";
  const tilt =
    Math.abs(elevationDifference) < ELEVATION_TOLERANCE
      ? "keep your tilt"
      : elevationDifference > 0
        ? "tilt upward"
        : "tilt downward";

  return `${turn} and ${tilt}`;
}

export function useSkyFinderViewModel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [heading, setHeading] = useState(276);
  const [elevation, setElevation] = useState(34);
  const [sensorState, setSensorState] = useState<SensorState>("checking");
  const [vibration, setVibration] = useState(true);
  const wasAligned = useRef(false);

  useEffect(() => {
    let magnetometerSubscription: { remove: () => void } | undefined;
    let motionSubscription: { remove: () => void } | undefined;
    let mounted = true;

    async function startSensors() {
      try {
        const [magnetometerAvailable, motionAvailable] = await Promise.all([
          Magnetometer.isAvailableAsync(),
          DeviceMotion.isAvailableAsync(),
        ]);

        if (!mounted) return;
        if (!magnetometerAvailable || !motionAvailable) {
          setSensorState("unavailable");
          return;
        }

        const [magnetometerPermission, motionPermission] = await Promise.all([
          Magnetometer.requestPermissionsAsync(),
          DeviceMotion.requestPermissionsAsync(),
        ]);

        if (!mounted) return;
        if (!magnetometerPermission.granted || !motionPermission.granted) {
          setSensorState("denied");
          return;
        }

        Magnetometer.setUpdateInterval(120);
        DeviceMotion.setUpdateInterval(120);

        magnetometerSubscription = Magnetometer.addListener(({ x, y }) => {
          const calculatedHeading = normalizeAngle(
            Math.atan2(y, x) * (180 / Math.PI) - 90,
          );
          setHeading((current) => current * 0.82 + calculatedHeading * 0.18);
        });

        motionSubscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const pitchDegrees = Math.abs(rotation.beta * (180 / Math.PI));
          const calculatedElevation = Math.max(
            0,
            Math.min(90, 90 - pitchDegrees),
          );
          setElevation((current) => current * 0.8 + calculatedElevation * 0.2);
        });

        setSensorState("active");
      } catch {
        if (mounted) setSensorState("unavailable");
      }
    }

    startSensors();

    return () => {
      mounted = false;
      magnetometerSubscription?.remove();
      motionSubscription?.remove();
    };
  }, []);

  const azimuthDifference = shortestAngle(heading, TARGET_AZIMUTH);
  const elevationDifference = TARGET_ELEVATION - elevation;
  const aligned =
    Math.abs(azimuthDifference) < AZIMUTH_TOLERANCE &&
    Math.abs(elevationDifference) < ELEVATION_TOLERANCE;

  useEffect(() => {
    if (aligned && !wasAligned.current && vibration) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
    wasAligned.current = aligned;
  }, [aligned, vibration]);

  const facing = normalizeAngle(heading);

  return {
    noradId: id ?? "25544",
    aligned,
    guidance: guidanceFor(
      sensorState,
      aligned,
      azimuthDifference,
      elevationDifference,
    ),
    pointerAngle: azimuthDifference,
    heading: `${Math.round(facing)}° ${cardinalDirection(facing)}`,
    elevation: `${Math.round(elevation)}° up`,
    sensorsLive: sensorState === "active",
    statusLabel:
      sensorState === "active"
        ? "Sensors live"
        : sensorState === "checking"
          ? "Calibrating"
          : "Numeric mode",
    target: TARGET,
    vibration,
    setVibration,
  };
}
