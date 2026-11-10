import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { REPORT_REASONS, type ReportReason } from "../model/communityTypes";
import { REPORT_NOTE_MAX, type ReportErrors } from "../model/reportValidation";

type ReportSheetProps = {
  visible: boolean;
  reason: ReportReason | null;
  note: string;
  errors: ReportErrors;
  error: string | null;
  busy: boolean;
  onClose: () => void;
  onReason: (value: ReportReason) => void;
  onNote: (value: string) => void;
  onSubmit: () => void;
};

export function ReportSheet({
  visible,
  reason,
  note,
  errors,
  error,
  busy,
  onClose,
  onReason,
  onNote,
  onSubmit,
}: ReportSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close report"
      title="Report post"
      eyebrow="Care for the community"
    >
      <ScrollView
        className="mt-3 shrink"
        contentContainerClassName="gap-4 pb-3"
        keyboardShouldPersistTaps="handled"
      >
        <Label>Choose a reason</Label>
        <View className="flex-row flex-wrap gap-2">
          {REPORT_REASONS.map((item) => (
            <Button
              key={item.value}
              label={item.label}
              tone="cyan"
              disabled={busy}
              variant={item.value === reason ? "solid" : "outline"}
              onPress={() => onReason(item.value)}
            />
          ))}
        </View>
        <FormMessage>{errors.reason}</FormMessage>
        <TextField
          label="Note (optional)"
          value={note}
          onChangeText={onNote}
          editable={!busy}
          multiline
          autoCapitalize="sentences"
          error={errors.note}
        />
        <Label
          tone={note.trim().length > REPORT_NOTE_MAX ? "danger" : "muted"}
        >{`${note.trim().length}/${REPORT_NOTE_MAX}`}</Label>
        <FormMessage>{error}</FormMessage>
        <Button label="Send report" loading={busy} onPress={onSubmit} />
      </ScrollView>
    </Sheet>
  );
}
