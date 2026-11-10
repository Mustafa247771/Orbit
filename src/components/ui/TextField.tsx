import { useState, type ReactNode, type Ref } from "react";
import { Text, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";

import colors from "@/theme/colors";
import { FormMessage } from "./FormMessage";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  rightAction?: ReactNode;
  ref?: Ref<TextInputInstance>;
};

/** Labelled text input with focus and error borders. Pass rightAction for links like "Show". */
export function TextField({
  label,
  error,
  rightAction,
  ref,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = error ? "border-danger" : focused ? "border-cyan" : "border-line";

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-pale">{label}</Text>
        {rightAction}
      </View>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        selectionColor={colors.cyan}
        underlineColorAndroid="transparent"
        {...props}
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`h-14 rounded-2xl border bg-space/80 px-4 text-base text-ink ${borderClass}`}
      />
      <FormMessage size="xs">{error}</FormMessage>
    </View>
  );
}
