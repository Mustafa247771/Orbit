import { Text } from "react-native";

type ScreenTitleProps = {
  children: string;
};

export function ScreenTitle({ children }: ScreenTitleProps) {
  return (
    <Text
      accessibilityRole="header"
      className="px-5 pt-7 font-display text-[40px] leading-[42px] tracking-[-1.5px] text-ink"
    >
      {children}
    </Text>
  );
}
