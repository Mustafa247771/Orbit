import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { NAME_MAX } from "../model/profileValidation";

type EditProfileSheetProps = {
  visible: boolean;
  name: string;
  email: string;
  fieldError: string | null;
  error: string | null;
  saving: boolean;
  onChangeName: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function EditProfileSheet({
  visible,
  name,
  email,
  fieldError,
  error,
  saving,
  onChangeName,
  onSave,
  onClose,
}: EditProfileSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close edit profile"
      eyebrow="Profile"
      title="Edit profile"
    >
      <View className="mt-5 gap-4">
        <TextField
          label="Display name"
          value={name}
          onChangeText={onChangeName}
          error={fieldError ?? undefined}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={NAME_MAX}
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
        {email ? (
          <View className="gap-1">
            <Label>Email</Label>
            <Text className="text-base text-pale">{email}</Text>
          </View>
        ) : null}
        <FormMessage>{error}</FormMessage>
        <Button label="Save" onPress={onSave} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}
