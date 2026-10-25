// NativeWind only understands className on React Native's own components.
// Register the other components we style so they take className too.
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";
import Svg from "react-native-svg";

cssInterop(Animated.View, { className: "style" });
cssInterop(Image, { className: "style" });
cssInterop(LinearGradient, { className: "style" });
cssInterop(Svg, { className: "style" });
