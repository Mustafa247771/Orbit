import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Text, View } from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { useReduceMotion } from "@/core/preferences";
import type { ApodEntry } from "../model/Apod";

export type ApodViewerProps = {
  visible: boolean;
  entry: ApodEntry | null;
  onClose: () => void;
};

function ZoomImage({
  uri,
  fallbackUri,
  title,
}: {
  uri: string;
  fallbackUri: string | null;
  title: string;
}) {
  const [source, setSource] = useState(uri);
  const reduceMotion = useReduceMotion();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const enabled = status === "ready";

  const pinch = usePinchGesture({
    enabled,
    onActivate: () => {
      "worklet";
      cancelAnimation(scale);
      cancelAnimation(x);
      cancelAnimation(y);
      startScale.set(scale.get());
    },
    onUpdate: (event) => {
      "worklet";
      const next = Math.max(1, Math.min(4, startScale.get() * event.scale));
      scale.set(next);
      const maxX = (width.get() * (next - 1)) / 2;
      const maxY = (height.get() * (next - 1)) / 2;
      x.set(Math.max(-maxX, Math.min(maxX, x.get())));
      y.set(Math.max(-maxY, Math.min(maxY, y.get())));
    },
  });
  const pan = usePanGesture({
    enabled,
    maxPointers: 1,
    onActivate: () => {
      "worklet";
      cancelAnimation(x);
      cancelAnimation(y);
      startX.set(x.get());
      startY.set(y.get());
    },
    onUpdate: (event) => {
      "worklet";
      const maxX = (width.get() * (scale.get() - 1)) / 2;
      const maxY = (height.get() * (scale.get() - 1)) / 2;
      x.set(Math.max(-maxX, Math.min(maxX, startX.get() + event.translationX)));
      y.set(Math.max(-maxY, Math.min(maxY, startY.get() + event.translationY)));
    },
  });
  const doubleTap = useTapGesture({
    enabled,
    numberOfTaps: 2,
    onActivate: () => {
      "worklet";
      const next = scale.get() > 1 ? 1 : 2.5;
      scale.set(reduceMotion ? next : withTiming(next, { duration: 180 }));
      x.set(0);
      y.set(0);
    },
  });
  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);
  const transform = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: scale.get() },
    ],
  }));
  const zoom = (next: number) => {
    cancelAnimation(scale);
    scale.set(reduceMotion ? next : withTiming(next, { duration: 180 }));
    x.set(0);
    y.set(0);
  };

  return (
    <View className="flex-1">
      <View
        className="flex-1 overflow-hidden"
        onLayout={({ nativeEvent: { layout } }) => {
          width.set(layout.width);
          height.set(layout.height);
          x.set(0);
          y.set(0);
        }}
      >
        {status !== "error" ? (
          <GestureDetector gesture={gesture} touchAction="none">
            <Animated.View className="h-full w-full" style={transform}>
              <Image
                source={{ uri: source }}
                contentFit="contain"
                transition={0}
                accessibilityLabel={title}
                className="h-full w-full"
                onLoad={() => setStatus("ready")}
                onError={() => {
                  if (fallbackUri && source !== fallbackUri) {
                    setSource(fallbackUri);
                    return;
                  }
                  setStatus("error");
                }}
              />
            </Animated.View>
          </GestureDetector>
        ) : (
          <StateMessage
            title="Picture unavailable"
            message="Close the viewer and try again when the image is available."
          />
        )}
        {status === "loading" ? (
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center gap-3 bg-space"
            accessibilityRole="progressbar"
            accessibilityLabel="Loading full resolution picture"
          >
            <Skeleton width="75%" height={200} />
            <Label>Loading full resolution</Label>
          </View>
        ) : null}
      </View>
      <View className="gap-2 px-5 py-3">
        <Text className="text-center text-xs text-muted">
          Pinch or double-tap to zoom. Drag to explore.
        </Text>
        <View className="flex-row justify-center gap-3">
          <Button
            label="Zoom in"
            variant="outline"
            tone="cyan"
            disabled={!enabled}
            onPress={() => zoom(2.5)}
          />
          <Button
            label="Reset view"
            variant="ghost"
            tone="cyan"
            disabled={!enabled}
            onPress={() => zoom(1)}
          />
        </View>
      </View>
    </View>
  );
}

export function ApodViewer({ visible, entry, onClose }: ApodViewerProps) {
  const reduceMotion = useReduceMotion();
  const uri = entry?.kind === "image" ? (entry.hdUrl ?? entry.imageUrl) : null;
  const fallbackUri = entry?.kind === "image" ? entry.imageUrl : null;
  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      statusBarTranslucent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView>
        <SafeAreaView className="flex-1 bg-space" accessibilityViewIsModal>
          <View className="flex-row items-center gap-3 px-5 py-3">
            <Text
              numberOfLines={2}
              accessibilityRole="header"
              className="flex-1 font-display text-lg text-ink"
            >
              {entry?.title ?? "APOD viewer"}
            </Text>
            <IconButton
              icon="close"
              label="Close picture viewer"
              onPress={onClose}
            />
          </View>
          {visible && uri ? (
            <ZoomImage
              key={`${entry?.date}-${uri}`}
              uri={uri}
              fallbackUri={fallbackUri}
              title={entry?.title ?? "NASA discovery"}
            />
          ) : (
            <StateMessage title="No image to expand" />
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}
