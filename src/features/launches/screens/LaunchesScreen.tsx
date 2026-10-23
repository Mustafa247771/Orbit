import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PointerEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Launch } from "@/features/launches/model/Launch";
import {
  launchCountdown,
  useLaunchCalendarViewModel,
} from "@/features/launches/viewmodels/useLaunchCalendarViewModel";

function Countdown({ launch, now }: { launch: Launch; now: number }) {
  const countdown = launchCountdown(launch.net, now);
  return (
    <View style={styles.countdownRow}>
      {[
        [countdown.days, "DAYS"],
        [countdown.hours, "HRS"],
        [countdown.minutes, "MIN"],
        [countdown.seconds, "SEC"],
      ].map(([value, label], index) => (
        <View key={label} style={styles.countdownUnit}>
          {index > 0 && <Text style={styles.countdownColon}>:</Text>}
          <Text style={styles.countdownValue}>
            {String(value).padStart(2, "0")}
          </Text>
          <Text style={styles.countdownLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function LaunchCard({ launch, now }: { launch: Launch; now: number }) {
  const countdown = launchCountdown(launch.net, now);
  const date = new Date(launch.net);
  return (
    <View style={styles.launchCard}>
      <View style={styles.dateTile}>
        <Text style={styles.dateMonth}>
          {date.toLocaleDateString([], { month: "short" }).toUpperCase()}
        </Text>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
        <Text style={styles.dateTime}>
          {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </Text>
      </View>
      <View style={styles.launchCardBody}>
        <View style={styles.cardTopRow}>
          <Text numberOfLines={1} style={styles.provider}>
            {launch.provider}
          </Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {launch.statusAbbreviation}
            </Text>
          </View>
        </View>
        <Text numberOfLines={2} style={styles.launchName}>
          {launch.name}
        </Text>
        <Text numberOfLines={1} style={styles.launchLocation}>
          ⌖ {launch.location}
        </Text>
        <Text style={styles.cardCountdown}>
          T− {countdown.days}d {String(countdown.hours).padStart(2, "0")}h{" "}
          {String(countdown.minutes).padStart(2, "0")}m
        </Text>
      </View>
    </View>
  );
}

export default function LaunchCalendarScreen() {
  const viewModel = useLaunchCalendarViewModel();
  const featured = viewModel.featuredLaunch;
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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={viewModel.refresh}
            refreshing={viewModel.refreshing}
            tintColor="#78E6FF"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.circleButton}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MISSION CONTROL</Text>
            <Text style={styles.headerTitle}>Launch calendar</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh launches"
            accessibilityRole="button"
            onPress={viewModel.refresh}
            style={styles.circleButton}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>The next{`\n`}ignition.</Text>
          <View style={styles.dataStatus}>
            <View
              style={[
                styles.liveDot,
                viewModel.source === "cache" && styles.cacheDot,
              ]}
            />
            <Text style={styles.dataStatusText}>
              {viewModel.source === "live"
                ? "LIVE LAUNCH DATA"
                : "CACHED LAUNCH DATA"}
            </Text>
          </View>
        </View>

        {viewModel.loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#78E6FF" size="large" />
            <Text style={styles.loadingText}>Contacting launch control…</Text>
          </View>
        ) : featured ? (
          <View style={styles.heroCard}>
            {featured.imageUrl ? (
              <Image
                resizeMode="cover"
                source={{ uri: featured.imageUrl }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={styles.fallbackSky} />
            )}
            <LinearGradient
              colors={["rgba(4,8,18,0.08)", "rgba(6,9,20,0.82)", "#08101E"]}
              locations={[0, 0.52, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroOrbit} />
            <View style={styles.heroTopRow}>
              <View style={styles.goPill}>
                <View style={styles.goDot} />
                <Text style={styles.goText}>
                  {featured.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.heroProvider}>{featured.provider}</Text>
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>NEXT SCHEDULED LAUNCH</Text>
              <Text numberOfLines={3} style={styles.heroTitle}>
                {featured.name}
              </Text>
              <Text style={styles.heroMeta}>
                {featured.rocket} · {featured.location}
              </Text>
              <Countdown launch={featured} now={viewModel.now} />
              <View style={styles.heroDivider} />
              <View style={styles.windowRow}>
                <View>
                  <Text style={styles.windowLabel}>TARGET TIME</Text>
                  <Text style={styles.windowValue}>
                    {new Date(featured.net).toLocaleString([], {
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </View>
                <View style={styles.windowRight}>
                  <Text style={styles.windowLabel}>MISSION</Text>
                  <Text numberOfLines={1} style={styles.windowValue}>
                    {featured.missionType}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Launch data unavailable</Text>
            <Text style={styles.errorText}>{viewModel.error}</Text>
            <Pressable onPress={viewModel.refresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {viewModel.error && featured && (
          <Text style={styles.inlineNotice}>
            Showing saved launch data · Pull down to retry
          </Text>
        )}

        {viewModel.launches.length > 1 && (
          <View style={styles.scheduleSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionLabel}>UPCOMING MISSIONS</Text>
              <Text style={styles.sectionCount}>
                {viewModel.launches.length - 1} scheduled
              </Text>
            </View>
            {viewModel.launches.slice(1).map((launch) => (
              <LaunchCard key={launch.id} launch={launch} now={viewModel.now} />
            ))}
          </View>
        )}

        <Text style={styles.attribution}>
          Launch data provided by The Space Devs · Times shown in your local
          timezone
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "transparent", flex: 1 },
  screen: { flex: 1 },
  content: { paddingBottom: 130 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  circleButton: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.92)",
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
  refreshIcon: { color: "#78E6FF", fontSize: 25 },
  headerCopy: { alignItems: "center" },
  eyebrow: {
    color: "#A8B6CE",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  headerTitle: {
    color: "#F1F5FF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  intro: { paddingHorizontal: 24, paddingTop: 28 },
  title: {
    color: "#F1F5FF",
    fontSize: 43,
    fontWeight: "700",
    letterSpacing: -1.5,
    lineHeight: 45,
  },
  dataStatus: { alignItems: "center", flexDirection: "row", marginTop: 15 },
  liveDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 4,
    height: 7,
    marginRight: 8,
    width: 7,
  },
  cacheDot: { backgroundColor: "#FFD370" },
  dataStatusText: {
    color: "#78E6FF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: "#101A2C",
    borderColor: "#2C3D59",
    borderRadius: 28,
    borderWidth: 1,
    height: 390,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },
  loadingText: { color: "#A8B6CE", fontSize: 12, marginTop: 15 },
  heroCard: {
    borderColor: "#304866",
    borderRadius: 30,
    borderWidth: 1,
    height: 500,
    marginHorizontal: 20,
    marginTop: 24,
    overflow: "hidden",
  },
  fallbackSky: { backgroundColor: "#122D55", flex: 1 },
  heroOrbit: {
    borderColor: "rgba(120,230,255,0.35)",
    borderRadius: 160,
    borderWidth: 1,
    height: 250,
    position: "absolute",
    right: -100,
    top: 60,
    transform: [{ rotate: "-28deg" }],
    width: 320,
  },
  heroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  goPill: {
    alignItems: "center",
    backgroundColor: "rgba(7,29,35,0.86)",
    borderColor: "rgba(124,243,197,0.5)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  goDot: {
    backgroundColor: "#7CF3C5",
    borderRadius: 3,
    height: 6,
    marginRight: 7,
    width: 6,
  },
  goText: {
    color: "#7CF3C5",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroProvider: {
    color: "#D7E2F5",
    fontSize: 9,
    fontWeight: "700",
    maxWidth: 145,
    textAlign: "right",
  },
  heroContent: { marginTop: "auto", padding: 22 },
  heroEyebrow: {
    color: "#A8B6CE",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  heroTitle: {
    color: "#F1F5FF",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 31,
    marginTop: 8,
  },
  heroMeta: { color: "#A8B6CE", fontSize: 10, marginTop: 9 },
  countdownRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: 19,
  },
  countdownUnit: { alignItems: "center", minWidth: 60, position: "relative" },
  countdownColon: {
    color: "#78E6FF",
    fontSize: 24,
    left: -4,
    position: "absolute",
    top: 1,
  },
  countdownValue: {
    color: "#F1F5FF",
    fontSize: 27,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  countdownLabel: {
    color: "#71819B",
    fontSize: 6,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  heroDivider: { backgroundColor: "#30435F", height: 1, marginTop: 20 },
  windowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  windowRight: { alignItems: "flex-end", maxWidth: "48%" },
  windowLabel: {
    color: "#71819B",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  windowValue: {
    color: "#D7E2F5",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 5,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#111A2B",
    borderColor: "#394B67",
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 28,
  },
  errorTitle: { color: "#F1F5FF", fontSize: 18, fontWeight: "700" },
  errorText: {
    color: "#A8B6CE",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#78E6FF",
    borderRadius: 17,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  retryText: { color: "#061524", fontSize: 11, fontWeight: "800" },
  inlineNotice: {
    color: "#FFD370",
    fontSize: 9,
    marginHorizontal: 24,
    marginTop: 12,
    textAlign: "center",
  },
  scheduleSection: { marginTop: 28, paddingHorizontal: 20 },
  sectionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#A8B6CE",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  sectionCount: { color: "#71819B", fontSize: 9 },
  launchCard: {
    backgroundColor: "rgba(17,26,43,0.76)",
    borderColor: "#2C3D59",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 11,
    minHeight: 128,
    overflow: "hidden",
  },
  dateTile: {
    alignItems: "center",
    backgroundColor: "rgba(26,48,78,0.9)",
    justifyContent: "center",
    width: 82,
  },
  dateMonth: {
    color: "#78E6FF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  dateDay: { color: "#F1F5FF", fontSize: 30, fontWeight: "700", marginTop: 2 },
  dateTime: { color: "#A8B6CE", fontSize: 8, marginTop: 3 },
  launchCardBody: { flex: 1, padding: 14 },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  provider: {
    color: "#8091AA",
    flex: 1,
    fontSize: 8,
    fontWeight: "700",
    marginRight: 8,
    textTransform: "uppercase",
  },
  statusPill: {
    backgroundColor: "rgba(124,243,197,0.09)",
    borderColor: "rgba(124,243,197,0.3)",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusPillText: { color: "#7CF3C5", fontSize: 6, fontWeight: "900" },
  launchName: {
    color: "#F1F5FF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 7,
  },
  launchLocation: { color: "#8091AA", fontSize: 8, marginTop: 6 },
  cardCountdown: {
    color: "#78E6FF",
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    marginTop: 8,
  },
  attribution: {
    color: "#5F6D83",
    fontSize: 8,
    lineHeight: 13,
    marginHorizontal: 40,
    marginTop: 20,
    textAlign: "center",
  },
  starField: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
