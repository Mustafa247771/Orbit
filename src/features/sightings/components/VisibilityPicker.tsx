import { Text, View } from "react-native";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { VISIBILITY_OPTIONS, type SightingVisibility } from "../model/Sighting";

const HINTS: Record<SightingVisibility, string> = {
  private: "Only you can see it, in your journal.",
  community:
    "Shared with your city only. Exact GPS and photo metadata are removed before publishing.",
};

type VisibilityPickerProps = {
  value: SightingVisibility;
  onChange: (value: SightingVisibility) => void;
};

/** Private journal entry or a community post. */
export function VisibilityPicker({ value, onChange }: VisibilityPickerProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Visibility" />
      <SegmentedControl
        label="Sighting visibility"
        options={VISIBILITY_OPTIONS}
        value={value}
        onChange={onChange}
        tone="cyan"
      />
      <Text className="mt-3 text-[13px] leading-[18px] text-muted">
        {HINTS[value]}
      </Text>
    </View>
  );
}
