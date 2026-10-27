import { ActivityIndicator, Text } from "react-native";

import colors from "@/theme/colors";
import { Button } from "./Button";
import { Card } from "./Card";

type StateMessageProps = {
  title?: string;
  message?: string | null;
  loading?: boolean;
  onRetry?: () => void;
};

/** Loading, error and empty states: one card with an optional spinner and retry. */
export function StateMessage({
  title,
  message,
  loading = false,
  onRetry,
}: StateMessageProps) {
  return (
    <Card className="mx-5 mt-5 items-center gap-2 p-6">
      {loading ? <ActivityIndicator color={colors.cyan} /> : null}
      {title ? (
        <Text className="text-center text-[17px] font-semibold text-ink">
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text className="text-center text-sm leading-5 text-muted">
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Button
          label="Try again"
          variant="outline"
          tone="cyan"
          onPress={onRetry}
          className="mt-2"
        />
      ) : null}
    </Card>
  );
}
