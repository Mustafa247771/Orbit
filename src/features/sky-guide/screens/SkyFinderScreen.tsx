import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { DeviceMotion, Magnetometer } from "expo-sensors";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TARGET_AZIMUTH = 312;
const TARGET_ELEVATION = 48;

type SensorState = "checking" | "active" | "unavailable" | "denied";

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

export default function SkyFinderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [heading, setHeading] = useState(276);
  const [elevation, setElevation] = useState(34);
  const [sensorState, setSensorState] = useState<SensorState>("checking");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
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
    Math.abs(azimuthDifference) < 6 && Math.abs(elevationDifference) < 7;

  useEffect(() => {
    if (aligned && !wasAligned.current && hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
    wasAligned.current = aligned;
  }, [aligned, hapticsEnabled]);

  const guidance = useMemo(() => {
    if (sensorState === "checking") return "Calibrating your sky view…";
    if (sensorState === "denied")
      return "Sensor access is off — use the numeric bearings below";
    if (sensorState === "unavailable")
      return "Sensors unavailable — follow the numeric bearings";
    if (aligned) return "Target aligned — look up now";

    const turn =
      Math.abs(azimuthDifference) < 6
        ? "Hold this direction"
        : azimuthDifference > 0
          ? "Turn slowly right"
          : "Turn slowly left";
    const tilt =
      Math.abs(elevationDifference) < 7
        ? "keep your tilt"
        : elevationDifference > 0
          ? "tilt upward"
          : "tilt downward";

    return `${turn} and ${tilt}`;
  }, [aligned, azimuthDifference, elevationDifference, sensorState]);

  const statusText =
    sensorState === "active"
      ? "Sensors live"
      : sensorState === "checking"
        ? "Calibrating"
        : "Numeric mode";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#060914", "#081329", "#060914"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.star, styles.starOne]} />
      <View style={[styles.star, styles.starTwo]} />
      <View style={[styles.star, styles.starThree]} />
      <View style={[styles.star, styles.starFour]} />
      <View style={[styles.star, styles.starFive]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>GUIDED VIEW</Text>
            <Text style={styles.headerTitle}>Sky Finder</Text>
          </View>

          <View style={styles.liveButton}>
            <View
              style={[
                styles.liveDot,
                sensorState !== "active" && styles.liveDotWaiting,
              ]}
            />
            <Text style={styles.liveIcon}>⌁</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.targetLabel}>ISS · NORAD {id ?? "25544"}</Text>
          <Text style={styles.title}>Find your{`\n`}moving star.</Text>
          <Text style={styles.subtitle}>
            Hold your phone upright and follow the guide toward the
            International Space Station.
          </Text>
        </View>

        <View style={styles.compassSection}>
          <View style={styles.compassGlow} />
          <View style={styles.compassOuter}>
            <View style={styles.compassMiddle}>
              <View style={styles.compassInner}>
                <View style={styles.crossHorizontal} />
                <View style={styles.crossVertical} />
                <View style={styles.centerDotOuter}>
                  <View style={styles.centerDot} />
                </View>
              </View>
            </View>

            <Text style={[styles.cardinal, styles.north]}>N</Text>
            <Text style={[styles.cardinal, styles.east]}>E</Text>
            <Text style={[styles.cardinal, styles.south]}>S</Text>
            <Text style={[styles.cardinal, styles.west]}>W</Text>

            <View
              style={[
                styles.targetOrbit,
                { transform: [{ rotate: `${azimuthDifference}deg` }] },
              ]}
            >
              <View style={styles.targetMarker}>
                <View style={styles.targetSatelliteBody} />
                <View style={[styles.targetPanel, styles.targetPanelLeft]} />
                <View style={[styles.targetPanel, styles.targetPanelRight]} />
              </View>
            </View>

            <View
              style={[
                styles.guidanceArrowWrap,
                {
                  transform: [
                    {
                      rotate: `${Math.max(-70, Math.min(70, azimuthDifference))}deg`,
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.guidanceArrow,
                  aligned && styles.guidanceArrowAligned,
                ]}
              >
                ↑
              </Text>
            </View>
          </View>

          <View style={styles.targetReadout}>
            <Text style={styles.targetReadoutLabel}>TARGET</Text>
            <Text style={styles.targetReadoutValue}>
              ISS / {TARGET_ELEVATION}°
            </Text>
          </View>
        </View>

        <View
          style={[styles.guidancePill, aligned && styles.guidancePillAligned]}
        >
          <View
            style={[
              styles.guidanceStatusDot,
              aligned && styles.guidanceStatusDotAligned,
            ]}
          />
          <Text
            style={[styles.guidanceText, aligned && styles.guidanceTextAligned]}
          >
            {guidance}
          </Text>
        </View>

        <View style={styles.readingsCard}>
          <View style={styles.readingBlock}>
            <Text style={styles.readingLabel}>YOUR HEADING</Text>
            <Text style={styles.readingValue}>
              {Math.round(normalizeAngle(heading))}°{" "}
              <Text style={styles.readingAccent}>
                {cardinalDirection(heading)}
              </Text>
            </Text>
          </View>
          <View style={styles.readingDivider} />
          <View style={styles.readingBlock}>
            <Text style={styles.readingLabel}>PHONE ELEVATION</Text>
            <Text style={styles.readingValue}>
              {Math.round(elevation)}°{" "}
              <Text style={styles.readingAccent}>UP</Text>
            </Text>
          </View>
        </View>

        <View style={styles.targetCard}>
          <View style={styles.targetCardHeader}>
            <View>
              <Text style={styles.targetCardEyebrow}>NUMERIC FALLBACK</Text>
              <Text style={styles.targetCardTitle}>Target bearings</Text>
            </View>
            <View style={styles.sensorBadge}>
              <View
                style={[
                  styles.sensorBadgeDot,
                  sensorState !== "active" && styles.sensorBadgeDotMuted,
                ]}
              />
              <Text style={styles.sensorBadgeText}>{statusText}</Text>
            </View>
          </View>
          <View style={styles.targetValuesRow}>
            <View>
              <Text style={styles.targetValue}>312° NW</Text>
              <Text style={styles.targetValueLabel}>AZIMUTH</Text>
            </View>
            <View style={styles.targetValueDivider} />
            <View>
              <Text style={styles.targetValue}>48°</Text>
              <Text style={styles.targetValueLabel}>ELEVATION</Text>
            </View>
            <View style={styles.targetValueDivider} />
            <View>
              <Text style={styles.targetValue}>6 min</Text>
              <Text style={styles.targetValueLabel}>VISIBLE</Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hapticsEnabled }}
          accessibilityLabel="Alignment vibration"
          onPress={() => setHapticsEnabled((current) => !current)}
          style={({ pressed }) => [
            styles.hapticsRow,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.hapticsIconWrap}>
            <Text style={styles.hapticsIcon}>≈</Text>
          </View>
          <View style={styles.hapticsCopy}>
            <Text style={styles.hapticsTitle}>Alignment vibration</Text>
            <Text style={styles.hapticsSubtitle}>
              A single pulse when the ISS is centered
            </Text>
          </View>
          <View style={[styles.toggle, hapticsEnabled && styles.toggleOn]}>
            <View
              style={[
                styles.toggleThumb,
                hapticsEnabled && styles.toggleThumbOn,
              ]}
            />
          </View>
        </Pressable>

        <Text style={styles.footerNote}>
          Keep awareness of your surroundings. Guidance is approximate and
          refreshes as your phone moves.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#060914", flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 42 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
  star: {
    backgroundColor: "#DDF8FF",
    borderRadius: 3,
    height: 3,
    opacity: 0.45,
    position: "absolute",
    width: 3,
  },
  starOne: { left: "12%", top: "18%" },
  starTwo: { left: "87%", top: "28%" },
  starThree: { left: "70%", top: "9%" },
  starFour: { left: "25%", top: "50%" },
  starFive: { left: "91%", top: "63%" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  circleButton: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.9)",
    borderColor: "#344967",
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  backIcon: {
    color: "#F1F5FF",
    fontSize: 38,
    fontWeight: "200",
    marginTop: -5,
  },
  headerCopy: { alignItems: "center" },
  headerEyebrow: {
    color: "#A8B6CE",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.1,
  },
  headerTitle: {
    color: "#F1F5FF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  liveButton: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.9)",
    borderColor: "#344967",
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  liveDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 4,
    height: 7,
    position: "absolute",
    right: 9,
    top: 9,
    width: 7,
  },
  liveDotWaiting: { backgroundColor: "#FFD370" },
  liveIcon: {
    color: "#78E6FF",
    fontSize: 27,
    transform: [{ rotate: "-25deg" }],
  },
  intro: { paddingHorizontal: 24, paddingTop: 28 },
  targetLabel: {
    color: "#78E6FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#F1F5FF",
    fontSize: 39,
    fontWeight: "700",
    letterSpacing: -1.3,
    lineHeight: 43,
    marginTop: 12,
  },
  subtitle: {
    color: "#A8B6CE",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 340,
  },
  compassSection: {
    alignItems: "center",
    height: 390,
    justifyContent: "center",
    marginTop: 8,
  },
  compassGlow: {
    backgroundColor: "rgba(120,230,255,0.06)",
    borderRadius: 180,
    height: 360,
    position: "absolute",
    width: 360,
  },
  compassOuter: {
    alignItems: "center",
    borderColor: "#3A5273",
    borderRadius: 145,
    borderWidth: 1,
    height: 290,
    justifyContent: "center",
    width: 290,
  },
  compassMiddle: {
    alignItems: "center",
    borderColor: "rgba(120,230,255,0.26)",
    borderRadius: 105,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 210,
    justifyContent: "center",
    width: 210,
  },
  compassInner: {
    alignItems: "center",
    borderColor: "#385572",
    borderRadius: 61,
    borderWidth: 1,
    height: 122,
    justifyContent: "center",
    overflow: "hidden",
    width: 122,
  },
  crossHorizontal: {
    backgroundColor: "rgba(120,230,255,0.32)",
    height: 1,
    position: "absolute",
    width: "100%",
  },
  crossVertical: {
    backgroundColor: "rgba(120,230,255,0.32)",
    height: "100%",
    position: "absolute",
    width: 1,
  },
  centerDotOuter: {
    alignItems: "center",
    borderColor: "#78E6FF",
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  centerDot: {
    backgroundColor: "#78E6FF",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  cardinal: {
    color: "#A8B6CE",
    fontSize: 12,
    fontWeight: "700",
    position: "absolute",
  },
  north: { top: 10 },
  east: { right: 12 },
  south: { bottom: 10 },
  west: { left: 11 },
  targetOrbit: { height: 235, position: "absolute", width: 4 },
  targetMarker: {
    height: 34,
    left: -20,
    position: "absolute",
    top: -8,
    width: 44,
  },
  targetSatelliteBody: {
    backgroundColor: "#F1F5FF",
    borderRadius: 3,
    height: 22,
    left: 18,
    position: "absolute",
    top: 6,
    width: 8,
  },
  targetPanel: {
    backgroundColor: "#78E6FF",
    borderRadius: 2,
    height: 14,
    position: "absolute",
    top: 10,
    width: 15,
  },
  targetPanelLeft: { left: 0 },
  targetPanelRight: { right: 0 },
  guidanceArrowWrap: {
    alignItems: "center",
    height: 95,
    justifyContent: "flex-start",
    position: "absolute",
    width: 36,
  },
  guidanceArrow: {
    color: "#78E6FF",
    fontSize: 49,
    fontWeight: "200",
    textShadowColor: "rgba(120,230,255,0.55)",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 12,
  },
  guidanceArrowAligned: {
    color: "#7CF3C5",
    textShadowColor: "rgba(124,243,197,0.75)",
  },
  targetReadout: {
    alignItems: "center",
    backgroundColor: "rgba(11,24,42,0.92)",
    borderColor: "rgba(120,230,255,0.45)",
    borderRadius: 17,
    borderWidth: 1,
    bottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
  },
  targetReadoutLabel: {
    color: "#8091AA",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  targetReadoutValue: {
    color: "#78E6FF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  guidancePill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(22,67,83,0.7)",
    borderColor: "rgba(120,230,255,0.48)",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: -8,
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  guidancePillAligned: {
    backgroundColor: "rgba(26,83,70,0.78)",
    borderColor: "rgba(124,243,197,0.68)",
  },
  guidanceStatusDot: {
    backgroundColor: "#78E6FF",
    borderRadius: 4,
    height: 7,
    marginRight: 9,
    width: 7,
  },
  guidanceStatusDotAligned: { backgroundColor: "#7CF3C5" },
  guidanceText: { color: "#78E6FF", fontSize: 12, fontWeight: "600" },
  guidanceTextAligned: { color: "#7CF3C5" },
  readingsCard: {
    backgroundColor: "rgba(17,26,43,0.75)",
    borderColor: "#2C3D59",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 18,
    paddingVertical: 19,
  },
  readingBlock: { alignItems: "center", flex: 1 },
  readingDivider: { backgroundColor: "#2C3D59", width: 1 },
  readingLabel: {
    color: "#8091AA",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  readingValue: {
    color: "#F1F5FF",
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    marginTop: 7,
  },
  readingAccent: { color: "#78E6FF", fontSize: 12 },
  targetCard: {
    backgroundColor: "rgba(17,26,43,0.55)",
    borderColor: "#2C3D59",
    borderRadius: 22,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
  },
  targetCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  targetCardEyebrow: {
    color: "#8091AA",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  targetCardTitle: {
    color: "#F1F5FF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  sensorBadge: {
    alignItems: "center",
    backgroundColor: "rgba(120,230,255,0.08)",
    borderRadius: 12,
    flexDirection: "row",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  sensorBadgeDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 3,
    height: 6,
    marginRight: 6,
    width: 6,
  },
  sensorBadgeDotMuted: { backgroundColor: "#FFD370" },
  sensorBadgeText: { color: "#A8B6CE", fontSize: 9, fontWeight: "600" },
  targetValuesRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 19,
  },
  targetValue: { color: "#F1F5FF", fontSize: 17, fontWeight: "700" },
  targetValueLabel: {
    color: "#8091AA",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 5,
  },
  targetValueDivider: { backgroundColor: "#2C3D59", height: 36, width: 1 },
  hapticsRow: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.48)",
    borderColor: "#2C3D59",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 15,
  },
  hapticsIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(171,158,255,0.12)",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    marginRight: 11,
    width: 34,
  },
  hapticsIcon: {
    color: "#AB9EFF",
    fontSize: 22,
    transform: [{ rotate: "90deg" }],
  },
  hapticsCopy: { flex: 1 },
  hapticsTitle: { color: "#F1F5FF", fontSize: 13, fontWeight: "700" },
  hapticsSubtitle: { color: "#8091AA", fontSize: 9, marginTop: 3 },
  toggle: {
    backgroundColor: "#28354A",
    borderRadius: 15,
    height: 29,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 50,
  },
  toggleOn: { backgroundColor: "#24596E" },
  toggleThumb: {
    backgroundColor: "#8291A8",
    borderRadius: 12,
    height: 23,
    width: 23,
  },
  toggleThumbOn: { backgroundColor: "#78E6FF", marginLeft: 21 },
  sightingButton: {
    alignItems: "center",
    backgroundColor: "#78E6FF",
    borderRadius: 21,
    flexDirection: "row",
    height: 64,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 18,
  },
  cameraIcon: { color: "#061524", fontSize: 22, marginRight: 10 },
  sightingButtonText: { color: "#061524", fontSize: 16, fontWeight: "800" },
  sightingArrow: {
    color: "#061524",
    fontSize: 23,
    position: "absolute",
    right: 22,
  },
  footerNote: {
    color: "#71819B",
    fontSize: 9,
    lineHeight: 14,
    marginHorizontal: 34,
    marginTop: 15,
    textAlign: "center",
  },
});
