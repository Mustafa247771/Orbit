import { TextInput, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { SectionLabel } from "@/components/ui/SectionLabel";
import colors from "@/theme/colors";

const MAX_LENGTH = 240;

type CaptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

/** What the observer noticed, up to 240 characters. */
export function CaptionField({ value, onChange }: CaptionFieldProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Your observation" />
      <Card className="p-4">
        <TextInput
          accessibilityLabel="Observation caption"
          multiline
          maxLength={MAX_LENGTH}
          value={value}
          onChangeText={onChange}
          placeholder="What did you notice?"
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          className="min-h-[96px] text-[15px] leading-[22px] text-ink"
        />
        <Label className="mt-2 text-right">
          {value.length}/{MAX_LENGTH}
        </Label>
      </Card>
    </View>
  );
}
