import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import colors from "@/theme/colors";

type PhotoPickerProps = {
  photoUri: string | null;
  takingPhoto: boolean;
  choosingPhoto: boolean;
  disabled: boolean;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
};

/** The sighting photo, with buttons to take or pick one. */
export function PhotoPicker({
  photoUri,
  takingPhoto,
  choosingPhoto,
  disabled,
  onTakePhoto,
  onChoosePhoto,
}: PhotoPickerProps) {
  return (
    <View className="mx-5 mt-6 gap-2.5">
      <Pressable
        onPress={onChoosePhoto}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          photoUri ? "Change sighting photo" : "Choose a sighting photo"
        }
        className="active:opacity-80"
      >
        <Card className="h-60">
          {photoUri ? (
            <>
              <Image
                source={{ uri: photoUri }}
                contentFit="cover"
                transition={300}
                className="flex-1"
              />
              <View className="absolute bottom-3.5 left-3.5">
                <Tag label="Photo selected" tone="cyan" />
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center gap-2 px-6">
              <Icon name="camera" size={28} color={colors.cyan} />
              <Text className="mt-1 text-[17px] font-semibold text-ink">
                Add a view of the sky
              </Text>
              <Text className="text-center text-[13px] text-muted">
                Take a photo or choose one from your library
              </Text>
            </View>
          )}
        </Card>
      </Pressable>

      <View className="flex-row gap-2.5">
        <Button
          label="Take photo"
          icon="camera"
          variant="outline"
          tone="cyan"
          loading={takingPhoto}
          disabled={disabled}
          onPress={onTakePhoto}
          className="flex-1"
        />
        <Button
          label="Choose photo"
          icon="photo"
          variant="outline"
          tone="cyan"
          loading={choosingPhoto}
          disabled={disabled}
          onPress={onChoosePhoto}
          className="flex-1"
        />
      </View>
    </View>
  );
}
