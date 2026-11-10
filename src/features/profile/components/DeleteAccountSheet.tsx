import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";

type DeleteAccountSheetProps = {
  visible: boolean;
  method: "password" | "google" | null;
  confirmText: string;
  password: string;
  confirmTextError?: string;
  passwordError?: string;
  busy: boolean;
  error: string | null;
  onChangeConfirmText: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/** Danger-zone sheet: confirm by typing DELETE, then prove it is you. */
export function DeleteAccountSheet({
  visible,
  method,
  confirmText,
  password,
  confirmTextError,
  passwordError,
  busy,
  error,
  onChangeConfirmText,
  onChangePassword,
  onSubmit,
  onClose,
}: DeleteAccountSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close delete account"
      eyebrow="Danger zone"
      title="Delete account"
    >
      <View className="mt-4 gap-4">
        <Text className="text-sm leading-6 text-pale">
          This removes your account and this device&apos;s profile data:
          settings, saved locations and your photo. It cannot be undone.
        </Text>
        <TextField
          label="Type DELETE to confirm"
          value={confirmText}
          onChangeText={onChangeConfirmText}
          placeholder="DELETE"
          autoCapitalize="characters"
          editable={!busy}
          error={confirmTextError}
        />
        {method === "password" ? (
          <TextField
            label="Password"
            value={password}
            onChangeText={onChangePassword}
            placeholder="Your current password"
            secureTextEntry
            autoComplete="current-password"
            editable={!busy}
            error={passwordError}
            onSubmitEditing={onSubmit}
          />
        ) : null}
        {method === "google" ? (
          <FormMessage tone="muted">
            Google will ask you to confirm it is you.
          </FormMessage>
        ) : null}
        <FormMessage>{error}</FormMessage>
        <Button
          label="Delete account"
          tone="danger"
          size="lg"
          onPress={onSubmit}
          loading={busy}
        />
        <Button label="Cancel" variant="ghost" onPress={onClose} disabled={busy} />
      </View>
    </Sheet>
  );
}
