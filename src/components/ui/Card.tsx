import type { ReactNode } from "react";
import { View } from "react-native";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-3xl border border-line bg-surface/80 ${className}`}
    >
      {children}
    </View>
  );
}
