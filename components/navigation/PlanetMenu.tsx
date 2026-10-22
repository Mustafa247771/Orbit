import { Href, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Animated, Dimensions, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";

type MenuItem = {
  label: string;
  symbol: string;
  href: Href | null;
  match: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Home", symbol: "⌂", href: "/", match: "/" },
  { label: "Satellite details", symbol: "⌁", href: "/satellite/25544", match: "/satellite" },
  { label: "Visible passes", symbol: "◴", href: "/passes/25544", match: "/passes" },
  { label: "Sky Finder", symbol: "◎", href: "/sky-finder/25544", match: "/sky-finder" },
  { label: "New Sighting", symbol: "▣", href: "/sightings/new", match: "/sightings" },
  { label: "Launch calendar", symbol: "↑", href: "/launches", match: "/launches" },
  { label: "Community", symbol: "✧", href: null, match: "/community" },
  { label: "NASA picture", symbol: "◇", href: null, match: "/apod" },
  { label: "Spaceflight", symbol: "≋", href: null, match: "/spaceflight" },
  { label: "Achievements", symbol: "★", href: null, match: "/achievements" },
  { label: "Profile & settings", symbol: "⚙", href: null, match: "/profile" },
];

const STAGE_WIDTH = Math.min(Dimensions.get("window").width, 430);
const SATURN_SIZE = 118;
const SATURN_LEFT = STAGE_WIDTH - SATURN_SIZE + 4;
const SATURN_CENTER = { x: SATURN_LEFT + SATURN_SIZE / 2, y: SATURN_SIZE / 2 };
const STAR_POSITIONS = [
  { x: STAGE_WIDTH - 150, y: 8 },
  { x: STAGE_WIDTH - 224, y: 35 },
  { x: STAGE_WIDTH - 292, y: 82 },
  { x: STAGE_WIDTH - 343, y: 145 },
  { x: STAGE_WIDTH - 365, y: 220 },
  { x: STAGE_WIDTH - 353, y: 298 },
  { x: STAGE_WIDTH - 280, y: 143 },
  { x: STAGE_WIDTH - 231, y: 195 },
  { x: STAGE_WIDTH - 207, y: 262 },
  { x: STAGE_WIDTH - 218, y: 333 },
  { x: STAGE_WIDTH - 273, y: 389 },
];

export function PlanetMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      duration: open ? 380 : 220,
      easing: open ? Easing.out(Easing.back(1.08)) : Easing.inOut(Easing.quad),
      toValue: open ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  function openRoute(item: MenuItem) {
    if (!item.href) {
      Alert.alert(item.label, "This screen is planned and will be implemented next.");
      return;
    }
    setOpen(false);
    router.push(item.href);
  }

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {open && <Pressable accessibilityLabel="Close navigation menu" onPress={() => setOpen(false)} style={styles.dismissArea} />}

      <View pointerEvents="box-none" style={styles.menuStage}>
        <Animated.View pointerEvents="none" style={[styles.orbitArcOuter, { opacity: progress, transform: [{ scale: progress }] }]} />
        <Animated.View pointerEvents="none" style={[styles.orbitArcInner, { opacity: progress, transform: [{ scale: progress }] }]} />

        {MENU_ITEMS.map((item, index) => {
          const position = STAR_POSITIONS[index];
          const active = item.match === "/" ? pathname === "/" : pathname.startsWith(item.match);

          return (
            <Animated.View
              key={item.label}
              pointerEvents={open ? "auto" : "none"}
              style={[
                styles.starItemWrap,
                {
                  left: SATURN_CENTER.x - 34,
                  opacity: progress,
                  top: SATURN_CENTER.y,
                  transform: [
                    { translateX: Animated.multiply(progress, position.x - SATURN_CENTER.x) },
                    { translateY: Animated.multiply(progress, position.y - SATURN_CENTER.y) },
                    { scale: progress },
                  ],
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.label}`}
                accessibilityState={{ selected: active }}
                hitSlop={8}
                onPress={() => openRoute(item)}
                style={({ pressed }) => [styles.starButton, pressed && styles.pressed]}
              >
                <View style={[styles.starGlow, active && styles.starGlowActive]} />
                <Text style={[styles.starShape, active && styles.starShapeActive]}>✦</Text>
                <Text style={styles.starSymbol}>{item.symbol}</Text>
              </Pressable>
              <View style={[styles.starLabelPill, active && styles.starLabelPillActive]}>
                <Text style={[styles.starLabel, active && styles.starLabelActive]}>{item.label}</Text>
                {!item.href && <Text style={styles.soonLabel}>SOON</Text>}
              </View>
            </Animated.View>
          );
        })}

        <View pointerEvents="box-none" style={styles.saturnRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={open ? "Close Saturn menu" : "Open Saturn menu"}
            accessibilityState={{ expanded: open }}
            hitSlop={8}
            onPress={() => setOpen((current) => !current)}
            style={({ pressed }) => [styles.saturnButton, pressed && styles.pressed]}
          >
            <View style={styles.saturnGlow} />
            <Image resizeMode="contain" source={require("../../assets/images/saturn-menu.png")} style={styles.saturnImage} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0, zIndex: 100 },
  dismissArea: { backgroundColor: "rgba(2,5,13,0.68)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  menuStage: { height: 500, left: 0, position: "absolute", right: 0, top: 158 },
  orbitArcOuter: { borderBottomColor: "transparent", borderColor: "rgba(120,230,255,0.33)", borderRadius: 235, borderRightColor: "transparent", borderWidth: 1, height: 455, position: "absolute", right: -20, top: -12, transform: [{ rotate: "-5deg" }], width: 455 },
  orbitArcInner: { borderBottomColor: "transparent", borderColor: "rgba(171,158,255,0.25)", borderRadius: 170, borderRightColor: "transparent", borderStyle: "dashed", borderWidth: 1, height: 330, position: "absolute", right: 18, top: 48, width: 330 },
  saturnRow: { alignItems: "flex-end", width: "100%", zIndex: 5 },
  saturnButton: { alignItems: "center", height: SATURN_SIZE, justifyContent: "center", width: SATURN_SIZE },
  saturnGlow: { backgroundColor: "rgba(42,158,255,0.16)", borderRadius: 54, height: 108, position: "absolute", shadowColor: "#4FDBFF", shadowOffset: { height: 0, width: 0 }, shadowOpacity: 0.72, shadowRadius: 20, width: 108 },
  saturnImage: { height: SATURN_SIZE, width: SATURN_SIZE },
  starItemWrap: { alignItems: "center", position: "absolute", width: 68 },
  starButton: { alignItems: "center", height: 56, justifyContent: "center", width: 56 },
  starGlow: { backgroundColor: "rgba(171,158,255,0.2)", borderRadius: 25, height: 50, position: "absolute", shadowColor: "#AB9EFF", shadowOffset: { height: 0, width: 0 }, shadowOpacity: 0.9, shadowRadius: 14, width: 50 },
  starGlowActive: { backgroundColor: "rgba(120,230,255,0.22)", shadowColor: "#78E6FF" },
  starShape: { color: "#C5B9FF", fontSize: 51, lineHeight: 55, textShadowColor: "rgba(171,158,255,0.95)", textShadowOffset: { height: 0, width: 0 }, textShadowRadius: 10 },
  starShapeActive: { color: "#D9FAFF", textShadowColor: "#78E6FF", textShadowRadius: 14 },
  starSymbol: { color: "#07101F", fontSize: 14, fontWeight: "900", position: "absolute" },
  starLabelPill: { alignItems: "center", backgroundColor: "rgba(9,18,33,0.96)", borderColor: "#384A68", borderRadius: 10, borderWidth: 1, marginTop: -4, maxWidth: 90, minWidth: 62, paddingHorizontal: 6, paddingVertical: 4 },
  starLabelPillActive: { borderColor: "rgba(120,230,255,0.62)" },
  starLabel: { color: "#B5C1D4", fontSize: 8, fontWeight: "700", textAlign: "center" },
  starLabelActive: { color: "#78E6FF" },
  soonLabel: { color: "#71819B", fontSize: 5, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 },
  pressed: { opacity: 0.65 },
});
