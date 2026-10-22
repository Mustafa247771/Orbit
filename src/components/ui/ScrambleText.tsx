import { useEffect, useState } from "react";
import { Text, type TextProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";
const FRAME_MS = 40;

type ScrambleTextProps = TextProps & {
  text: string;

  duration?: number;
};

export function ScrambleText({
  text,
  duration = 700,
  ...props
}: ScrambleTextProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(() => text.replace(/\S/g, "_"));

  useEffect(() => {
    if (reduceMotion) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const settled = Math.floor(progress * text.length);
      const letters = [...text].map((letter, i) =>
        i < settled || letter === " "
          ? letter
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      );
      setShown(letters.join(""));
      if (progress === 1) clearInterval(timer);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [text, duration, reduceMotion]);

  return (
    <Text accessibilityLabel={text} {...props}>
      {reduceMotion ? text : shown}
    </Text>
  );
}
