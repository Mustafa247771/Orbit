import type { ReactNode } from "react";
import { Text, View } from "react-native";

type SettingRowProps = {
  label: string;
  hint?: string;
  monoHint?: boolean;
  last?: boolean;
  children?: ReactNode;
};

export function SettingRow({
  label,
  hint,
  monoHint = false,
  last = false,
  children,
}: SettingRowProps) {
  return (
    <View
      className={`min-h-[60px] flex-row items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-line"}`}
    >
      <View className="flex-1 gap-1">
        <Text className="text-[15px] font-semibold text-ink">{label}</Text>
        {hint ? (
          <Text
            className={
              monoHint
                ? "font-mono text-[11px] uppercase tracking-[1.5px] text-muted"
                : "text-[13px] leading-[18px] text-muted"
            }
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
