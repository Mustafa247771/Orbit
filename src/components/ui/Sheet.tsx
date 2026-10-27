import type { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconButton } from "./IconButton";
import { Label } from "./Label";

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Read by screen readers on the close button and the backdrop. */
  closeLabel: string;
  eyebrow?: string;
  title?: string;
  children: ReactNode;
};

/** Bottom sheet: dimmed backdrop, grab handle, optional title, close button. */
export function Sheet({
  visible,
  onClose,
  closeLabel,
  eyebrow,
  title,
  children,
}: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          onPress={onClose}
          accessibilityLabel={closeLabel}
          className="absolute inset-0 bg-black/60"
        />
        <SafeAreaView
          edges={["bottom"]}
          className="max-h-[85%] rounded-t-[32px] border-t border-line bg-surface px-5 pb-4 pt-3"
        >
          <View className="h-1.5 w-10 self-center rounded-full bg-line" />
          <View className="mt-3 flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              {eyebrow ? <Label>{eyebrow}</Label> : null}
              {title ? (
                <Text
                  numberOfLines={1}
                  className="text-base font-semibold text-ink"
                >
                  {title}
                </Text>
              ) : null}
            </View>
            <IconButton icon="close" label={closeLabel} onPress={onClose} />
          </View>
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
