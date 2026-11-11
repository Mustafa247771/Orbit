import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { DeviceMotion } from "expo-sensors";
import { useLocalSearchParams } from "expo-router";
import { satelliteBearing, cardinalDirection, type SatelliteBearing } from "@/core/orbit/observer";
import { getEphemeris } from "@/core/satellites/EphemerisRepository";

type SensorState = "checking" | "active" | "unavailable" | "denied";
const normalize = (angle: number) => ((angle % 360) + 360) % 360;
const angularDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

export function useSkyFinderViewModel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noradId = Number(id) > 0 ? Number(id) : 25544;
  const [heading, setHeading] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [bearing, setBearing] = useState<SatelliteBearing | null>(null);
  const [targetName, setTargetName] = useState(noradId === 25544 ? "ISS" : `NORAD ${noradId}`);
  const [dataState, setDataState] = useState("Retrieving orbit and GPS…");
  const [sensorState, setSensorState] = useState<SensorState>("checking");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const wasAligned = useRef(false);

  useEffect(() => {
    let active = true;
    let headingSubscription: { remove: () => void } | undefined;
    let motionSubscription: { remove: () => void } | undefined;
    let orbitalTimer: ReturnType<typeof setInterval> | undefined;
    async function start() {
      try {
        const locationPermission = await Location.requestForegroundPermissionsAsync();
        if (!locationPermission.granted) { setSensorState("denied"); throw new Error("Enable location to calculate live target bearings."); }
        const where = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const ephemeris = await getEphemeris(noradId);
        if (!active) return;
        setTargetName(noradId === 25544 ? "ISS" : ephemeris.satellite.name);
        setDataState(ephemeris.stale ? "Using cached orbital data" : "Live orbital calculation");
        const update = () => {
          if (active) setBearing(satelliteBearing(ephemeris.satellite, where.coords, new Date()));
        };
        update();
        orbitalTimer = setInterval(update, 5000);
        const motionAvailable = await DeviceMotion.isAvailableAsync();
        if (!motionAvailable) { setSensorState("unavailable"); return; }
        const motionPermission = await DeviceMotion.requestPermissionsAsync();
        if (!motionPermission.granted) { setSensorState("denied"); return; }
        DeviceMotion.setUpdateInterval(150);
        motionSubscription = DeviceMotion.addListener(({ rotation }) => {
          if (!active || !rotation) return;
          const pitch = Math.abs(rotation.beta * 180 / Math.PI);
          const tilt = Math.max(0, Math.min(90, 90 - pitch));
          setElevation((current) => current === null ? tilt : current * 0.78 + tilt * 0.22);
        });
        headingSubscription = await Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
          if (!active) return;
          const value = normalize(trueHeading >= 0 ? trueHeading : magHeading);
          setHeading((current) => current === null ? value : normalize(current + angularDelta(current, value) * 0.24));
          setSensorState("active");
        });
      } catch (error) {
        if (active) {
          setDataState(error instanceof Error ? error.message : "Satellite bearings unavailable.");
          setSensorState((previous) => previous === "denied" ? "denied" : "unavailable");
        }
      }
    }
    void start();
    return () => {
      active = false;
      headingSubscription?.remove(); motionSubscription?.remove();
      if (orbitalTimer) clearInterval(orbitalTimer);
    };
  }, [noradId]);

  const azimuthDifference = bearing !== null && heading !== null ? angularDelta(heading, bearing.azimuth) : 0;
  const elevationDifference = bearing !== null && elevation !== null ? bearing.elevation - elevation : 0;
  const aligned = Boolean(bearing && bearing.elevation > 0 && heading !== null && elevation !== null &&
    Math.abs(azimuthDifference) < 6 && Math.abs(elevationDifference) < 8);
  const guidance = useMemo(() => {
    if (!bearing) return dataState;
    if (bearing.elevation < 0) return "Satellite is below your horizon right now";
    if (sensorState === "denied") return "Sensors denied — use the numeric bearings";
    if (sensorState !== "active" || heading === null || elevation === null) return "Calibrating compass — numeric target below";
    if (aligned) return "Target aligned — look toward the sky";
    const turn = Math.abs(azimuthDifference) < 6 ? "Hold this direction" : azimuthDifference > 0 ? "Turn slowly right" : "Turn slowly left";
    const tilt = Math.abs(elevationDifference) < 8 ? "hold tilt" : elevationDifference > 0 ? "tilt upward" : "tilt downward";
    return `${turn} and ${tilt}`;
  }, [bearing, dataState, sensorState, heading, elevation, aligned, azimuthDifference, elevationDifference]);

  useEffect(() => {
    if (aligned && !wasAligned.current && hapticsEnabled && sensorState === "active") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    wasAligned.current = aligned;
  }, [aligned, hapticsEnabled, sensorState]);

  return {
    noradId, heading, elevation, bearing, targetName, dataState, sensorState,
    azimuthDifference, elevationDifference, aligned, guidance,
    statusText: sensorState === "active" ? "Sensors live" : sensorState === "checking" ? "Calibrating" : "Numeric mode",
    hapticsEnabled, setHapticsEnabled, cardinalDirection,
  };
}
