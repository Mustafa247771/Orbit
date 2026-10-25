import { Easing } from "react-native-reanimated";

/** The menu turns the camera this far right (radians) to face the star chart. */
export const MENU_TURN = (40 * Math.PI) / 180;
export const MENU_TURN_MS = 1100;

/** Shared by the camera (in useFrame) and the star chart (in Reanimated) so they move as one. */
export const turnEasing = Easing.inOut(Easing.cubic);
