import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import { useNewSightingViewModel } from "@/features/sightings/viewmodels/useNewSightingViewModel";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PointerEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function NewSightingScreen() {
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
  const viewModel = useNewSightingViewModel();

  async function saveSighting() {
    const saved = await viewModel.save();
    if (!saved) return;
    Alert.alert(
      "Sighting saved",
      saved.syncStatus === "pending-upload"
        ? "Saved safely on this device and queued for community upload."
        : "Saved safely in your private observation journal.",
    );
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.headerEyebrow}>OBSERVATION JOURNAL</Text>
            <Text style={styles.headerTitle}>New sighting</Text>
          </View>
          <View style={styles.draftBadge}>
            <View style={styles.draftDot} />
            <Text style={styles.draftText}>
              {viewModel.busyAction === "save" ? "SAVING" : "DRAFT"}
            </Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Keep the{`\n`}moment.</Text>
          <Text style={styles.subtitle}>
            A streak of light, a precise time and your own view of the sky.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            viewModel.photoUri
              ? "Change sighting photo"
              : "Choose a sighting photo"
          }
          onPress={viewModel.choosePhoto}
          style={({ pressed }) => [
            styles.photoFrame,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={
              viewModel.photoUri
                ? ["#1D3155", "#0B1426"]
                : ["#111A2B", "#0A101D"]
            }
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.photoStarOne} />
          <View style={styles.photoStarTwo} />
          <View style={styles.photoStarThree} />
          {viewModel.photoUri ? (
            <>
              <Image
                resizeMode="cover"
                source={{ uri: viewModel.photoUri }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["transparent", "rgba(2,8,18,0.7)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.photoStatus}>
                <Text style={styles.photoStatusIcon}>✓</Text>
                <Text style={styles.photoStatusText}>
                  Sighting photo selected
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyPhoto}>
              <View style={styles.cameraCircle}>
                <Text style={styles.cameraGlyph}>▣</Text>
              </View>
              <Text style={styles.emptyPhotoTitle}>Add a view of the sky</Text>
              <Text style={styles.emptyPhotoSubtitle}>
                Take a photo or choose one from your library
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.photoActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture photo"
            disabled={viewModel.busyAction !== null}
            onPress={viewModel.takePhoto}
            style={({ pressed }) => [
              styles.photoAction,
              pressed && styles.pressed,
            ]}
          >
            {viewModel.busyAction === "camera" ? (
              <ActivityIndicator color="#78E6FF" />
            ) : (
              <Text style={styles.photoActionIcon}>◉</Text>
            )}
            <Text style={styles.photoActionText}>
              {viewModel.busyAction === "camera" ? "Opening…" : "Take photo"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose photo from library"
            disabled={viewModel.busyAction !== null}
            onPress={viewModel.choosePhoto}
            style={({ pressed }) => [
              styles.photoAction,
              pressed && styles.pressed,
            ]}
          >
            {viewModel.busyAction === "library" ? (
              <ActivityIndicator color="#78E6FF" />
            ) : (
              <Text style={styles.photoActionIcon}>▧</Text>
            )}
            <Text style={styles.photoActionText}>
              {viewModel.busyAction === "library" ? "Opening…" : "Choose photo"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR OBSERVATION</Text>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="Observation caption"
              multiline
              maxLength={240}
              onChangeText={viewModel.setCaption}
              placeholder="What did you notice?"
              placeholderTextColor="#65748D"
              style={styles.input}
              textAlignVertical="top"
              value={viewModel.caption}
            />
            <Text style={styles.characterCount}>
              {viewModel.caption.length}/240
            </Text>
          </View>
        </View>

        <View style={styles.metadataCard}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataIconWrap}>
              <Text style={styles.metadataIcon}>⌁</Text>
            </View>
            <View style={styles.metadataCopy}>
              <Text style={styles.metadataLabel}>OBJECT</Text>
              <Text style={styles.metadataValue}>{viewModel.object.name}</Text>
            </View>
            <Text style={styles.metadataChevron}>›</Text>
          </View>
          <View style={styles.metadataDivider} />
          <View style={styles.metadataRow}>
            <View style={styles.metadataIconWrap}>
              <Text style={styles.metadataIcon}>◷</Text>
            </View>
            <View style={styles.metadataCopy}>
              <Text style={styles.metadataLabel}>OBSERVED</Text>
              <Text style={styles.metadataValue}>
                {viewModel.observedLabel}
              </Text>
            </View>
            <Text style={styles.metadataChevron}>›</Text>
          </View>
          <View style={styles.metadataDivider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach current location"
            disabled={viewModel.busyAction !== null}
            onPress={viewModel.useCurrentLocation}
            style={({ pressed }) => [
              styles.metadataRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.metadataIconWrap}>
              <Text style={styles.metadataIcon}>⌾</Text>
            </View>
            <View style={styles.metadataCopy}>
              <Text style={styles.metadataLabel}>LOCATION</Text>
              <Text style={styles.metadataValue}>
                {viewModel.location?.cityLabel ?? "Use current location"}
              </Text>
              <Text style={styles.metadataNote}>
                {viewModel.location
                  ? "Precise coordinates stay private"
                  : "Tap to attach GPS coordinates"}
              </Text>
            </View>
            {viewModel.busyAction === "location" ? (
              <ActivityIndicator color="#78E6FF" />
            ) : (
              <Text style={styles.metadataChevron}>›</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VISIBILITY</Text>
          <View style={styles.visibilitySelector}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: viewModel.visibility === "private",
              }}
              onPress={() => viewModel.setVisibility("private")}
              style={[
                styles.visibilityOption,
                viewModel.visibility === "private" &&
                  styles.visibilityOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.visibilityIcon,
                  viewModel.visibility === "private" &&
                    styles.visibilityTextActive,
                ]}
              >
                ◉
              </Text>
              <View>
                <Text
                  style={[
                    styles.visibilityTitle,
                    viewModel.visibility === "private" &&
                      styles.visibilityTextActive,
                  ]}
                >
                  Private
                </Text>
                <Text style={styles.visibilitySubtitle}>
                  Only in my journal
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: viewModel.visibility === "community",
              }}
              onPress={() => viewModel.setVisibility("community")}
              style={[
                styles.visibilityOption,
                viewModel.visibility === "community" &&
                  styles.visibilityOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.visibilityIcon,
                  viewModel.visibility === "community" &&
                    styles.visibilityTextActive,
                ]}
              >
                ✦
              </Text>
              <View>
                <Text
                  style={[
                    styles.visibilityTitle,
                    viewModel.visibility === "community" &&
                      styles.visibilityTextActive,
                  ]}
                >
                  Community
                </Text>
                <Text style={styles.visibilitySubtitle}>
                  Share city-level location
                </Text>
              </View>
            </Pressable>
          </View>
          {viewModel.visibility === "community" && (
            <View style={styles.privacyNotice}>
              <Text style={styles.privacyNoticeIcon}>✓</Text>
              <Text style={styles.privacyNoticeText}>
                Exact GPS and photo metadata will be removed before publishing.
              </Text>
            </View>
          )}
        </View>

        {viewModel.error && (
          <View accessibilityRole="alert" style={styles.errorNotice}>
            <Text style={styles.errorNoticeText}>{viewModel.error}</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save sighting"
          disabled={viewModel.busyAction !== null}
          onPress={saveSighting}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          {viewModel.busyAction === "save" ? (
            <ActivityIndicator color="#061524" />
          ) : (
            <Text style={styles.saveIcon}>✓</Text>
          )}
          <Text style={styles.saveText}>
            {viewModel.busyAction === "save" ? "Saving…" : "Save sighting"}
          </Text>
        </Pressable>

        <Text style={styles.footerNote}>
          Photos and sightings are saved offline on this device. Community posts
          are queued until a backend is connected.
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
  safeArea: { backgroundColor: "transparent", flex: 1 },
  scroll: { flex: 1 },
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
  backIcon: {
    color: "#F1F5FF",
    fontSize: 38,
    fontWeight: "200",
    marginTop: -5,
  },
  headerCopy: { alignItems: "center" },
  headerEyebrow: {
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
  draftBadge: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.9)",
    borderColor: "#344967",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  draftDot: {
    backgroundColor: "#FFD370",
    borderRadius: 3,
    height: 6,
    marginRight: 6,
    width: 6,
  },
  draftText: {
    color: "#FFD370",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  intro: { paddingHorizontal: 24, paddingTop: 28 },
  title: {
    color: "#F1F5FF",
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1.3,
    lineHeight: 43,
  },
  subtitle: {
    color: "#A8B6CE",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 340,
  },
  photoFrame: {
    borderColor: "#30435F",
    borderRadius: 26,
    borderWidth: 1,
    height: 246,
    marginHorizontal: 20,
    marginTop: 24,
    overflow: "hidden",
  },
  photoStarOne: {
    backgroundColor: "#DDF8FF",
    borderRadius: 2,
    height: 3,
    left: "16%",
    opacity: 0.62,
    position: "absolute",
    top: "22%",
    width: 3,
  },
  photoStarTwo: {
    backgroundColor: "#DDF8FF",
    borderRadius: 2,
    height: 2,
    left: "76%",
    opacity: 0.52,
    position: "absolute",
    top: "31%",
    width: 2,
  },
  photoStarThree: {
    backgroundColor: "#DDF8FF",
    borderRadius: 2,
    height: 3,
    left: "61%",
    opacity: 0.58,
    position: "absolute",
    top: "14%",
    width: 3,
  },
  emptyPhoto: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  cameraCircle: {
    alignItems: "center",
    backgroundColor: "rgba(120,230,255,0.1)",
    borderColor: "rgba(120,230,255,0.4)",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  cameraGlyph: { color: "#78E6FF", fontSize: 25 },
  emptyPhotoTitle: {
    color: "#F1F5FF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyPhotoSubtitle: {
    color: "#8091AA",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  horizonBack: {
    backgroundColor: "#09121E",
    bottom: -28,
    height: 92,
    left: -18,
    position: "absolute",
    transform: [{ rotate: "8deg" }],
    width: "62%",
  },
  horizonFront: {
    backgroundColor: "#060B13",
    bottom: -18,
    height: 88,
    position: "absolute",
    right: -20,
    transform: [{ rotate: "-7deg" }],
    width: "65%",
  },
  lightTrailGlow: {
    backgroundColor: "rgba(168,219,255,0.15)",
    borderRadius: 7,
    height: 12,
    left: "31%",
    position: "absolute",
    top: "40%",
    transform: [{ rotate: "-23deg" }],
    width: 156,
  },
  lightTrail: {
    backgroundColor: "#DFF7FF",
    borderRadius: 2,
    height: 2,
    left: "33%",
    position: "absolute",
    shadowColor: "#78E6FF",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    top: "41%",
    transform: [{ rotate: "-23deg" }],
    width: 142,
  },
  photoStatus: {
    alignItems: "center",
    backgroundColor: "rgba(8,20,35,0.86)",
    borderColor: "rgba(120,230,255,0.44)",
    borderRadius: 16,
    borderWidth: 1,
    bottom: 14,
    flexDirection: "row",
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    position: "absolute",
  },
  photoStatusIcon: { color: "#7CF3C5", fontSize: 11, marginRight: 7 },
  photoStatusText: { color: "#CDEBF4", fontSize: 10, fontWeight: "600" },
  photoActions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 10,
  },
  photoAction: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.72)",
    borderColor: "#30435F",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
  },
  photoActionIcon: { color: "#78E6FF", fontSize: 18, marginRight: 8 },
  photoActionText: { color: "#F1F5FF", fontSize: 12, fontWeight: "600" },
  section: { marginHorizontal: 20, marginTop: 25 },
  sectionLabel: {
    color: "#A8B6CE",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  inputWrap: {
    backgroundColor: "rgba(17,26,43,0.7)",
    borderColor: "#344967",
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 126,
    overflow: "hidden",
  },
  input: {
    color: "#F1F5FF",
    fontSize: 14,
    lineHeight: 21,
    minHeight: 100,
    padding: 16,
    paddingBottom: 30,
  },
  characterCount: {
    bottom: 11,
    color: "#71819B",
    fontSize: 9,
    position: "absolute",
    right: 14,
  },
  metadataCard: {
    backgroundColor: "rgba(17,26,43,0.58)",
    borderColor: "#2C3D59",
    borderRadius: 22,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 20,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  metadataRow: { alignItems: "center", flexDirection: "row", minHeight: 76 },
  metadataIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(120,230,255,0.08)",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    marginRight: 12,
    width: 34,
  },
  metadataIcon: { color: "#78E6FF", fontSize: 20 },
  metadataCopy: { flex: 1 },
  metadataLabel: {
    color: "#71819B",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  metadataValue: {
    color: "#F1F5FF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  metadataNote: { color: "#8091AA", fontSize: 9, marginTop: 3 },
  metadataChevron: { color: "#78E6FF", fontSize: 25 },
  metadataDivider: { backgroundColor: "#2C3D59", height: 1, marginLeft: 46 },
  visibilitySelector: { flexDirection: "row", gap: 10 },
  visibilityOption: {
    alignItems: "center",
    backgroundColor: "rgba(17,26,43,0.55)",
    borderColor: "#2C3D59",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    minHeight: 72,
    padding: 13,
  },
  visibilityOptionActive: {
    backgroundColor: "rgba(24,70,86,0.62)",
    borderColor: "#78E6FF",
  },
  visibilityIcon: { color: "#8091AA", fontSize: 19, marginRight: 9 },
  visibilityTitle: { color: "#A8B6CE", fontSize: 12, fontWeight: "700" },
  visibilityTextActive: { color: "#78E6FF" },
  visibilitySubtitle: { color: "#71819B", fontSize: 8, marginTop: 3 },
  privacyNotice: {
    alignItems: "flex-start",
    backgroundColor: "rgba(124,243,197,0.07)",
    borderColor: "rgba(124,243,197,0.2)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 10,
    padding: 11,
  },
  privacyNoticeIcon: { color: "#7CF3C5", fontSize: 11, marginRight: 8 },
  privacyNoticeText: { color: "#8FB7AC", flex: 1, fontSize: 9, lineHeight: 13 },
  errorNotice: {
    backgroundColor: "rgba(255,102,128,0.1)",
    borderColor: "rgba(255,102,128,0.42)",
    borderRadius: 15,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
  },
  errorNoticeText: {
    color: "#FF9CAF",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#78E6FF",
    borderRadius: 21,
    flexDirection: "row",
    height: 64,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },
  saveIcon: { color: "#061524", fontSize: 17, marginRight: 10 },
  saveText: { color: "#061524", fontSize: 16, fontWeight: "800" },
  footerNote: {
    color: "#71819B",
    fontSize: 9,
    marginHorizontal: 30,
    marginTop: 14,
    textAlign: "center",
  },
});
