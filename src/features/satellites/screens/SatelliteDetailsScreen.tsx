import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import { SatelliteScene } from "@/features/satellites/components/SatelliteScene";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PointerEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const COLORS = {
  background: "transparent",
  surface: "#111A2B",
  cyan: "#78E6FF",
  violet: "#AB9EFF",
  text: "#F1F5FF",
  secondary: "#A8B6CE",
  line: "#2C3D59",
};

function TelemetryItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.telemetryItem}>
      <Text style={styles.telemetryLabel}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.telemetryValue}>{value}</Text>
        <Text style={styles.telemetryUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export default function SatelliteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [paused, setPaused] = useState(false);
  const rotation = useRef({ x: 0.22, y: -0.5 });
  const dragStart = useRef({ pageX: 0, pageY: 0, rotationX: 0, rotationY: 0 });
  const screenSize = useRef({ height: 1, width: 1 });

  const starPointer = useRef<StarPointer>({
    active: false,
    x: 0.5,
    y: 0.5,
  });

  function trackStars(event: GestureResponderEvent | PointerEvent) {
    const { pageX, pageY } = event.nativeEvent;

    starPointer.current = {
      active: true,
      x: Math.max(0, Math.min(1, pageX / screenSize.current.width)),
      y: Math.max(0, Math.min(1, pageY / screenSize.current.height)),
    };
  }

  function releaseStars() {
    starPointer.current.active = false;
  }

  function measureScreen(event: LayoutChangeEvent) {
    screenSize.current = event.nativeEvent.layout;
  }
  return (
    <SafeAreaView
      onLayout={measureScreen}
      onPointerLeave={releaseStars}
      onPointerMove={trackStars}
      onTouchEnd={releaseStars}
      onTouchMove={trackStars}
      onTouchStart={trackStars}
      style={styles.safeArea}
    >
      <View pointerEvents="none" style={styles.starField}>
        <InteractiveStarField pointer={starPointer} />
      </View>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.screen}
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

          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>ORBITAL OBJECT</Text>
            <Text style={styles.headerTitle}>Satellite details</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add ISS to tracked objects"
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.trackIcon}>＋</Text>
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE TELEMETRY</Text>
          </View>
          <Text style={styles.title}>International{`\n`}Space Station</Text>
          <Text style={styles.subtitle}>ISS · NORAD {id ?? "25544"}</Text>
        </View>

        <View
          style={styles.sceneFrame}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            dragStart.current = {
              pageX: event.nativeEvent.pageX,
              pageY: event.nativeEvent.pageY,
              rotationX: rotation.current.x,
              rotationY: rotation.current.y,
            };
          }}
          onResponderMove={(event) => {
            const deltaX = event.nativeEvent.pageX - dragStart.current.pageX;
            const deltaY = event.nativeEvent.pageY - dragStart.current.pageY;
            rotation.current.y = dragStart.current.rotationY + deltaX * 0.009;
            rotation.current.x = Math.max(
              -0.8,
              Math.min(0.8, dragStart.current.rotationX + deltaY * 0.007),
            );
          }}
        >
          <SatelliteScene rotation={rotation} paused={paused} />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(6,9,20,0)", "rgba(6,9,20,0.88)"]}
            locations={[0.56, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.sceneTopRow} pointerEvents="box-none">
            <View style={styles.scenePill}>
              <Text style={styles.scenePillText}>3D ORBIT VIEW</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                paused ? "Resume 3D rotation" : "Pause 3D rotation"
              }
              onPress={() => setPaused((current) => !current)}
              style={({ pressed }) => [
                styles.pauseButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.pauseIcon}>{paused ? "▶" : "Ⅱ"}</Text>
            </Pressable>
          </View>

          <View style={styles.sceneHint} pointerEvents="none">
            <View style={styles.dragGlyph}>
              <Text style={styles.dragGlyphText}>↔</Text>
            </View>
            <Text style={styles.sceneHintText}>Drag to rotate</Text>
          </View>
        </View>

        <LinearGradient
          colors={["rgba(25,42,68,0.96)", "rgba(13,22,39,0.98)"]}
          style={styles.telemetryCard}
        >
          <View style={styles.cardHeadingRow}>
            <View>
              <Text style={styles.cardEyebrow}>CURRENT FLIGHT</Text>
              <Text style={styles.cardTitle}>Moving above the horizon</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>FRESH</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <TelemetryItem label="ALTITUDE" value="420" unit="km" />
            <TelemetryItem label="SPEED" value="27.6" unit="k km/h" />
            <TelemetryItem label="VISIBILITY" value="6" unit="min" />
          </View>

          <View style={styles.divider} />
          <DataRow label="Latitude" value="23.416° N" />
          <DataRow label="Longitude" value="31.235° E" />
          <DataRow label="Last updated" value="8 seconds ago" />
        </LinearGradient>

        <View style={styles.passCard}>
          <View style={styles.orbitDecoration} />
          <Text style={styles.cardEyebrow}>NEXT VISIBLE PASS · CAIRO</Text>
          <View style={styles.passMainRow}>
            <View>
              <Text style={styles.passTime}>
                7:42 <Text style={styles.passAmPm}>PM</Text>
              </Text>
              <Text style={styles.passDate}>
                Tonight · Northwest → Southeast
              </Text>
            </View>
            <View style={styles.elevationWrap}>
              <Text style={styles.elevationValue}>64°</Text>
              <Text style={styles.elevationLabel}>MAX ELEV.</Text>
            </View>
          </View>

          <View style={styles.conditionRow}>
            <View style={styles.conditionPill}>
              <View style={styles.goodDot} />
              <Text style={styles.conditionText}>Good conditions</Text>
            </View>
            <Text style={styles.cloudText}>12% cloud cover</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enable pass notifications for the ISS"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryIcon}>♢</Text>
          <View style={styles.secondaryCopy}>
            <Text style={styles.secondaryTitle}>Notify me when it passes</Text>
            <Text style={styles.secondarySubtitle}>
              Current and saved locations
            </Text>
          </View>
          <View style={styles.toggleTrack}>
            <View style={styles.toggleThumb} />
          </View>
        </Pressable>

        <Text style={styles.disclaimer}>
          Position and pass information are illustrative until the tracking
          provider is connected.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  starField: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 126 },
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
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  backIcon: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: "200",
    marginTop: -5,
  },
  trackIcon: { color: COLORS.cyan, fontSize: 27, fontWeight: "300" },
  headerTitleWrap: { alignItems: "center" },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 3,
  },
  titleBlock: { paddingHorizontal: 26, paddingTop: 30, zIndex: 2 },
  livePill: { alignItems: "center", flexDirection: "row", marginBottom: 13 },
  liveDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 4,
    height: 7,
    marginRight: 8,
    width: 7,
  },
  liveText: {
    color: "#7CF3C5",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  title: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1.35,
    lineHeight: 42,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 14,
    letterSpacing: 0.4,
    marginTop: 10,
  },
  sceneFrame: { height: 380, marginTop: -15, overflow: "hidden" },
  sceneTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: 24,
    position: "absolute",
    right: 24,
    top: 35,
  },
  scenePill: {
    backgroundColor: "rgba(10,18,32,0.75)",
    borderColor: "rgba(120,230,255,0.35)",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  scenePillText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "rgba(10,18,32,0.78)",
    borderColor: "#344967",
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  pauseIcon: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  sceneHint: {
    alignItems: "center",
    bottom: 23,
    flexDirection: "row",
    left: 28,
    position: "absolute",
  },
  dragGlyph: {
    alignItems: "center",
    borderColor: "rgba(120,230,255,0.45)",
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    marginRight: 9,
    width: 28,
  },
  dragGlyphText: { color: COLORS.cyan, fontSize: 15 },
  sceneHintText: { color: COLORS.secondary, fontSize: 12 },
  telemetryCard: {
    borderColor: "#30435F",
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: -14,
    overflow: "hidden",
    padding: 24,
  },
  cardHeadingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardEyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 7,
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: "rgba(31,78,76,0.44)",
    borderColor: "rgba(124,243,197,0.35)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 3,
    height: 6,
    marginRight: 6,
    width: 6,
  },
  statusText: {
    color: "#7CF3C5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  telemetryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  telemetryItem: { width: "31%" },
  telemetryLabel: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  valueRow: { alignItems: "baseline", flexDirection: "row", marginTop: 6 },
  telemetryValue: { color: COLORS.text, fontSize: 25, fontWeight: "700" },
  telemetryUnit: { color: COLORS.secondary, fontSize: 10, marginLeft: 4 },
  divider: { backgroundColor: COLORS.line, height: 1, marginVertical: 20 },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  dataLabel: { color: COLORS.secondary, fontSize: 13 },
  dataValue: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  passCard: {
    backgroundColor: "rgba(17,26,43,0.74)",
    borderColor: "#2C3D59",
    borderRadius: 25,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 18,
    overflow: "hidden",
    padding: 23,
  },
  orbitDecoration: {
    borderColor: "rgba(120,230,255,0.18)",
    borderRadius: 100,
    borderWidth: 1,
    height: 165,
    position: "absolute",
    right: -75,
    top: -74,
    width: 165,
  },
  passMainRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  passTime: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: "600",
    letterSpacing: -1,
  },
  passAmPm: { color: COLORS.secondary, fontSize: 15 },
  passDate: { color: COLORS.secondary, fontSize: 12, marginTop: 5 },
  elevationWrap: { alignItems: "flex-end" },
  elevationValue: { color: COLORS.cyan, fontSize: 25, fontWeight: "700" },
  elevationLabel: {
    color: COLORS.secondary,
    fontSize: 8,
    letterSpacing: 1.3,
    marginTop: 3,
  },
  conditionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  conditionPill: {
    alignItems: "center",
    backgroundColor: "rgba(20,75,83,0.45)",
    borderColor: "rgba(120,230,255,0.42)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  goodDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 3,
    height: 6,
    marginRight: 7,
    width: 6,
  },
  conditionText: { color: COLORS.cyan, fontSize: 11, fontWeight: "600" },
  cloudText: { color: COLORS.secondary, fontSize: 11 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.cyan,
    borderRadius: 21,
    flexDirection: "row",
    height: 66,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 18,
  },
  primaryButtonIcon: { color: "#062238", fontSize: 20, marginRight: 10 },
  primaryButtonText: { color: "#061524", fontSize: 16, fontWeight: "800" },
  primaryButtonArrow: {
    color: "#061524",
    fontSize: 24,
    position: "absolute",
    right: 24,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.68)",
    borderColor: COLORS.line,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 17,
  },
  secondaryIcon: { color: COLORS.violet, fontSize: 27, marginRight: 12 },
  secondaryCopy: { flex: 1 },
  secondaryTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  secondarySubtitle: { color: COLORS.secondary, fontSize: 11, marginTop: 3 },
  toggleTrack: {
    backgroundColor: "#264258",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 48,
  },
  toggleThumb: {
    backgroundColor: COLORS.cyan,
    borderRadius: 11,
    height: 22,
    marginLeft: 20,
    width: 22,
  },
  disclaimer: {
    color: "#71819B",
    fontSize: 10,
    lineHeight: 15,
    marginHorizontal: 34,
    marginTop: 17,
    textAlign: "center",
  },
});
