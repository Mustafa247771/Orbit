import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#060914",
  surface: "#111A2B",
  cyan: "#78E6FF",
  violet: "#AB9EFF",
  text: "#F1F5FF",
  secondary: "#A8B6CE",
  line: "#2C3D59",
  green: "#7CF3C5",
};

const LOCATIONS = ["Cairo, Egypt", "Alexandria, Egypt", "New Cairo, Egypt"];

type UpcomingPassProps = {
  day: string;
  time: string;
  direction: string;
  duration: string;
  elevation: string;
  quality: "Good" | "Fair";
};

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.countdownUnit}>
      <Text style={styles.countdownValue}>{value}</Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </View>
  );
}

function PassMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function UpcomingPass({
  day,
  time,
  direction,
  duration,
  elevation,
  quality,
}: UpcomingPassProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day} at ${time}, ${duration} visible`}
      style={({ pressed }) => [styles.upcomingCard, pressed && styles.pressed]}
    >
      <View style={styles.dateTile}>
        <Text style={styles.dateTileDay}>{day}</Text>
        <Text style={styles.dateTileTime}>{time}</Text>
      </View>

      <View style={styles.upcomingCopy}>
        <View style={styles.upcomingTitleRow}>
          <Text style={styles.upcomingTitle}>International Space Station</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        <Text style={styles.upcomingDirection}>{direction}</Text>
        <View style={styles.upcomingMetaRow}>
          <Text style={styles.upcomingMeta}>{duration} visible</Text>
          <View style={styles.metaDot} />
          <Text style={styles.upcomingMeta}>{elevation} elevation</Text>
          <View style={[styles.qualityPill, quality === "Fair" && styles.qualityFair]}>
            <Text style={[styles.qualityText, quality === "Fair" && styles.qualityFairText]}>
              {quality}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function VisiblePassesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [locationIndex, setLocationIndex] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(10);
  const [countdown, setCountdown] = useState(1 * 3600 + 18 * 60 + 32);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [hours, minutes, seconds] = formatCountdown(countdown);

  return (
    <SafeAreaView style={styles.safeArea}>
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
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>VISIBLE PASSES</Text>
            <Text style={styles.headerTitle}>ISS · {id ?? "25544"}</Text>
          </View>
          <View style={styles.signalButton}>
            <View style={styles.signalDot} />
            <Text style={styles.signalIcon}>⌁</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Your sky,{`\n`}tonight.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Observing location ${LOCATIONS[locationIndex]}. Change location`}
            onPress={() => setLocationIndex((current) => (current + 1) % LOCATIONS.length)}
            style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}
          >
            <Text style={styles.locationPin}>⌾</Text>
            <Text style={styles.locationText}>{LOCATIONS[locationIndex]}</Text>
            <Text style={styles.locationChevron}>⌄</Text>
          </Pressable>
        </View>

        <LinearGradient
          colors={["#162640", "#10192C", "#0C1424"]}
          locations={[0, 0.64, 1]}
          style={styles.heroCard}
        >
          <View style={styles.orbitRingLarge} />
          <View style={styles.orbitRingSmall} />
          <View style={styles.satelliteMark}>
            <View style={styles.satelliteBody} />
            <View style={[styles.satellitePanel, styles.satellitePanelLeft]} />
            <View style={[styles.satellitePanel, styles.satellitePanelRight]} />
          </View>

          <View style={styles.heroTopRow}>
            <View style={styles.conditionPill}>
              <View style={styles.goodDot} />
              <Text style={styles.conditionText}>GOOD CONDITIONS</Text>
            </View>
            <Text style={styles.demoLabel}>PREDICTED</Text>
          </View>

          <Text style={styles.heroEyebrow}>NEXT VISIBLE PASS</Text>
          <Text style={styles.heroTime}>7:42 <Text style={styles.heroAmPm}>PM</Text></Text>
          <Text style={styles.heroDate}>Tonight · Northwest → Southeast</Text>

          <View style={styles.countdownWrap}>
            <Text style={styles.countdownHeading}>BEGINS IN</Text>
            <View style={styles.countdownRow}>
              <CountdownUnit value={hours} label="HOURS" />
              <Text style={styles.countdownColon}>:</Text>
              <CountdownUnit value={minutes} label="MIN" />
              <Text style={styles.countdownColon}>:</Text>
              <CountdownUnit value={seconds} label="SEC" />
            </View>
          </View>

          <View style={styles.metricRow}>
            <PassMetric label="VISIBLE" value="6 min" />
            <View style={styles.metricDivider} />
            <PassMetric label="MAX ELEV." value="64°" />
            <View style={styles.metricDivider} />
            <PassMetric label="CLOUDS" value="12%" />
          </View>

        </LinearGradient>

        <View style={styles.reminderCard}>
          <View style={styles.reminderTopRow}>
            <View style={styles.reminderIconWrap}>
              <Text style={styles.reminderIcon}>♢</Text>
            </View>
            <View style={styles.reminderCopy}>
              <Text style={styles.reminderTitle}>Pass reminder</Text>
              <Text style={styles.reminderSubtitle}>
                Alert me before the ISS becomes visible
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: reminderEnabled }}
              accessibilityLabel="Pass reminder"
              onPress={() => setReminderEnabled((current) => !current)}
              style={[styles.toggle, reminderEnabled && styles.toggleOn]}
            >
              <View style={[styles.toggleThumb, reminderEnabled && styles.toggleThumbOn]} />
            </Pressable>
          </View>

          {reminderEnabled && (
            <View style={styles.leadTimeRow}>
              <Text style={styles.leadTimeLabel}>REMIND ME</Text>
              {[5, 10, 20].map((minutesOption) => (
                <Pressable
                  key={minutesOption}
                  accessibilityRole="button"
                  accessibilityState={{ selected: leadMinutes === minutesOption }}
                  onPress={() => setLeadMinutes(minutesOption)}
                  style={[
                    styles.leadTimeButton,
                    leadMinutes === minutesOption && styles.leadTimeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.leadTimeText,
                      leadMinutes === minutesOption && styles.leadTimeTextActive,
                    ]}
                  >
                    {minutesOption} min
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>NEXT 7 DAYS</Text>
            <Text style={styles.sectionTitle}>Coming into view</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Pass filters">
            <Text style={styles.filterText}>Filter  ≡</Text>
          </Pressable>
        </View>

        <UpcomingPass
          day="TOMORROW"
          time="5:18 AM"
          direction="West → Northeast"
          duration="4 min"
          elevation="42°"
          quality="Good"
        />
        <UpcomingPass
          day="WED 23"
          time="8:31 PM"
          direction="Southwest → East"
          duration="3 min"
          elevation="27°"
          quality="Fair"
        />
        <UpcomingPass
          day="FRI 25"
          time="6:54 PM"
          direction="Northwest → Southeast"
          duration="5 min"
          elevation="58°"
          quality="Good"
        />

        <View style={styles.forecastNote}>
          <Text style={styles.forecastIcon}>i</Text>
          <Text style={styles.forecastText}>
            Passes are optical predictions. Clear skies improve visibility but do not guarantee a sighting.
          </Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 126 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
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
  backIcon: { color: COLORS.text, fontSize: 38, fontWeight: "200", marginTop: -5 },
  headerCopy: { alignItems: "center" },
  headerEyebrow: { color: COLORS.secondary, fontSize: 9, fontWeight: "800", letterSpacing: 2.2 },
  headerTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600", marginTop: 4 },
  signalButton: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.9)",
    borderColor: "#344967",
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  signalDot: { backgroundColor: COLORS.green, borderRadius: 4, height: 7, position: "absolute", right: 9, top: 9, width: 7 },
  signalIcon: { color: COLORS.cyan, fontSize: 27, transform: [{ rotate: "-25deg" }] },
  intro: { paddingHorizontal: 24, paddingTop: 30 },
  title: { color: COLORS.text, fontSize: 39, fontWeight: "700", letterSpacing: -1.3, lineHeight: 43 },
  locationButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(17,26,43,0.72)",
    borderColor: "#3B5271",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 17,
    minHeight: 45,
    paddingHorizontal: 14,
  },
  locationPin: { color: COLORS.cyan, fontSize: 22, marginRight: 8 },
  locationText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  locationChevron: { color: COLORS.secondary, fontSize: 15, marginLeft: 9 },
  heroCard: {
    borderColor: "#344967",
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 22,
    overflow: "hidden",
    padding: 23,
  },
  orbitRingLarge: {
    borderColor: "rgba(120,230,255,0.22)",
    borderRadius: 150,
    borderWidth: 1,
    height: 245,
    position: "absolute",
    right: -122,
    top: -90,
    transform: [{ rotate: "18deg" }],
    width: 245,
  },
  orbitRingSmall: {
    borderColor: "rgba(171,158,255,0.16)",
    borderRadius: 110,
    borderWidth: 1,
    height: 180,
    position: "absolute",
    right: -90,
    top: -58,
    width: 180,
  },
  satelliteMark: { height: 28, position: "absolute", right: 42, top: 75, transform: [{ rotate: "-22deg" }], width: 47 },
  satelliteBody: { backgroundColor: COLORS.text, borderRadius: 4, height: 18, left: 19, position: "absolute", top: 5, width: 9 },
  satellitePanel: { backgroundColor: COLORS.cyan, borderRadius: 2, height: 13, position: "absolute", top: 7, width: 15 },
  satellitePanelLeft: { left: 0 },
  satellitePanelRight: { right: 0 },
  heroTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  conditionPill: {
    alignItems: "center",
    backgroundColor: "rgba(22,82,82,0.55)",
    borderColor: "rgba(120,230,255,0.45)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goodDot: { backgroundColor: COLORS.green, borderRadius: 4, height: 7, marginRight: 7, width: 7 },
  conditionText: { color: COLORS.cyan, fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  demoLabel: { color: COLORS.secondary, fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
  heroEyebrow: { color: COLORS.secondary, fontSize: 11, fontWeight: "700", letterSpacing: 1.8, marginTop: 30 },
  heroTime: { color: COLORS.text, fontSize: 52, fontWeight: "600", letterSpacing: -2, marginTop: 7 },
  heroAmPm: { color: COLORS.secondary, fontSize: 19, letterSpacing: 0 },
  heroDate: { color: COLORS.secondary, fontSize: 14, marginTop: 2 },
  countdownWrap: {
    backgroundColor: "rgba(6,9,20,0.38)",
    borderColor: "rgba(64,86,117,0.55)",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  countdownHeading: { color: COLORS.secondary, fontSize: 9, fontWeight: "800", letterSpacing: 1.6, textAlign: "center" },
  countdownRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "center", marginTop: 8 },
  countdownUnit: { alignItems: "center", minWidth: 52 },
  countdownValue: { color: COLORS.text, fontSize: 26, fontVariant: ["tabular-nums"], fontWeight: "600" },
  countdownLabel: { color: "#7688A3", fontSize: 7, fontWeight: "700", letterSpacing: 1.2, marginTop: 2 },
  countdownColon: { color: COLORS.cyan, fontSize: 22, marginHorizontal: 3, marginTop: 2 },
  metricRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 23 },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  metricLabel: { color: COLORS.secondary, fontSize: 8, fontWeight: "700", letterSpacing: 1.3, marginTop: 6 },
  metricDivider: { backgroundColor: COLORS.line, height: 35, width: 1 },
  skyFinderButton: {
    alignItems: "center",
    backgroundColor: COLORS.cyan,
    borderRadius: 20,
    flexDirection: "row",
    height: 62,
    justifyContent: "center",
    marginTop: 23,
  },
  skyFinderIcon: { color: "#061524", fontSize: 23, marginRight: 10 },
  skyFinderText: { color: "#061524", fontSize: 16, fontWeight: "800" },
  skyFinderArrow: { color: "#061524", fontSize: 23, position: "absolute", right: 22 },
  reminderCard: {
    backgroundColor: "rgba(17,26,43,0.68)",
    borderColor: COLORS.line,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
  },
  reminderTopRow: { alignItems: "center", flexDirection: "row" },
  reminderIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(171,158,255,0.12)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: 11,
    width: 36,
  },
  reminderIcon: { color: COLORS.violet, fontSize: 23 },
  reminderCopy: { flex: 1 },
  reminderTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  reminderSubtitle: { color: COLORS.secondary, fontSize: 10, marginTop: 3 },
  toggle: { backgroundColor: "#28354A", borderRadius: 16, height: 30, justifyContent: "center", paddingHorizontal: 3, width: 52 },
  toggleOn: { backgroundColor: "#24596E" },
  toggleThumb: { backgroundColor: "#8291A8", borderRadius: 12, height: 24, width: 24 },
  toggleThumbOn: { backgroundColor: COLORS.cyan, marginLeft: 22 },
  leadTimeRow: { alignItems: "center", borderTopColor: COLORS.line, borderTopWidth: 1, flexDirection: "row", marginTop: 16, paddingTop: 15 },
  leadTimeLabel: { color: COLORS.secondary, flex: 1, fontSize: 8, fontWeight: "800", letterSpacing: 1.3 },
  leadTimeButton: { borderColor: COLORS.line, borderRadius: 14, borderWidth: 1, marginLeft: 7, paddingHorizontal: 10, paddingVertical: 7 },
  leadTimeButtonActive: { backgroundColor: "rgba(120,230,255,0.14)", borderColor: COLORS.cyan },
  leadTimeText: { color: COLORS.secondary, fontSize: 10, fontWeight: "600" },
  leadTimeTextActive: { color: COLORS.cyan },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginHorizontal: 22, marginTop: 31 },
  sectionEyebrow: { color: COLORS.cyan, fontSize: 9, fontWeight: "800", letterSpacing: 1.7 },
  sectionTitle: { color: COLORS.text, fontSize: 24, fontWeight: "700", marginTop: 5 },
  filterText: { color: COLORS.cyan, fontSize: 12, fontWeight: "600" },
  upcomingCard: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.48)",
    borderColor: COLORS.line,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
  },
  dateTile: { alignItems: "center", backgroundColor: "#152238", borderColor: "#354967", borderRadius: 15, borderWidth: 1, justifyContent: "center", minHeight: 66, paddingHorizontal: 10, width: 78 },
  dateTileDay: { color: COLORS.cyan, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  dateTileTime: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginTop: 6 },
  upcomingCopy: { flex: 1, marginLeft: 14 },
  upcomingTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  upcomingTitle: { color: COLORS.text, flex: 1, fontSize: 13, fontWeight: "700" },
  chevron: { color: COLORS.cyan, fontSize: 25, marginLeft: 5 },
  upcomingDirection: { color: COLORS.secondary, fontSize: 10, marginTop: 4 },
  upcomingMetaRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", marginTop: 9 },
  upcomingMeta: { color: "#8FA0B8", fontSize: 9 },
  metaDot: { backgroundColor: "#596A82", borderRadius: 2, height: 3, marginHorizontal: 6, width: 3 },
  qualityPill: { backgroundColor: "rgba(124,243,197,0.12)", borderRadius: 10, marginLeft: 8, paddingHorizontal: 7, paddingVertical: 3 },
  qualityFair: { backgroundColor: "rgba(255,211,112,0.12)" },
  qualityText: { color: COLORS.green, fontSize: 8, fontWeight: "700" },
  qualityFairText: { color: "#FFD370" },
  forecastNote: { alignItems: "flex-start", flexDirection: "row", marginHorizontal: 28, marginTop: 20 },
  forecastIcon: { borderColor: "#52647E", borderRadius: 9, borderWidth: 1, color: COLORS.secondary, fontSize: 10, height: 18, lineHeight: 16, marginRight: 9, textAlign: "center", width: 18 },
  forecastText: { color: "#7889A3", flex: 1, fontSize: 10, lineHeight: 15 },
});
