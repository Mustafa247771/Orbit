import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { Label } from "./Label";

type SettingRowProps = {
  label: string;
  hint?: string;
  monoHint?: boolean;
  last?: boolean;
  children?: ReactNode;
};

/** One row in a settings card: label, optional hint, and a control on the right. */
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
        {hint && monoHint ? <Label>{hint}</Label> : null}
        {hint && !monoHint ? (
          <Text className="text-[13px] leading-[18px] text-muted">{hint}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
