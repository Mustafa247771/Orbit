import type { RootState } from "@react-three/fiber/native";
import { setConsoleFunction, ShaderChunk } from "three";

// Harmless three warnings on expo-gl:
// - R3F 9 still creates a THREE.Clock for every <Canvas>, and three r183+ deprecates it.
// - R3F calls forceContextLoss() on unmount, but expo-gl has no WEBGL_lose_context
//   (GLView frees the context itself).
const IGNORED_WARNINGS = [
  "THREE.Clock:",
  "THREE.WebGLRenderer: WEBGL_lose_context",
];

setConsoleFunction((type, message, ...params) => {
  if (IGNORED_WARNINGS.some((prefix) => message.startsWith(prefix))) return;
  console[type](message, ...params);
});

// three's PhysicalMaterial shader struct always has a `dispersion` field but only sets it when
// dispersion is on, so phone GPU drivers warn that material.dispersion is used uninitialised.
ShaderChunk.lights_physical_fragment =
  ShaderChunk.lights_physical_fragment.replace(
    "PhysicalMaterial material;",
    "PhysicalMaterial material;\nmaterial.dispersion = 0.0;",
  );

/**
 * Use as <Canvas onCreated>. expo-gl only supports these two pixelStorei settings and logs
 * "EXGL: gl.pixelStorei() doesn't support this parameter yet!" for every other one three sets.
 */
export function quietPixelStorei({ gl }: RootState) {
  const context = gl.getContext();
  const pixelStorei = context.pixelStorei.bind(context);
  context.pixelStorei = (name, value) => {
    if (
      name === context.UNPACK_FLIP_Y_WEBGL ||
      name === context.UNPACK_ALIGNMENT
    ) {
      pixelStorei(name, value);
    }
  };
}

type Finger = {
  identifier: number;
  locationX: number;
  locationY: number;
  pageX: number;
  pageY: number;
};
type CanvasEvent = Partial<Finger> & {
  type: string;
  changedTouches?: Finger[];
  pointerId?: number;
  offsetX?: number;
  offsetY?: number;
};
type TouchCanvas = { dispatchEvent: (event: CanvasEvent) => void };

const PER_FINGER = new Set(["pointerdown", "pointermove", "pointerup"]);

/**
 * Use as <Canvas onCreated>. R3F native turns each touch event into one pointer event for its
 * first finger only, so OrbitControls loses the other finger: pinch jumps, and when both fingers
 * lift together one stays "down" forever and every later drag keeps zooming. This sends one
 * pointer event per finger, and lets go of any finger still down when the gesture ends.
 */
export function fixMultiTouch({ gl }: RootState) {
  const canvas = gl.domElement as unknown as TouchCanvas;
  const dispatch = canvas.dispatchEvent.bind(canvas);
  const down = new Set<number>();

  canvas.dispatchEvent = (event) => {
    if (PER_FINGER.has(event.type) && event.changedTouches?.length) {
      for (const touch of event.changedTouches) {
        if (event.type === "pointerdown") down.add(touch.identifier);
        if (event.type === "pointerup") down.delete(touch.identifier);
        dispatch({
          ...event,
          ...touch,
          offsetX: touch.locationX,
          offsetY: touch.locationY,
          pointerId: touch.identifier,
        });
      }
      return;
    }

    dispatch(event);
    // Last finger lifted, or another view took the touch: release whatever is left.
    if (event.type === "pointerleave" || event.type === "lostpointercapture") {
      for (const id of down)
        dispatch({ ...event, type: "pointercancel", pointerId: id });
      down.clear();
    }
  };
}
