import type { ReactNode } from "react";
import { Text } from "react-native";

type FootnoteProps = {
  children: ReactNode;
};

/** Small centred note at the bottom of a screen: data sources, disclaimers. */
export function Footnote({ children }: FootnoteProps) {
  return (
    <Text className="mx-8 mt-6 text-center text-xs leading-5 text-muted">
      {children}
    </Text>
  );
}
