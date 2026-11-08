import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

type AccountActionsProps = {
  version: string;
  onSignOut: () => void;
  onDelete: () => void;
  signingOut?: boolean;
  error?: string | null;
};

/** Sign out, delete account, and the app version. */
export function AccountActions({
  version,
  onSignOut,
  onDelete,
  signingOut = false,
  error,
}: AccountActionsProps) {
  return (
    <View className="mx-5 mt-10 gap-1.5">
      <Button
        label="Sign out"
        icon="logout"
        variant="outline"
        tone="danger"
        size="lg"
        onPress={onSignOut}
        loading={signingOut}
      />
      <Button
        label="Delete account"
        variant="ghost"
        tone="danger"
        onPress={onDelete}
        disabled={signingOut}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-center text-sm leading-6 text-danger"
        >
          {error}
        </Text>
      ) : null}
      <Label className="mt-2.5 text-center">Orbit {version}</Label>
    </View>
  );
}
