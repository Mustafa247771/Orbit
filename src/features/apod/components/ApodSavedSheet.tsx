import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { StateMessage } from "@/components/ui/StateMessage";
import { useReduceMotion } from "@/core/preferences";
import colors from "@/theme/colors";

export type ApodSavedItem = {
  date: string;
  title: string;
  thumbnailUrl: string | null;
  imageUrl: string | null;
};

export type ApodSavedSheetProps = {
  visible: boolean;
  items: readonly ApodSavedItem[];
  onSelect: (date: string) => void;
  onRemove: (date: string) => void;
  onClose: () => void;
  error: string | null;
};

function SavedCard({
  item,
  onSelect,
  onRemove,
}: {
  item: ApodSavedItem;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReduceMotion();
  const uri = item.thumbnailUrl ?? item.imageUrl;
  return (
    <Card className="mb-3 p-3">
      <View className="flex-row items-center gap-3">
        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-shade">
          {uri && !failed ? (
            <Image
              source={{ uri }}
              contentFit="cover"
              transition={reduceMotion ? 0 : 150}
              accessibilityLabel={item.title}
              className="h-full w-full"
              onError={() => setFailed(true)}
            />
          ) : (
            <Icon name="photo" color={colors.muted} />
          )}
        </View>
        <View className="flex-1 gap-2">
          <Label>{item.date}</Label>
          <Text numberOfLines={3} className="font-display text-base text-ink">
            {item.title}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Button
          label="Explore"
          accessibilityLabel={`Explore saved discovery ${item.date}: ${item.title}`}
          tone="cyan"
          variant="outline"
          onPress={onSelect}
        />
        <Button
          label="Remove"
          accessibilityLabel={`Remove ${item.title} from saved discoveries`}
          icon="remove"
          tone="danger"
          variant="ghost"
          onPress={onRemove}
        />
      </View>
    </Card>
  );
}

export function ApodSavedSheet({
  visible,
  items,
  onSelect,
  onRemove,
  onClose,
  error,
}: ApodSavedSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close saved discoveries"
      eyebrow={`${items.length} saved`}
      title="Saved discoveries"
    >
      <FormMessage className="mt-3">{error}</FormMessage>
      <FlatList
        className="mt-4 shrink"
        data={items}
        keyExtractor={(item) =>
          `${item.date}-${item.thumbnailUrl ?? item.imageUrl}`
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <StateMessage
            title="Your universe starts here"
            message="Favourite a discovery to find it here later."
          />
        }
        renderItem={({ item }) => (
          <SavedCard
            item={item}
            onSelect={() => onSelect(item.date)}
            onRemove={() => onRemove(item.date)}
          />
        )}
      />
    </Sheet>
  );
}
