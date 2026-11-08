/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AppState,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { quietPixelStorei } from "@/components/three/expoGl";
import colors from "@/theme/colors";
import {
  advanceGatewayScene,
  createGatewayScene,
  resizeGatewayScene,
  type GatewayPointer,
} from "./gatewayScene";

type Props = {
  height?: number;
  still?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function OrbitalGateway({ height, still = false, style }: Props) {
  const reduceMotion = useReducedMotion();
  const [foreground, setForeground] = useState(
    () =>
      AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const pointer = useRef<GatewayPointer>({
    x: 0,
    y: 0,
    dragging: false,
    pulse: 0,
  });
  const size = useRef({ width: 1, height: height ?? 1 });
  const invalidate = useRef<(() => void) | null>(null);
  const paused = still || reduceMotion;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      pointer.current.dragging = false;
      setForeground(state === "active");
    });
    return () => subscription.remove();
  }, []);

  const start = useRef({ x: 0, y: 0 });
  const distance = useRef(0);

  return (
    <View
      style={[
        {
          height,
          flex: height === undefined ? 1 : undefined,
          backgroundColor: colors.space,
          overflow: "hidden",
        },
        style,
      ]}
      onLayout={({ nativeEvent }) => {
        size.current = {
          width: Math.max(1, nativeEvent.layout.width),
          height: Math.max(1, nativeEvent.layout.height),
        };
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Canvas
          flat
          gl={{ antialias: false, alpha: false, depth: false, stencil: false }}
          camera={{ position: [0, 0, 4.8], fov: 45, near: 0.1, far: 30 }}
          frameloop={!foreground ? "never" : paused ? "demand" : "always"}
          onCreated={(state) => {
            quietPixelStorei(state);
            invalidate.current = state.invalidate;
          }}
        >
          <color attach="background" args={[colors.space]} />
          <Scene pointer={pointer} still={paused} />
        </Canvas>
      </View>
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={({ nativeEvent }) => {
          start.current = { x: nativeEvent.pageX, y: nativeEvent.pageY };
          distance.current = 0;
          pointer.current.dragging = true;
          pointer.current.x = 0;
          pointer.current.y = 0;
          invalidate.current?.();
        }}
        onResponderMove={({ nativeEvent }) => {
          const dx = nativeEvent.pageX - start.current.x;
          const dy = nativeEvent.pageY - start.current.y;
          distance.current = Math.max(distance.current, Math.hypot(dx, dy));
          pointer.current.x = Math.max(
            -1,
            Math.min(1, dx / size.current.width),
          );
          pointer.current.y = Math.max(
            -1,
            Math.min(1, dy / size.current.height),
          );
          invalidate.current?.();
        }}
        onResponderRelease={({ nativeEvent }) => {
          const moved = Math.max(
            distance.current,
            Math.hypot(
              nativeEvent.pageX - start.current.x,
              nativeEvent.pageY - start.current.y,
            ),
          );
          pointer.current.dragging = false;
          if (moved < 8) pointer.current.pulse++;
          invalidate.current?.();
        }}
        onResponderTerminate={() => {
          pointer.current.dragging = false;
          invalidate.current?.();
        }}
        onResponderTerminationRequest={() => true}
      />
    </View>
  );
}

function Scene({
  pointer,
  still,
}: {
  pointer: RefObject<GatewayPointer>;
  still: boolean;
}) {
  const scene = useMemo(() => createGatewayScene(), []);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    resizeGatewayScene(scene, size.width, size.height, gl.getPixelRatio());
    invalidate();
  }, [gl, invalidate, scene, size.height, size.width]);

  useEffect(() => {
    invalidate();
  }, [invalidate, still]);

  useEffect(() => () => scene.dispose(), [scene]);

  useFrame((_, delta) => {
    advanceGatewayScene(scene, pointer.current, delta, still);
  });

  return <primitive object={scene.root} dispose={null} />;
}
